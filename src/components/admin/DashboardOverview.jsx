import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Users,
  Eye,
  Star,
  Plus,
  Settings
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { toast } from '@/components/ui/use-toast';
import ProductForm from './ProductForm';
import NotificationCenter from './NotificationCenter';
import SiteSettings from './SiteSettings';
import OrderManagement from './OrderManagement';

const DashboardOverview = () => {
  const { products, orders, notifications } = useAdmin();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);

  // Calculate metrics
  const totalProducts = products.length;
  const totalOrders = orders.length;
  let totalPayments = orders.reduce((sum, order) => sum + order.total, 0);
  let cancelledOrdersPayments = orders
    .filter(order => order.status === 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);
  totalPayments -= cancelledOrdersPayments;
  const totalRevenue = totalPayments;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const recentOrders = orders.slice(0, 5);
  const topProducts = products
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      icon: ShoppingCart,
      color: 'from-orange-500 to-orange-600',
      change: pendingOrders > 0 ? `${pendingOrders} new` : 'All caught up',
      changeType: pendingOrders > 0 ? 'warning' : 'positive'
    }
  ];

  const handleFormClose = () => {
    setShowAddForm(false);
  };

  const handleFormSubmit = () => {
    setShowAddForm(false);
    toast({
      title: "Product Added",
      description: "Product has been added successfully."
    });
  };

  const handleOrderManagementClose = () => {
    setShowOrderManagement(false);
  };

  const handleNotificationCenterClose = () => {
    setShowNotificationCenter(false);
  };

  const handleSiteSettingsClose = () => {
    setShowSiteSettings(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Monitor your store's performance and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className={`h-4 w-4 mr-1 ${
                stat.changeType === 'positive' ? 'text-green-500' : 
                stat.changeType === 'warning' ? 'text-orange-500' : 'text-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'warning' ? 'text-orange-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button 
              className="text-sm text-rose-600 hover:text-rose-700 font-medium"
              onClick={() => setShowOrderManagement(true)}
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-500">{order.customer.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{order.total.toFixed(2)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No orders yet</p>
                <p className="text-sm">Orders will appear here when customers make purchases</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <button 
              className="text-sm text-rose-600 hover:text-rose-700 font-medium"
              onClick={() => setShowAddForm(true)}
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">₹{product.price}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No products yet</p>
                <p className="text-sm">Add products to see them ranked here</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            className="flex items-center justify-center p-4 bg-white rounded-lg border border-rose-200 hover:border-rose-300 hover:shadow-md transition-all"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-5 w-5 text-rose-600 mr-2" />
            <span className="font-medium text-gray-700">Add Product</span>
          </button>
          <button 
            className="flex items-center justify-center p-4 bg-white rounded-lg border border-rose-200 hover:border-rose-300 hover:shadow-md transition-all"
            onClick={() => setShowOrderManagement(true)}
          >
            <ShoppingCart className="h-5 w-5 text-rose-600 mr-2" />
            <span className="font-medium text-gray-700">Process Orders</span>
          </button>
          <button 
            className="flex items-center justify-center p-4 bg-white rounded-lg border border-rose-200 hover:border-rose-300 hover:shadow-md transition-all"
            onClick={() => setShowNotificationCenter(true)}
          >
            <Eye className="h-5 w-5 text-rose-600 mr-2" />
            <span className="font-medium text-gray-700">View Analytics</span>
          </button>
          <button 
            className="flex items-center justify-center p-4 bg-white rounded-lg border border-rose-200 hover:border-rose-300 hover:shadow-md transition-all"
            onClick={() => setShowSiteSettings(true)}
          >
            <Settings className="h-5 w-5 text-rose-600 mr-2" />
            <span className="font-medium text-gray-700">Site Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Modals */}
      {showAddForm && (
        <ProductForm
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}
      {showOrderManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleOrderManagementClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <OrderManagement onClose={handleOrderManagementClose} />
          </motion.div>
        </div>
      )}
      {showNotificationCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleNotificationCenterClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <NotificationCenter onClose={handleNotificationCenterClose} />
          </motion.div>
        </div>
      )}
      {showSiteSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleSiteSettingsClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SiteSettings onClose={handleSiteSettingsClose} />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;