// Email service for admin notifications
// Note: This is a client-side mock implementation
// In production, you would integrate with a backend API

export class EmailService {
  static async sendOrderNotification(order, adminEmail) {
    try {
      // Mock email sending - in production this would call your backend API
      console.log('Sending order notification email:', {
        to: adminEmail,
        subject: `New Order Received - ${order.id}`,
        order: order
      });
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: `email_${Date.now()}`,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw new Error('Email notification failed');
    }
  }
  
  static async sendOrderStatusUpdate(order, customerEmail) {
    try {
      console.log('Sending order status update email:', {
        to: customerEmail,
        subject: `Order ${order.id} Status Updated`,
        order: order
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: `status_${Date.now()}`,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send status update email:', error);
      throw new Error('Status update email failed');
    }
  }
  
  static async sendInvoiceEmail(order, customerEmail, invoiceUrl) {
    try {
      console.log('Sending invoice email:', {
        to: customerEmail,
        subject: `Invoice for Order ${order.id}`,
        order: order,
        invoiceUrl: invoiceUrl
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: `invoice_${Date.now()}`,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      throw new Error('Invoice email failed');
    }
  }
  
  // Generate email templates
  static generateOrderNotificationTemplate(order) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e91e63;">New Order Received!</h2>
        <p>A new order has been placed on your website.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Customer:</strong> ${order.customer.name}</p>
          <p><strong>Email:</strong> ${order.customer.email}</p>
          <p><strong>Phone:</strong> ${order.customer.phone || 'Not provided'}</p>
          <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Items</h3>
          ${order.items.map(item => `
            <div style="margin: 10px 0; padding: 10px; border-left: 3px solid #ff9800;">
              <p><strong>${item.name}</strong></p>
              <p>Quantity: ${item.quantity} | Price: $${item.price.toFixed(2)}</p>
            </div>
          `).join('')}
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Shipping Address</h3>
          <p>${order.shippingAddress || 'No shipping address provided'}</p>
        </div>
        
        <p style="margin-top: 30px; color: #666;">
          Please log into your admin panel to process this order.
        </p>
      </div>
    `;
  }
  
  static generateOrderStatusTemplate(order) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196f3;">Order Status Updated</h2>
        <p>Your order status has been updated.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>New Status:</strong> <span style="color: #4caf50; font-weight: bold;">${order.status.toUpperCase()}</span></p>
          <p><strong>Updated:</strong> ${new Date(order.updatedAt).toLocaleDateString()}</p>
        </div>
        
        ${order.adminNotes ? `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Admin Notes</h3>
            <p>${order.adminNotes}</p>
          </div>
        ` : ''}
        
        <p style="margin-top: 30px; color: #666;">
          Thank you for choosing HIDAYA Jewelry!
        </p>
      </div>
    `;
  }
  
  static generateInvoiceTemplate(order, invoiceUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e91e63;">Invoice for Order ${order.id}</h2>
        <p>Your invoice is ready for download.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Summary</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceUrl}" 
             style="background: #e91e63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Download Invoice
          </a>
        </div>
        
        <p style="margin-top: 30px; color: #666;">
          If you have any questions about your order, please contact our support team.
        </p>
      </div>
    `;
  }
}
