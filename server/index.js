import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
// import dotenv from 'dotenv';

// dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: true, credentials: true }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use('/api/', limiter);

const ODOO_URL = 'http://localhost:8069';
const ODOO_DB = 'datab';
const ODOO_LOGIN = 'admin';
const ODOO_API_KEY = '52aa10651c798e6940a0a54c29fc0588dc3a6908';

async function odooJsonRpc(endpoint, body) {
  const res = await fetch(`${ODOO_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), ...body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Odoo HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.error) {
    const message = json.error.data?.message || json.error.message || 'Odoo JSON-RPC error';
    throw new Error(message);
  }
  return json.result;
}

// -----------------------------
// Local products persistence
// -----------------------------
const PRODUCTS_FILE = path.resolve(process.cwd(), 'src', 'data', 'products.json');

async function readProductsFile() {
  try {
    const raw = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('products.json is not an array');
    return data;
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeProductsFile(products) {
  const json = JSON.stringify(products, null, 2);
  await fs.writeFile(PRODUCTS_FILE, json, 'utf-8');
}

function normalizeIncomingProduct(p) {
  return {
    name: p.name || '',
    description: p.description || '',
    price: Number(p.price) || 0,
    originalPrice: p.originalPrice !== undefined ? Number(p.originalPrice) : undefined,
    category: p.category || 'Other',
    image: p.image || '',
    images: p.images && Array.isArray(p.images) ? p.images : [p.image || ''],
    features: Array.isArray(p.features) ? p.features : [],
    inStock: p.inStock !== undefined ? !!p.inStock : true,
    stock: p.stock !== undefined ? Number(p.stock) : undefined,
    rating: p.rating !== undefined && p.rating !== null ? Number(p.rating) : 0,
    reviews: p.reviews !== undefined ? Number(p.reviews) : 0,
    featured: !!p.featured,
  };
}

app.get('/api/products', async (req, res) => {
  try {
    const products = await readProductsFile();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const incoming = req.body || {};
    const products = await readProductsFile();
    const nextId = products.length ? Math.max(...products.map(p => Number(p.id) || 0)) + 1 : 1;
    const product = { id: nextId, ...normalizeIncomingProduct(incoming) };
    products.push(product);
    await writeProductsFile(products);
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = normalizeIncomingProduct(req.body || {});
    const products = await readProductsFile();
    const idx = products.findIndex(p => Number(p.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    const updated = { ...products[idx], ...updates, id };
    products[idx] = updated;
    await writeProductsFile(products);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const products = await readProductsFile();
    const next = products.filter(p => Number(p.id) !== id);
    if (next.length === products.length) return res.status(404).json({ error: 'Product not found' });
    await writeProductsFile(next);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function odooAuthenticate() {
  console.log('Attempting Odoo authentication...');
  const params = {
    service: 'common',
    method: 'authenticate',
    args: [ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {}],
  };
  console.log('Odoo auth params:', { db: ODOO_DB, login: ODOO_LOGIN, hasKey: !!ODOO_API_KEY });
  const result = await odooJsonRpc('/jsonrpc', { method: 'call', params });
  console.log('Odoo auth result:', result);
  
  // Handle both object format (with uid property) and direct user ID number
  if (!result) throw new Error('Failed to authenticate with Odoo');
  
  // If result is a number (user ID), convert to object format
  if (typeof result === 'number') {
    return { uid: result, user_context: {} };
  }
  
  // If result is an object, check for uid
  if (!result.uid) throw new Error('Failed to authenticate with Odoo');
  return result;
}

async function odooExecuteKw(model, method, args = [], kwargs = {}) {
  const { uid } = await odooAuthenticate();
  const params = {
    service: 'object',
    method: 'execute_kw',
    args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs],
  };
  return odooJsonRpc('/jsonrpc', { method: 'call', params });
}

app.post('/api/odoo/authenticate', async (req, res) => {
  try {
    console.log('Received authenticate request');
    const result = await odooAuthenticate();
    console.log('Authentication successful:', { uid: result.uid });
    res.json({ uid: result.uid, context: result.user_context || {} });
  } catch (e) {
    console.error('Authentication failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Health and root routes to avoid 404 when checking server manually
app.get('/', (req, res) => {
  res.type('text/plain').send('Ecommerce backend is running. See GET /api/health');
});

app.get('/api', (req, res) => {
  res.type('text/plain').send('API root. See GET /api/health');
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, odooUrl: ODOO_URL });
});

app.post('/api/odoo/execute_kw', async (req, res) => {
  try {
    console.log('Received execute_kw request:', req.body);
    const { model, method, args = [], kwargs = {} } = req.body || {};
    if (!model || !method) return res.status(400).json({ error: 'model and method are required' });
    const result = await odooExecuteKw(model, method, args, kwargs);
    console.log('Execute_kw result:', result);
    res.json({ result });
  } catch (e) {
    console.error('Execute_kw failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

async function generateLabelPdfBase64({ orderId, recipientName, addressText, trackingNumber }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([420, 594]); // A5 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 1 });
  page.drawText('Shipping Label', { x: 30, y: height - 60, size: 18, font, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Order ID: ${orderId}`, { x: 30, y: height - 90, size: 12, font });
  page.drawText(`Tracking: ${trackingNumber}`, { x: 30, y: height - 110, size: 12, font });
  page.drawText('Ship To:', { x: 30, y: height - 140, size: 12, font });
  const lines = (addressText || '').split('\n');
  lines.forEach((line, idx) => page.drawText(line, { x: 30, y: height - 160 - idx * 14, size: 11, font }));
  page.drawText(recipientName || '', { x: 30, y: height - 180, size: 12, font });

  const qrData = await QRCode.toDataURL(`ORDER:${orderId}|TRACK:${trackingNumber}`);
  const qrBase64 = qrData.split(',')[1];
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
  const qrDim = 140;
  page.drawImage(qrImage, { x: width - qrDim - 40, y: 60, width: qrDim, height: qrDim });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
}

async function attachPdfToRecord({ name, base64, resModel, resId }) {
  return odooExecuteKw('ir.attachment', 'create', [[{
    name,
    type: 'binary',
    datas: base64,
    res_model: resModel,
    res_id: resId,
    mimetype: 'application/pdf',
  }]]);
}

// High-level order flow endpoint (optional for frontend convenience)
app.post('/api/orders/from-cart', async (req, res) => {
  try {
    const { customer, items, shipping = 0, note } = req.body || {};
    console.log('Received order creation request:', { 
      customer: customer?.name, 
      customerEmail: customer?.email,
      itemsCount: items?.length,
      customerData: customer 
    });
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      console.log('Invalid payload:', { customer: !!customer, items: !!items, itemsArray: Array.isArray(items), itemsLength: items?.length });
      return res.status(400).json({ error: 'Invalid payload - customer and items are required' });
    }

    // Ensure partner
    let partnerId = null;
    if (customer.email) {
      const existing = await odooExecuteKw('res.partner', 'search_read', [[['email', '=', customer.email]], ['id'], 1]);
      if (existing && existing.length) partnerId = existing[0].id;
    }
    if (!partnerId) {
      const partnerData = {
        name: `${(customer.firstName || '').trim()} ${(customer.lastName || '').trim()}`.trim() || customer.name || 'Customer',
        email: customer.email,
        street: customer.address,
        city: customer.city,
        zip: customer.zipCode,
        customer_rank: 1,
      };
      console.log('Creating new partner with data:', partnerData);
      const newPartnerId = await odooExecuteKw('res.partner', 'create', [[partnerData]]);
      console.log('New partner ID result:', newPartnerId);
      // Extract the ID from the array returned by create
      partnerId = Array.isArray(newPartnerId) ? newPartnerId[0] : newPartnerId;
      console.log('Extracted partner ID:', partnerId);
    }

        // Ensure products and build order lines
    const orderLines = [];
    for (const item of items) {
      const existingTmpl = await odooExecuteKw('product.template', 'search_read', [[['name', '=', item.name]], ['id'], 1]);
      let tmplId = existingTmpl && existingTmpl.length ? existingTmpl[0].id : null;
      if (!tmplId) {
        const newTmplId = await odooExecuteKw('product.template', 'create', [[{ name: item.name, list_price: item.price, type: 'consu', sale_ok: true, purchase_ok: true }]]);
        tmplId = Array.isArray(newTmplId) ? newTmplId[0] : newTmplId;
      }
      const variants = await odooExecuteKw('product.product', 'search_read', [[['product_tmpl_id', '=', tmplId]], ['id'], 1]);
      const productId = variants && variants.length ? variants[0].id : null;
      orderLines.push([0, 0, { product_id: productId, name: item.name, product_uom_qty: item.quantity, price_unit: item.price }]);
    }

    // Create and confirm order
    const orderData = { partner_id: partnerId, order_line: orderLines, note: note || '' };
    console.log('Creating order with data:', orderData);
    const newOrderId = await odooExecuteKw('sale.order', 'create', [[orderData]]);
    console.log('New order ID result:', newOrderId);
    const orderId = Array.isArray(newOrderId) ? newOrderId[0] : newOrderId;
    console.log('Extracted order ID:', orderId);
    await odooExecuteKw('sale.order', 'action_confirm', [[orderId]]);

    // Create and post invoice
    let invoiceId = null;
    try {
      const invoiceIds = await odooExecuteKw('sale.order', '_create_invoices', [[orderId]]);
      if (invoiceIds && invoiceIds.length) {
        await odooExecuteKw('account.move', 'action_post', [invoiceIds]);
        invoiceId = Array.isArray(invoiceIds) ? invoiceIds[0] : invoiceIds;
      }
    } catch {}

    // Validate pickings
    try {
      const pickings = await odooExecuteKw('stock.picking', 'search_read', [[['sale_id', '=', orderId]], ['id', 'state']]);
      for (const p of pickings) {
        if (p.state !== 'done') {
          try {
            await odooExecuteKw('stock.picking', 'button_validate', [[p.id]]);
          } catch (e) {
            try { await odooExecuteKw('stock.picking', 'action_assign', [[p.id]]); } catch {}
            await odooExecuteKw('stock.picking', 'button_validate', [[p.id]]);
          }
        }
      }
    } catch {}

    // Generate and attach a simple shipping label PDF to the order
    let labelAttachmentId = null;
    try {
      const trackingNumber = `TRK${Date.now()}`;
      const address = [customer.address, customer.city, customer.state, customer.zipCode, customer.country].filter(Boolean).join('\n');
      const pdfB64 = await generateLabelPdfBase64({ orderId, recipientName: customer.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : customer.name, addressText: address, trackingNumber });
      const newLabelAttachmentId = await attachPdfToRecord({ name: `ShippingLabel_${orderId}.pdf`, base64: pdfB64, resModel: 'sale.order', resId: orderId });
      labelAttachmentId = Array.isArray(newLabelAttachmentId) ? newLabelAttachmentId[0] : newLabelAttachmentId;
    } catch {}

    // Send email notifications if SMTP configured
    if (process.env.SMTP_HOST && customer.email) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: !!process.env.SMTP_SECURE,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        });
        await transporter.sendMail({
          from: process.env.MAIL_FROM || 'no-reply@example.com',
          to: customer.email,
          subject: `Order confirmation`,
          text: `Your order has been received. Order ID: ${orderId}`,
        });
      } catch {}
    }

    console.log('Order creation successful:', { orderId, invoiceId, labelAttachmentId });
    res.json({ orderId, invoiceId, labelAttachmentId });
  } catch (e) {
    console.error('Order creation failed:', e.message, e.stack);
    res.status(500).json({ error: e.message });
  }
});

// Simple email endpoint
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body || {};
    if (!process.env.SMTP_HOST) return res.status(400).json({ error: 'SMTP not configured' });
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: !!process.env.SMTP_SECURE,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    const info = await transporter.sendMail({ from: process.env.MAIL_FROM || 'no-reply@example.com', to, subject, html, text });
    res.json({ messageId: info.messageId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on http://localhost:${PORT}`);
});


