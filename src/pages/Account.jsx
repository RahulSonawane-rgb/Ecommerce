import React from 'react';
import { motion } from 'framer-motion';
import { User, ShoppingBag, Heart, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
  };

  const handleFeatureClick = () => {
    toast({
      title: "🚧 Feature In Progress",
      description: "This section is under construction. Check back soon!"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Header */}
      <section className="py-16 bg-gradient-to-r from-rose-600 to-pink-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4"
          >
            <h1 className="font-display text-4xl md:text-6xl font-bold">My Account</h1>
            <p className="text-xl opacity-90">Welcome back, {user?.name || 'Valued Customer'}!</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:col-span-1 bg-white rounded-2xl shadow-lg p-6 space-y-4 h-fit"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="border-t border-gray-200" />
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start space-x-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start space-x-2" onClick={handleFeatureClick}>
                <ShoppingBag className="h-4 w-4" />
                <span>My Orders</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start space-x-2" onClick={() => navigate('/wishlist')}>
                <Heart className="h-4 w-4" />
                <span>Wishlist</span>
              </Button>
              {user?.isAdmin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-2"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start space-x-2 text-red-600 hover:text-red-700" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </nav>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="md:col-span-2 bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order History</h2>
            <div className="space-y-6">
              {/* Mock Order */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Order #H12345</h3>
                  <span className="text-sm text-gray-500">August 15, 2025</span>
                </div>
                <p className="text-sm text-gray-600">Status: <span className="text-green-600 font-medium">Delivered</span></p>
                <p className="text-sm text-gray-600">Total: ₹322.92</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleFeatureClick}>View Details</Button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Order #H12344</h3>
                  <span className="text-sm text-gray-500">July 28, 2025</span>
                </div>
                <p className="text-sm text-gray-600">Status: <span className="text-green-600 font-medium">Delivered</span></p>
                <p className="text-sm text-gray-600">Total: ₹970.92</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleFeatureClick}>View Details</Button>
              </div>
              <div className="text-center text-gray-500 py-8">
                <p>No more orders to show.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Account;