import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { OdooOrders, OdooInvoices, OdooDelivery } from '@/lib/odooServices';
import productsData from '@/data/products.json';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // State management
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    logo: '',
    companyName: 'HIDAYA Jewelry',
    contactEmail: 'info@hidaya.com',
    phone: '+1 (555) 123-4567',
    address: '123 Jewelry Street, City, State 12345',
    heroDescription: "Discover our exquisite collection of handcrafted bracelets and rings. Each piece tells a story of elegance, craftsmanship, and timeless beauty.",
    companyDescription: "Crafting exquisite jewelry pieces that celebrate life's precious moments. Each piece is designed with love and attention to detail.",
    shippingRates: {
      standard: 50,
      express: 15.99,
      overnight: 29.99
    },
    taxRate: 0.00,
    footerText: '© 2024 HIDAYA Jewelry. All rights reserved.'
  });
  const [loading, setLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        // Load products from backend API, orders from Odoo
        const [o, productsRes] = await Promise.all([
          OdooOrders.list({ limit: 100 }),
          fetch('/api/products')
        ]);
        if (!mounted) return;
        if (productsRes.ok) {
          const p = await productsRes.json();
          setProducts(Array.isArray(p) ? p : productsData);
        } else {
          setProducts(productsData);
        }
        setOrders(o);
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to load orders from Odoo', variant: 'destructive' });
        // Still load products even if Odoo fails
        if (mounted) setProducts(productsData);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Product Management (Persist to backend products.json)
  const addProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to add product');
      }
      const created = await res.json();
      setProducts(prev => [...prev, created]);
      toast({ title: 'Product Added', description: `${created.name} has been saved.` });
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to add product', variant: 'destructive' });
      throw e;
    } finally { setLoading(false); }
  }, []);

  const updateProduct = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update product');
      }
      const saved = await res.json();
      setProducts(prev => prev.map(product => product.id === id ? saved : product));
      toast({ title: 'Product Updated', description: 'Product saved.' });
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to update product', variant: 'destructive' });
      throw e;
    } finally { setLoading(false); }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to delete product');
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Product Deleted', description: 'Product removed.' });
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to delete product', variant: 'destructive' });
      throw e;
    } finally { setLoading(false); }
  }, []);

  // Order Management (Odoo)
  const addOrder = useCallback(async (orderData) => {
    try {
      setLoading(true);
      const orderId = await OdooOrders.createFromCart(orderData);
      const refreshed = await OdooOrders.list({ limit: 100 });
      setOrders(refreshed);
      const created = refreshed.find(o => o.odooId === orderId);
      const notification = {
        id: Date.now(),
        type: 'new_order',
        title: 'New Order Received',
        message: `Order ${created?.id || orderId} from ${orderData.customer.firstName} ${orderData.customer.lastName}`,
        orderId: created?.id || orderId,
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [notification, ...prev]);
      toast({ title: 'New Order', description: `Order ${created?.id || orderId} created in Odoo.` });
      return created || { id: orderId, odooId: orderId };
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to create order in Odoo', variant: 'destructive' });
      throw e;
    } finally { setLoading(false); }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status, notes = '') => {
    try {
      setLoading(true);
      const order = orders.find(o => o.id === orderId);
      if (order?.odooId) {
        await OdooOrders.updateStatus(order.odooId, status);
      }
      const refreshed = await OdooOrders.list({ limit: 100 });
      setOrders(refreshed);
      toast({ title: 'Order Updated', description: `Order status updated to ${status}.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update order in Odoo', variant: 'destructive' });
      throw e;
    } finally { setLoading(false); }
  }, [orders]);

  // Notification Management
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been cleared."
    });
  }, []);

  // Site Settings Management
  const updateSiteSettings = useCallback((updates) => {
    setSiteSettings(prev => ({ ...prev, ...updates }));
    toast({
      title: "Settings Updated",
      description: "Site settings have been updated successfully."
    });
  }, []);

  // Utility functions
  const getOrderById = useCallback((id) => {
    return orders.find(order => order.id === id);
  }, [orders]);

  const getProductById = useCallback((id) => {
    return products.find(product => product.id === id);
  }, [products]);

  const getUnreadNotificationsCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const value = {
    // State
    products,
    orders,
    notifications,
    siteSettings,
    loading,
    
    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    
    // Order operations
    addOrder,
    updateOrderStatus,
    getOrderById,
    
    // Notification operations
    markNotificationAsRead,
    clearNotifications,
    getUnreadNotificationsCount,
    
    // Site settings
    updateSiteSettings,
    
    // Utility
    setLoading
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
