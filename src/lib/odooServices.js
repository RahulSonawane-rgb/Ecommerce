import { OdooClient, searchRead, create, write, unlink, callKw } from './odooClient';

// Data mappers between Odoo models and app shapes
function mapProductFromOdoo(record) {
  return {
    id: record.id,
    name: record.name,
    price: record.list_price,
    image: record.image_1920 ? `data:image/png;base64,${record.image_1920}` : undefined,
    description: record.description || '',
    sku: record.default_code || '',
    inventory: record.qty_available,
    active: record.active,
  };
}

function mapOrderFromOdoo(record) {
  return {
    id: record.name, // e.g., SO123
    odooId: record.id,
    status: record.state === 'draft' ? 'pending' : record.state === 'sale' ? 'processing' : record.state === 'done' ? 'delivered' : record.state === 'cancel' ? 'cancelled' : record.state,
    paymentMethod: record.payment_term_id?.[1] || 'N/A',
    createdAt: record.create_date,
    updatedAt: record.write_date,
    total: record.amount_total,
    shipping: record.amount_delivery || 0,
    customer: {
      id: record.partner_id?.[0],
      name: record.partner_id?.[1],
      email: record.partner_email || '',
    },
    items: (record.order_line || []).map(line => ({
      id: line[0],
      name: line[1],
      quantity: 1, // fallback; detailed lines require separate read
      price: 0,
    })),
  };
}

export const OdooProducts = {
  async list({ limit = 80, offset = 0 } = {}) {
    const fields = ['name', 'list_price', 'image_1920', 'description', 'default_code', 'qty_available', 'active'];
    const records = await searchRead('product.template', [['sale_ok', '=', true], ['active', '=', true]], fields, limit, offset, 'id desc');
    return records.map(mapProductFromOdoo);
  },

  async getById(id) {
    const [record] = await searchRead('product.template', [['id', '=', id]], ['name', 'list_price', 'image_1920', 'description', 'default_code', 'qty_available', 'active'], 1);
    return record ? mapProductFromOdoo(record) : null;
  },

  async ensureProductByName(name, price) {
    const existing = await searchRead('product.template', [['name', '=', name]], ['id', 'name'], 1);
    if (existing && existing.length) return existing[0].id;
    const productId = await create('product.template', {
      name,
      list_price: price,
      type: 'product',
      sale_ok: true,
      purchase_ok: true,
    });
    return productId;
  },

  async create(product) {
    const id = await create('product.template', {
      name: product.name,
      list_price: product.price,
      default_code: product.sku,
      sale_ok: true,
      type: 'product',
      active: true,
      description: product.description || '',
    });
    return id;
  },

  async update(id, updates) {
    return write('product.template', [id], {
      name: updates.name,
      list_price: updates.price,
      default_code: updates.sku,
      description: updates.description,
      active: updates.active,
    });
  },

  async remove(id) {
    return unlink('product.template', [id]);
  },
};

export const OdooCustomers = {
  async ensurePartner({ name, email, street, city, state, zip, country }) {
    let partnerId = null;
    if (email) {
      const existing = await searchRead('res.partner', [['email', '=', email]], ['id'], 1);
      if (existing && existing.length) partnerId = existing[0].id;
    }
    if (!partnerId) {
      partnerId = await create('res.partner', {
        name,
        email,
        street,
        city,
        state_id: undefined,
        zip,
        country_id: undefined,
        customer_rank: 1,
      });
    }
    return partnerId;
  },
};

export const OdooOrders = {
  async list({ limit = 80, offset = 0 } = {}) {
    const fields = ['name', 'id', 'state', 'partner_id', 'partner_email', 'create_date', 'write_date', 'amount_total', 'amount_delivery', 'order_line'];
    const records = await searchRead('sale.order', [], fields, limit, offset, 'id desc');
    return records.map(mapOrderFromOdoo);
  },

  async createFromCart({ customer, items, shipping = 0, note }) {
    const partnerId = await OdooCustomers.ensurePartner({
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email,
      street: customer.address,
      city: customer.city,
      state: customer.state,
      zip: customer.zipCode,
      country: customer.country,
    });

    // Ensure products and build order lines
    const orderLines = [];
    for (const item of items) {
      const productTemplateId = await OdooProducts.ensureProductByName(item.name, item.price);
      // Find a variant (product.product) for the template
      const variants = await searchRead('product.product', [['product_tmpl_id', '=', productTemplateId]], ['id'], 1);
      const productId = variants && variants.length ? variants[0].id : null;
      orderLines.push([0, 0, { product_id: productId, name: item.name, product_uom_qty: item.quantity, price_unit: item.price }]);
    }

    const orderId = await create('sale.order', {
      partner_id: partnerId,
      order_line: orderLines,
      note: note || '',
    });

    // Confirm order
    await callKw('sale.order', 'action_confirm', [[orderId]]);

    return orderId;
  },

  async getByIdName(name) {
    const records = await searchRead('sale.order', [['name', '=', name]], ['id', 'name', 'state', 'partner_id', 'partner_email', 'create_date', 'write_date', 'amount_total', 'amount_delivery', 'order_line'], 1);
    return records.length ? mapOrderFromOdoo(records[0]) : null;
  },

  async updateStatus(odooId, status) {
    // Map app status to Odoo actions
    switch (status) {
      case 'processing':
        // already confirmed
        return true;
      case 'cancelled':
        return callKw('sale.order', 'action_cancel', [[odooId]]);
      case 'delivered':
        // Mark done by validating pickings
        return OdooDelivery.validatePickingsForSaleOrder(odooId);
      default:
        return true;
    }
  },
};

export const OdooInvoices = {
  async createAndPostForOrder(orderId) {
    const invoiceIds = await callKw('sale.order', '_create_invoices', [[orderId]]);
    if (invoiceIds && invoiceIds.length) {
      await callKw('account.move', 'action_post', [invoiceIds]);
      return invoiceIds[0];
    }
    return null;
  },

  async getPdf(invoiceId) {
    // Requires Odoo report configured; fallback: return null
    try {
      const result = await callKw('ir.actions.report', 'sudo', []);
      return result && invoiceId ? null : null;
    } catch {
      return null;
    }
  },
};

export const OdooDelivery = {
  async getPickingsForSaleOrder(orderId) {
    const pickings = await searchRead('stock.picking', [['sale_id', '=', orderId]], ['id', 'state', 'name', 'picking_type_id']);
    return pickings;
  },

  async validatePickingsForSaleOrder(orderId) {
    const pickings = await searchRead('stock.picking', [['sale_id', '=', orderId]], ['id', 'state']);
    for (const p of pickings) {
      if (p.state !== 'done') {
        try {
          await callKw('stock.picking', 'button_validate', [[p.id]]);
        } catch (e) {
          // try assign then validate
          try { await callKw('stock.picking', 'action_assign', [[p.id]]); } catch {}
          await callKw('stock.picking', 'button_validate', [[p.id]]);
        }
      }
    }
    return true;
  },
};






