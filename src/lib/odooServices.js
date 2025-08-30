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
      email: record.partner_id?.[2] || '', // Get email from partner_id relation
    },
    items: (record.order_line || []).map(line => ({
      id: line[0],
      name: line[1],
      quantity: 1, // fallback; detailed lines require separate read
      price: 0,
    })),
  };
}

function mapUserFromOdoo(record) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    mobile: record.mobile,
    isActive: record.active,
    createdAt: record.create_date,
    updatedAt: record.write_date,
  };
}

function mapAddressFromOdoo(record) {
  return {
    id: record.id,
    name: record.name,
    street: record.street,
    city: record.city,
    state: record.state_id?.[1] || record.state,
    zipCode: record.zip,
    country: record.country_id?.[1] || record.country,
    isDefault: record.is_default || false,
    type: record.type || 'delivery',
  };
}

// Validation functions
export const ValidationUtils = {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validateMobile(mobile) {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  },

  validatePassword(password) {
    return password && password.length >= 6;
  },

  sanitizeInput(input) {
    return input ? input.toString().trim() : '';
  }
};

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
      type: 'consu',
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
      type: 'consu',
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

export const OdooUsers = {
  async authenticate(email, password) {
    try {
      // First check if user exists
      const existing = await searchRead('res.partner', [['email', '=', email]], ['id', 'name', 'email', 'mobile', 'active'], 1);
      
      if (!existing || existing.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      const user = existing[0];
      
      // In a real implementation, you would validate password against Odoo's user system
      // For now, we'll use a simple check (in production, use proper password hashing)
      if (!user.active) {
        throw new Error('ACCOUNT_DISABLED');
      }

      return mapUserFromOdoo(user);
    } catch (error) {
      if (error.message === 'USER_NOT_FOUND') {
        throw new Error('No account found with this email. Please create an account.');
      }
      if (error.message === 'ACCOUNT_DISABLED') {
        throw new Error('This account has been disabled. Please contact support.');
      }
      throw new Error('Authentication failed. Please try again.');
    }
  },

  async register(userData) {
    try {
      // Validate required fields
      if (!userData.name || !userData.email || !userData.mobile) {
        throw new Error('Name, email, and mobile number are required.');
      }

      if (!ValidationUtils.validateEmail(userData.email)) {
        throw new Error('Please enter a valid email address.');
      }

      if (!ValidationUtils.validateMobile(userData.mobile)) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }

      // Check if user already exists
      const existing = await searchRead('res.partner', [['email', '=', userData.email]], ['id'], 1);
      if (existing && existing.length > 0) {
        throw new Error('An account with this email already exists.');
      }

      // Create new user
      const userId = await create('res.partner', {
        name: ValidationUtils.sanitizeInput(userData.name),
        email: ValidationUtils.sanitizeInput(userData.email),
        mobile: ValidationUtils.sanitizeInput(userData.mobile),
        customer_rank: 1,
        active: true,
        is_company: false,
      });

      // Fetch the created user
      const [newUser] = await searchRead('res.partner', [['id', '=', userId]], ['id', 'name', 'email', 'mobile', 'active', 'create_date'], 1);
      
      return mapUserFromOdoo(newUser);
    } catch (error) {
      throw error;
    }
  },

  async getUserById(userId) {
    try {
      const [user] = await searchRead('res.partner', [['id', '=', userId]], ['id', 'name', 'email', 'mobile', 'active', 'create_date', 'write_date'], 1);
      return user ? mapUserFromOdoo(user) : null;
    } catch (error) {
      throw new Error('Failed to fetch user details.');
    }
  },

  async updateUser(userId, updates) {
    try {
      const updateData = {};
      
      if (updates.name) {
        updateData.name = ValidationUtils.sanitizeInput(updates.name);
      }
      
      if (updates.email) {
        if (!ValidationUtils.validateEmail(updates.email)) {
          throw new Error('Please enter a valid email address.');
        }
        updateData.email = ValidationUtils.sanitizeInput(updates.email);
      }
      
      if (updates.mobile) {
        if (!ValidationUtils.validateMobile(updates.mobile)) {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }
        updateData.mobile = ValidationUtils.sanitizeInput(updates.mobile);
      }

      await write('res.partner', [userId], updateData);
      
      // Return updated user
      return await this.getUserById(userId);
    } catch (error) {
      throw error;
    }
  }
};

export const OdooAddresses = {
  async getUserAddresses(userId) {
    try {
      const addresses = await searchRead('res.partner', [
        ['parent_id', '=', userId],
        ['type', '=', 'delivery']
      ], ['id', 'name', 'street', 'city', 'state_id', 'zip', 'country_id', 'is_default', 'type'], 0, 0, 'is_default desc, id desc');
      
      return addresses.map(mapAddressFromOdoo);
    } catch (error) {
      throw new Error('Failed to fetch addresses.');
    }
  },

  async addAddress(userId, addressData) {
    try {
      // Validate required fields
      if (!addressData.street || !addressData.city || !addressData.state || !addressData.zipCode) {
        throw new Error('Street, city, state, and ZIP code are required.');
      }

      // If this is the first address, make it default
      const existingAddresses = await this.getUserAddresses(userId);
      const isDefault = existingAddresses.length === 0;

      const addressId = await create('res.partner', {
        name: ValidationUtils.sanitizeInput(addressData.name || 'Delivery Address'),
        street: ValidationUtils.sanitizeInput(addressData.street),
        city: ValidationUtils.sanitizeInput(addressData.city),
        state: ValidationUtils.sanitizeInput(addressData.state),
        zip: ValidationUtils.sanitizeInput(addressData.zipCode),
        country: ValidationUtils.sanitizeInput(addressData.country || 'India'),
        type: 'delivery',
        is_default: isDefault,
        parent_id: userId,
        customer_rank: 0,
        supplier_rank: 0,
      });

      return await this.getAddressById(addressId);
    } catch (error) {
      throw error;
    }
  },

  async updateAddress(addressId, addressData) {
    try {
      const updateData = {};
      
      if (addressData.name) {
        updateData.name = ValidationUtils.sanitizeInput(addressData.name);
      }
      if (addressData.street) {
        updateData.street = ValidationUtils.sanitizeInput(addressData.street);
      }
      if (addressData.city) {
        updateData.city = ValidationUtils.sanitizeInput(addressData.city);
      }
      if (addressData.state) {
        updateData.state = ValidationUtils.sanitizeInput(addressData.state);
      }
      if (addressData.zipCode) {
        updateData.zip = ValidationUtils.sanitizeInput(addressData.zipCode);
      }
      if (addressData.country) {
        updateData.country = ValidationUtils.sanitizeInput(addressData.country);
      }

      await write('res.partner', [addressId], updateData);
      
      return await this.getAddressById(addressId);
    } catch (error) {
      throw new Error('Failed to update address.');
    }
  },

  async deleteAddress(addressId) {
    try {
      await unlink('res.partner', [addressId]);
      return true;
    } catch (error) {
      throw new Error('Failed to delete address.');
    }
  },

  async setDefaultAddress(userId, addressId) {
    try {
      // First, remove default from all addresses
      const allAddresses = await this.getUserAddresses(userId);
      for (const addr of allAddresses) {
        await write('res.partner', [addr.id], { is_default: false });
      }
      
      // Set the new default
      await write('res.partner', [addressId], { is_default: true });
      
      return true;
    } catch (error) {
      throw new Error('Failed to set default address.');
    }
  },

  async getAddressById(addressId) {
    try {
      const [address] = await searchRead('res.partner', [['id', '=', addressId]], ['id', 'name', 'street', 'city', 'state_id', 'zip', 'country_id', 'is_default', 'type'], 1);
      return address ? mapAddressFromOdoo(address) : null;
    } catch (error) {
      throw new Error('Failed to fetch address details.');
    }
  }
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
  async list({ limit = 80, offset = 0, userId = null } = {}) {
    try {
      let domain = [];
      
      if (userId) {
        // Get orders for specific user
        domain.push(['partner_id', '=', userId]);
      }
      
      const fields = ['name', 'id', 'state', 'partner_id', 'create_date', 'write_date', 'amount_total', 'amount_delivery', 'order_line'];
      const records = await searchRead('sale.order', domain, fields, limit, offset, 'id desc');
      
      // Enhance with detailed order line information
      const enhancedRecords = await Promise.all(records.map(async (record) => {
        const orderLines = await this.getOrderLines(record.id);
        return {
          ...record,
          order_line: orderLines
        };
      }));
      
      return enhancedRecords.map(mapOrderFromOdoo);
    } catch (error) {
      throw new Error('Failed to fetch orders.');
    }
  },

  async getOrderLines(orderId) {
    try {
      const lines = await searchRead('sale.order.line', [['order_id', '=', orderId]], ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal'], 0, 0, 'id');
      
      return lines.map(line => ({
        id: line.id,
        productId: line.product_id?.[0],
        productName: line.product_id?.[1] || line.name,
        quantity: line.product_uom_qty,
        price: line.price_unit,
        subtotal: line.price_subtotal,
      }));
    } catch (error) {
      console.error('Failed to fetch order lines:', error);
      return [];
    }
  },

  async getOrderById(orderId) {
    try {
      const [record] = await searchRead('sale.order', [['id', '=', orderId]], ['name', 'id', 'state', 'partner_id', 'create_date', 'write_date', 'amount_total', 'amount_delivery', 'order_line'], 1);
      
      if (!record) {
        throw new Error('Order not found.');
      }

      const orderLines = await this.getOrderLines(record.id);
      const enhancedRecord = {
        ...record,
        order_line: orderLines
      };

      return mapOrderFromOdoo(enhancedRecord);
    } catch (error) {
      throw new Error('Failed to fetch order details.');
    }
  },

  async createFromCart({ customer, items, shipping = 0, note, paymentMethod = 'card' }) {
    // Delegate to backend high-level endpoint to ensure invoices, delivery, labels, emails
    const res = await fetch('/api/orders/from-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, items, shipping, note, paymentMethod }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create order');
    return json.orderId;
  },

  async getByIdName(name) {
    const records = await searchRead('sale.order', [['name', '=', name]], ['id', 'name', 'state', 'partner_id', 'create_date', 'write_date', 'amount_total', 'amount_delivery', 'order_line'], 1);
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






