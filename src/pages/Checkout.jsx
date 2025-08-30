import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, Truck, CheckCircle, Phone, Loader2, Shield, Smartphone, Building, Wallet, MapPin, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAdmin } from '@/context/AdminContext';
import { useAuth } from '@/context/AuthContext';
import { OdooAddresses } from '@/lib/odooServices';
import { toast } from '@/components/ui/use-toast';

const Checkout = () => {
  const { items, getCartTotal, clearCart } = useCart();
  const { siteSettings, addOrder } = useAdmin();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    mobileNumber: user?.mobile || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    upiId: '',
    bankName: '',
    accountNumber: ''
  });

  // Get dynamic shipping and tax rates from admin settings
  const shippingRates = siteSettings?.shippingRates || { standard: 5.99, express: 15.99, overnight: 29.99 };
  const taxRate = siteSettings?.taxRate || 0;
  const freeShippingThreshold = siteSettings?.shippingRates?.freeShippingThreshold || 200;

  // Mobile number validation
  const validateMobileNumber = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  // Calculate shipping cost
  const getShippingCost = () => {
    const subtotal = getCartTotal();
    if (freeShippingThreshold && subtotal >= freeShippingThreshold) {
      return 0; // Free shipping
    }
    return shippingRates.standard; // Default to standard shipping
  };

  // Calculate tax
  const getTaxAmount = () => {
    return getCartTotal() * taxRate;
  };

  // Calculate total
  const getTotalAmount = () => {
    return getCartTotal() + getShippingCost() + getTaxAmount();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mobile number
    if (!validateMobileNumber(formData.mobileNumber)) {
      toast({ 
        title: 'Invalid Mobile Number', 
        description: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const orderPayload = {
        customer: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          mobileNumber: formData.mobileNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        shipping: getShippingCost(),
        paymentMethod: selectedPaymentMethod,
        note: 'Online order from storefront',
      };
      
      console.log('Submitting order payload:', orderPayload);
      
      // Create order in Odoo via AdminContext
      const order = await addOrder(orderPayload);
      
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
      
      setOrderDetails({
        orderNumber,
        orderId: order?.id || orderNumber,
        customerName: `${formData.firstName} ${formData.lastName}`,
        total: getTotalAmount(),
        items: items.length,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
      
      toast({ 
        title: '🎉 Order Placed Successfully!', 
        description: "Thank you for your purchase! You'll receive a confirmation email shortly." 
      });
      clearCart();
      setStep(4);
    } catch (error) {
      toast({ 
        title: 'Order Failed', 
        description: 'Could not place order. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.mobileNumber) {
        toast({ 
          title: 'Missing Information', 
          description: 'Please fill in all required fields.', 
          variant: 'destructive' 
        });
        return;
      }
      if (!validateMobileNumber(formData.mobileNumber)) {
        toast({ 
          title: 'Invalid Mobile Number', 
          description: 'Please enter a valid 10-digit mobile number.', 
          variant: 'destructive' 
        });
        return;
      }
    }
    if (step === 2) {
      if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
        toast({ 
          title: 'Missing Information', 
          description: 'Please fill in all shipping address fields.', 
          variant: 'destructive' 
        });
        return;
      }
    }
    setStep(step + 1);
  };

  // Load saved addresses for authenticated users
  useEffect(() => {
    if (isAuthenticated && user && !user.isAdmin) {
      loadSavedAddresses();
    }
  }, [isAuthenticated, user]);

  const loadSavedAddresses = async () => {
    try {
      const addresses = await OdooAddresses.getUserAddresses(user.id);
      setSavedAddresses(addresses);
      
      // Set default address if available
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        setFormData(prev => ({
          ...prev,
          address: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipCode: defaultAddress.zipCode,
          country: defaultAddress.country
        }));
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setFormData(prev => ({
      ...prev,
      address: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country
    }));
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    
    try {
      const newAddress = await OdooAddresses.addAddress(user.id, addressForm);
      setSavedAddresses(prev => [...prev, newAddress]);
      handleAddressSelect(newAddress);
      setShowAddressForm(false);
      setAddressForm({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      });
      
      toast({
        title: "Address Saved",
        description: "New address has been saved for future use."
      });
    } catch (error) {
      toast({
        title: "Failed to save address",
        description: error.message || "Could not save address.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay with Visa, MasterCard, or other cards',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Pay using UPI ID or QR code',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'Pay using your bank account',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: Wallet,
      description: 'Pay using Paytm, PhonePe, or other wallets',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  if (items.length === 0 && step !== 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 max-w-md mx-auto px-4"
        >
          <div className="text-8xl">🛒</div>
          <h2 className="font-display text-3xl font-bold text-gray-900">No Items to Checkout</h2>
          <p className="text-gray-600">
            Your cart is empty. Add some beautiful jewelry pieces to proceed with checkout.
          </p>
          <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
            Start Shopping
          </Button>
        </motion.div>
      </div>
    );
  }

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
            <h1 className="font-display text-4xl md:text-6xl font-bold">
              {step === 4 ? 'Order Complete' : 'Checkout'}
            </h1>
            {step !== 4 && (
              <p className="text-xl opacity-90">
                Secure checkout for your jewelry purchase
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        {step !== 4 && (
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= stepNumber
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    stepNumber
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Contact Info</span>
              <span>Shipping</span>
              <span>Payment</span>
            </div>
          </div>
        )}

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="John"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    required
                    maxLength="10"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="9876543210"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter 10-digit mobile number starting with 6, 7, 8, or 9
                </p>
              </div>
              
              <Button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 py-3">
                Continue to Shipping
              </Button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Truck className="mr-2 h-6 w-6" />
              Shipping Address
            </h2>

            {/* Saved Addresses for Authenticated Users */}
            {isAuthenticated && savedAddresses.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Saved Addresses</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => handleAddressSelect(address)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddress?.id === address.id
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{address.name}</h4>
                          {address.isDefault && (
                            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full mt-1">
                              Default
                            </span>
                          )}
                        </div>
                        {selectedAddress?.id === address.id && (
                          <Check className="h-5 w-5 text-rose-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        <p>{address.street}</p>
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="border-t border-gray-300 flex-grow"></div>
                  <span className="px-4 text-sm text-gray-500">or</span>
                  <div className="border-t border-gray-300 flex-grow"></div>
                </div>
              </div>
            )}

            {/* Add New Address Button for Users with No Saved Addresses */}
            {isAuthenticated && savedAddresses.length === 0 && (
              <div className="mb-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddressForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </div>
            )}

            {/* Address Form */}
            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Mumbai"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Maharashtra"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                    maxLength="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="400001"
                  />
                </div>
              </div>

              {/* Save Address Option for Authenticated Users */}
              {isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <label htmlFor="saveAddress" className="text-sm text-gray-700">
                    Save this address for future orders
                  </label>
                </div>
              )}
              
              <div className="flex space-x-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                  Continue to Payment
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <CreditCard className="mr-2 h-6 w-6" />
                Payment Information
              </h2>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${method.color} text-white`}>
                          <method.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{method.name}</h3>
                          <p className="text-xs text-gray-500">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Credit/Debit Card Fields */}
                {selectedPaymentMethod === 'card' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="MM/YY"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                          maxLength="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="123"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name on Card *
                        </label>
                        <input
                          type="text"
                          name="nameOnCard"
                          value={formData.nameOnCard}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* UPI Fields */}
                {selectedPaymentMethod === 'upi' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UPI ID *
                    </label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="username@upi"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your UPI ID (e.g., john@okicici, 9876543210@paytm)
                    </p>
                  </div>
                )}

                {/* Net Banking Fields */}
                {selectedPaymentMethod === 'netbanking' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name *
                      </label>
                      <select
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="">Select your bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                        <option value="pnb">Punjab National Bank</option>
                        <option value="canara">Canara Bank</option>
                        <option value="union">Union Bank of India</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Enter your account number"
                      />
                    </div>
                  </div>
                )}

                {/* Digital Wallet Fields */}
                {selectedPaymentMethod === 'wallet' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="walletMobile"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      required
                      maxLength="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="9876543210"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the mobile number linked to your digital wallet
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <Shield className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
                
                <div className="flex space-x-4">
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Order'
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={getShippingCost() === 0 ? "text-green-600" : ""}>
                      {getShippingCost() === 0 ? "Free" : `₹${getShippingCost().toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>₹{getTaxAmount().toFixed(2)}</span>
                  </div>
                  {freeShippingThreshold && getCartTotal() < freeShippingThreshold && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      Add ₹{(freeShippingThreshold - getCartTotal()).toFixed(2)} more for free shipping!
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8 bg-white rounded-2xl shadow-lg p-12"
          >
            <div className="text-8xl">🎉</div>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-8 w-8" />
                <h2 className="font-display text-3xl font-bold">Order Complete!</h2>
              </div>
              <p className="text-xl text-gray-600">
                Thank you for your purchase! Your beautiful jewelry will be shipped soon.
              </p>
              
              {orderDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mt-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Order Number:</span>
                      <p className="font-medium text-gray-900">{orderDetails.orderNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <p className="font-medium text-gray-900">{orderDetails.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-medium text-gray-900">₹{orderDetails.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Items:</span>
                      <p className="font-medium text-gray-900">{orderDetails.items} item(s)</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Estimated Delivery:</span>
                      <p className="font-medium text-gray-900">{orderDetails.estimatedDelivery}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-gray-500">
                You'll receive a confirmation email with tracking information shortly.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                Continue Shopping
              </Button>
              <Button variant="outline">
                Track Your Order
              </Button>
            </div>
          </motion.div>
        )}

        {/* Address Form Modal */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Address</h3>
              
              <form onSubmit={handleAddNewAddress} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Name</label>
                  <input
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    placeholder="e.g., Home, Office"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="123 Main Street"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="Mumbai"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="Maharashtra"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                      placeholder="400001"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      placeholder="India"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                  >
                    Add Address
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;