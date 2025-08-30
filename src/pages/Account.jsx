import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ShoppingBag, Heart, LogOut, Shield, MapPin, Edit, Plus, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { OdooOrders, OdooAddresses } from '@/lib/odooServices';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || ''
  });

  // Address management state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  useEffect(() => {
    if (user && !user.isAdmin) {
      loadUserData();
    }
  }, [user, activeTab]);

  const loadUserData = async () => {
    if (activeTab === 'orders') {
      await loadOrders();
    } else if (activeTab === 'addresses') {
      await loadAddresses();
    }
  };

  const loadOrders = async () => {
    if (ordersLoading) return;
    
    setOrdersLoading(true);
    try {
      const userOrders = await OdooOrders.list({ userId: user.id, limit: 50 });
      setOrders(userOrders);
    } catch (error) {
      toast({
        title: "Failed to load orders",
        description: error.message || "Could not fetch your orders.",
        variant: "destructive"
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadAddresses = async () => {
    if (addressesLoading) return;
    
    setAddressesLoading(true);
    try {
      const userAddresses = await OdooAddresses.getUserAddresses(user.id);
      setAddresses(userAddresses);
    } catch (error) {
      toast({
        title: "Failed to load addresses",
        description: error.message || "Could not fetch your addresses.",
        variant: "destructive"
      });
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const updated = await updateProfile({
        name: profileData.name,
        email: profileData.email,
        mobile: profileData.mobile,
      });
      setProfileData({
        name: updated?.name || profileData.name,
        email: updated?.email || profileData.email,
        mobile: updated?.mobile || profileData.mobile,
      });
      setEditingProfile(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Poll orders periodically when Orders tab is active
  useEffect(() => {
    if (activeTab !== 'orders' || !user || user.isAdmin) return;
    let mounted = true;
    // Initial load to ensure fresh data
    loadOrders();
    const intervalId = setInterval(() => {
      if (mounted) loadOrders();
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [activeTab, user]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingAddress) {
        await OdooAddresses.updateAddress(editingAddress.id, addressForm);
        toast({
          title: "Address Updated",
          description: "Address has been updated successfully."
        });
      } else {
        await OdooAddresses.addAddress(user.id, addressForm);
        toast({
          title: "Address Added",
          description: "New address has been added successfully."
        });
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      });
      await loadAddresses();
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message || "Failed to save address.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }
    
    setLoading(true);
    try {
      await OdooAddresses.deleteAddress(addressId);
      toast({
        title: "Address Deleted",
        description: "Address has been removed successfully."
      });
      await loadAddresses();
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message || "Failed to delete address.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setLoading(true);
    try {
      await OdooAddresses.setDefaultAddress(user.id, addressId);
      toast({
        title: "Default Address Set",
        description: "Default address has been updated."
      });
      await loadAddresses();
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message || "Failed to set default address.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'shipped': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 space-y-4 h-fit"
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
              <Button 
                variant={activeTab === 'profile' ? 'default' : 'ghost'} 
                className="w-full justify-start space-x-2"
                onClick={() => setActiveTab('profile')}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Button>
              <Button 
                variant={activeTab === 'orders' ? 'default' : 'ghost'} 
                className="w-full justify-start space-x-2"
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>My Orders</span>
              </Button>
              <Button 
                variant={activeTab === 'addresses' ? 'default' : 'ghost'} 
                className="w-full justify-start space-x-2"
                onClick={() => setActiveTab('addresses')}
              >
                <MapPin className="h-4 w-4" />
                <span>Addresses</span>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start space-x-2"
                onClick={() => navigate('/wishlist')}
              >
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
              <Button 
                variant="ghost" 
                className="w-full justify-start space-x-2 text-red-600 hover:text-red-700" 
                onClick={handleLogout}
              >
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
            className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProfile(!editingProfile)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {editingProfile ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>

                {editingProfile ? (
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                      <Input
                        value={profileData.mobile}
                        onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                        placeholder="Enter your mobile number"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        onClick={handleProfileUpdate}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                      <p className="text-gray-900">{user?.mobile}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">My Orders</h2>
                
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
                    <Button onClick={() => navigate('/products')}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                            <p className="text-sm text-gray-500">
                              Placed on {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.productName} x {item.quantity}</span>
                              <span>₹{item.subtotal?.toFixed(2) || '0.00'}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-gray-200 mt-4 pt-4">
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>₹{order.total?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">My Addresses</h2>
                  <Button
                    onClick={() => setShowAddressForm(true)}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>

                {addressesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Addresses Saved</h3>
                    <p className="text-gray-500 mb-6">Add your first delivery address to get started.</p>
                    <Button onClick={() => setShowAddressForm(true)}>
                      Add Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">{address.name}</h3>
                            {address.isDefault && (
                              <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full mt-1">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAddress(address);
                                setAddressForm({
                                  name: address.name,
                                  street: address.street,
                                  city: address.city,
                                  state: address.state,
                                  zipCode: address.zipCode,
                                  country: address.country
                                });
                                setShowAddressForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{address.street}</p>
                          <p>{address.city}, {address.state} {address.zipCode}</p>
                          <p>{address.country}</p>
                        </div>
                        {!address.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => handleSetDefaultAddress(address.id)}
                            disabled={loading}
                          >
                            Set as Default
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address Name</label>
                <Input
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  placeholder="e.g., Home, Office"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <Input
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Mumbai"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <Input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <Input
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    placeholder="400001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <Input
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    placeholder="India"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddress(null);
                    setAddressForm({
                      name: '',
                      street: '',
                      city: '',
                      state: '',
                      zipCode: '',
                      country: 'India'
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;