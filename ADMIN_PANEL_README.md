# HIDAYA Jewelry - Admin Panel

A comprehensive, secure admin panel for managing your e-commerce jewelry store. Built with React.js, featuring modern UI components, real-time notifications, and automated document generation.

## 🚀 Features

### 📊 Dashboard Overview
- **Real-time Metrics**: Total products, orders, revenue, and pending orders
- **Recent Activity**: Latest orders and top-performing products
- **Quick Actions**: Easy access to common admin tasks
- **Performance Insights**: Visual charts and statistics

### 🛍️ Product Management
- **CRUD Operations**: Create, read, update, and delete products
- **Advanced Filtering**: Search by name, description, or category
- **Sorting Options**: Sort by name, price, rating, or category
- **Image Management**: Upload and manage product images
- **Stock Control**: Monitor and update inventory levels
- **Category Management**: Organize products by jewelry type

### 📦 Order Management
- **Order Tracking**: Monitor order status from pending to delivered
- **Customer Information**: View customer details and shipping addresses
- **Status Updates**: Update order status with admin notes
- **Filtering & Search**: Find orders by date, status, or customer
- **Bulk Operations**: Process multiple orders efficiently

### 🔔 Notification Center
- **Real-time Alerts**: Instant notifications for new orders
- **Smart Categorization**: Organize notifications by type
- **Read/Unread Status**: Track notification engagement
- **Action Items**: Quick access to related orders/products
- **Bulk Management**: Mark all as read or clear notifications

### ⚙️ Site Settings
- **Company Information**: Manage business details and contact info
- **Shipping Rates**: Configure standard, express, and overnight pricing
- **Tax Configuration**: Set tax rates and rules
- **Branding**: Update logo and footer text
- **Real-time Preview**: See changes before saving

### 📄 Document Generation
- **Automated Invoices**: Generate professional PDF invoices
- **Delivery Labels**: Create printable shipping labels
- **QR Code Integration**: Include scannable codes for tracking
- **Email Integration**: Send documents directly to customers
- **PDF Storage**: Archive all generated documents

### 🔐 Security Features
- **Role-based Access**: Admin-only authentication
- **Route Protection**: Secure admin routes with middleware
- **Input Validation**: Prevent malicious data entry
- **Session Management**: Secure user sessions
- **Rate Limiting**: Protect against abuse

## 🛠️ Technical Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS
- **State Management**: React Context API
- **UI Components**: Custom components with Radix UI primitives
- **PDF Generation**: pdf-lib for document creation
- **QR Codes**: qrcode library for tracking
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React for consistent iconography

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Modern web browser with ES6+ support

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access Admin Panel
- Navigate to `/admin` in your browser
- Login with admin credentials (see Authentication section)

## 🔐 Authentication

### Admin Access
- **Email**: `admin@hidaya.com`
- **Password**: Any password (demo mode)
- **Role**: Administrator with full access

### Security Notes
- In production, implement proper backend authentication
- Use environment variables for sensitive data
- Enable HTTPS for secure communication
- Implement proper session management

## 📱 Usage Guide

### Dashboard
1. **View Metrics**: Check key performance indicators
2. **Monitor Activity**: Review recent orders and products
3. **Quick Actions**: Use shortcut buttons for common tasks

### Product Management
1. **Add Product**: Click "Add Product" button
2. **Fill Details**: Enter name, description, price, category
3. **Upload Image**: Provide product image URL
4. **Set Inventory**: Configure stock levels and ratings
5. **Save Changes**: Click "Add Product" to save

### Order Processing
1. **View Orders**: Check orders tab for new items
2. **Update Status**: Change order status as it progresses
3. **Add Notes**: Include admin notes for tracking
4. **Generate Documents**: Create invoices and labels
5. **Notify Customers**: Send status updates via email

### Site Configuration
1. **Edit Settings**: Click "Edit Settings" button
2. **Update Information**: Modify company details and rates
3. **Preview Changes**: Review settings before saving
4. **Save Configuration**: Apply changes to live site

## 🔧 Configuration

### Environment Variables
```bash
# Add to your .env file
VITE_ADMIN_EMAIL=admin@hidaya.com
VITE_SITE_NAME=HIDAYA Jewelry
VITE_API_URL=http://localhost:3000
```

### Customization
- **Colors**: Modify Tailwind CSS classes in components
- **Layout**: Adjust grid systems and spacing
- **Features**: Enable/disable specific admin functions
- **Branding**: Update logos and company information

## 📊 Data Management

### Local Storage
- All data is stored in browser localStorage
- Data persists between sessions
- Demo data is automatically generated

### Data Export
- Export orders to CSV format
- Download invoices and labels as PDFs
- Backup admin settings and configurations

### Demo Data
- Sample orders for testing
- Example products and categories
- Mock notifications and alerts

## 🚨 Troubleshooting

### Common Issues

#### Admin Panel Not Loading
- Check if user is logged in as admin
- Verify route protection is working
- Check browser console for errors

#### PDF Generation Fails
- Ensure pdf-lib is properly installed
- Check browser compatibility
- Verify order data structure

#### Notifications Not Working
- Check notification permissions
- Verify email service configuration
- Review notification settings

### Performance Optimization
- Use pagination for large datasets
- Implement virtual scrolling for long lists
- Optimize image loading and caching
- Enable code splitting for better load times

## 🔮 Future Enhancements

### Planned Features
- **Analytics Dashboard**: Advanced reporting and insights
- **Inventory Management**: Stock alerts and reorder points
- **Customer Management**: Customer database and history
- **Marketing Tools**: Email campaigns and promotions
- **Multi-language Support**: Internationalization
- **Mobile App**: Native mobile admin application

### Integration Possibilities
- **Payment Gateways**: Stripe, PayPal integration
- **Shipping Providers**: FedEx, UPS, DHL APIs
- **Accounting Software**: QuickBooks, Xero sync
- **CRM Systems**: Salesforce, HubSpot integration
- **Social Media**: Instagram, Facebook shop sync

## 📚 API Reference

### Admin Context Methods

#### Product Management
```javascript
const { 
  products, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} = useAdmin();

// Add new product
addProduct({
  name: 'Product Name',
  price: 99.99,
  category: 'Bracelets',
  description: 'Product description',
  stock: 100,
  image: 'image-url.jpg'
});

// Update existing product
updateProduct(productId, {
  price: 89.99,
  stock: 50
});

// Delete product
deleteProduct(productId);
```

#### Order Management
```javascript
const { 
  orders, 
  updateOrderStatus, 
  getOrderById 
} = useAdmin();

// Update order status
updateOrderStatus(orderId, 'shipped', 'Admin notes');

// Get order details
const order = getOrderById(orderId);
```

#### Site Settings
```javascript
const { 
  siteSettings, 
  updateSiteSettings 
} = useAdmin();

// Update site configuration
updateSiteSettings({
  companyName: 'New Company Name',
  taxRate: 0.08,
  shippingRates: {
    standard: 5.99,
    express: 15.99
  }
});
```

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow existing patterns and conventions
2. **Component Structure**: Use functional components with hooks
3. **State Management**: Prefer Context API over prop drilling
4. **Error Handling**: Implement proper error boundaries
5. **Testing**: Add tests for new features

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request with description
5. Address review comments

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check this README first
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact development team directly

### Community
- **GitHub**: Main repository and discussions
- **Discord**: Community chat and support
- **Blog**: Tutorials and best practices
- **YouTube**: Video guides and demos

---

**Built with ❤️ for HIDAYA Jewelry**

*Last updated: December 2024*
