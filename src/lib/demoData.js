// Demo data generator for testing the admin panel
export const generateDemoOrders = () => {
  const demoOrders = [
    {
      id: 'ORD-20241201-001',
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 123-4567'
      },
      items: [
        { name: 'Rose Gold Bracelet', price: 89.99, quantity: 1 },
        { name: 'Diamond Ring', price: 299.99, quantity: 1 }
      ],
      shippingAddress: '123 Main Street\nApt 4B\nNew York, NY 10001',
      paymentMethod: 'Credit Card',
      subtotal: 389.98,
      shipping: 5.99,
      tax: 31.20,
      total: 427.17,
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      adminNotes: ''
    },
    {
      id: 'ORD-20241201-002',
      customer: {
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+1 (555) 987-6543'
      },
      items: [
        { name: 'Silver Necklace', price: 149.99, quantity: 1 },
        { name: 'Pearl Earrings', price: 79.99, quantity: 2 }
      ],
      shippingAddress: '456 Oak Avenue\nLos Angeles, CA 90210',
      paymentMethod: 'PayPal',
      subtotal: 309.97,
      shipping: 15.99,
      tax: 24.80,
      total: 350.76,
      status: 'processing',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      adminNotes: 'Customer requested express shipping'
    },
    {
      id: 'ORD-20241130-001',
      customer: {
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        phone: '+1 (555) 456-7890'
      },
      items: [
        { name: 'Gold Watch', price: 599.99, quantity: 1 }
      ],
      shippingAddress: '789 Pine Street\nChicago, IL 60601',
      paymentMethod: 'Credit Card',
      subtotal: 599.99,
      shipping: 29.99,
      tax: 48.00,
      total: 677.98,
      status: 'shipped',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      adminNotes: 'Shipped via overnight delivery'
    },
    {
      id: 'ORD-20241129-001',
      customer: {
        name: 'David Thompson',
        email: 'david.thompson@email.com',
        phone: '+1 (555) 321-0987'
      },
      items: [
        { name: 'Platinum Ring', price: 899.99, quantity: 1 },
        { name: 'Sapphire Pendant', price: 199.99, quantity: 1 }
      ],
      shippingAddress: '321 Elm Street\nMiami, FL 33101',
      paymentMethod: 'Credit Card',
      subtotal: 1099.98,
      shipping: 5.99,
      tax: 88.00,
      total: 1193.97,
      status: 'delivered',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      adminNotes: 'Delivered successfully. Customer very satisfied.'
    },
    {
      id: 'ORD-20241128-001',
      customer: {
        name: 'Lisa Wang',
        email: 'lisa.wang@email.com',
        phone: '+1 (555) 654-3210'
      },
      items: [
        { name: 'Rose Gold Necklace', price: 129.99, quantity: 1 },
        { name: 'Diamond Studs', price: 399.99, quantity: 1 },
        { name: 'Silver Bracelet', price: 69.99, quantity: 1 }
      ],
      shippingAddress: '654 Maple Drive\nSeattle, WA 98101',
      paymentMethod: 'PayPal',
      subtotal: 599.97,
      shipping: 5.99,
      tax: 48.00,
      total: 653.96,
      status: 'cancelled',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      adminNotes: 'Customer requested cancellation due to change of mind'
    }
  ];

  return demoOrders;
};

export const generateDemoNotifications = () => {
  const demoNotifications = [
    {
      id: 1,
      type: 'new_order',
      title: 'New Order Received',
      message: 'Order ORD-20241201-001 from Sarah Johnson',
      orderId: 'ORD-20241201-001',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      type: 'new_order',
      title: 'New Order Received',
      message: 'Order ORD-20241201-002 from Michael Chen',
      orderId: 'ORD-20241201-002',
      read: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: 'product',
      title: 'Low Stock Alert',
      message: 'Rose Gold Bracelet is running low on stock (5 remaining)',
      read: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance completed successfully',
      read: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  return demoNotifications;
};

// Function to initialize demo data
export const initializeDemoData = () => {
  // Check if demo data already exists
  const existingOrders = localStorage.getItem('hidaya-admin-orders');
  const existingNotifications = localStorage.getItem('hidaya-admin-notifications');
  
  if (!existingOrders) {
    localStorage.setItem('hidaya-admin-orders', JSON.stringify(generateDemoOrders()));
  }
  
  if (!existingNotifications) {
    localStorage.setItem('hidaya-admin-notifications', JSON.stringify(generateDemoNotifications()));
  }
};

// Function to reset demo data
export const resetDemoData = () => {
  localStorage.removeItem('hidaya-admin-orders');
  localStorage.removeItem('hidaya-admin-notifications');
  localStorage.removeItem('hidaya-admin-products');
  localStorage.removeItem('hidaya-admin-settings');
  
  // Reinitialize
  initializeDemoData();
  
  // Reload the page to reflect changes
  window.location.reload();
};
