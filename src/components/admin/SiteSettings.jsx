import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Image, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Truck, 
  Calculator,
  FileText,
  Globe,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/context/AdminContext';
import { toast } from '@/components/ui/use-toast';

const SiteSettings = () => {
  const { siteSettings, updateSiteSettings } = useAdmin();
  const [formData, setFormData] = useState({
    logo: siteSettings.logo || '',
    companyName: siteSettings.companyName || '',
    contactEmail: siteSettings.contactEmail || '',
    phone: siteSettings.phone || '',
    address: siteSettings.address || '',
    shippingRates: {
      standard: siteSettings.shippingRates?.standard || 0,
      express: siteSettings.shippingRates?.express || 0,
      overnight: siteSettings.shippingRates?.overnight || 0
    },
    taxRate: siteSettings.taxRate || 0,
    footerText: siteSettings.footerText || ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleShippingRateChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      shippingRates: {
        ...prev.shippingRates,
        [type]: parseFloat(value) || 0
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.taxRate < 0 || formData.taxRate > 1) {
      newErrors.taxRate = 'Tax rate must be between 0 and 1 (e.g., 0.08 for 8%)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    updateSiteSettings(formData);
    setIsEditing(false);
    toast({
      title: "Settings Updated",
      description: "Site settings have been saved successfully."
    });
  };

  const handleCancel = () => {
    setFormData({
      logo: siteSettings.logo || '',
      companyName: siteSettings.companyName || '',
      contactEmail: siteSettings.contactEmail || '',
      phone: siteSettings.phone || '',
      address: siteSettings.address || '',
      shippingRates: {
        standard: siteSettings.shippingRates?.standard || 0,
        express: siteSettings.shippingRates?.express || 0,
        overnight: siteSettings.shippingRates?.overnight || 0
      },
      taxRate: siteSettings.taxRate || 0,
      footerText: siteSettings.footerText || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const sections = [
    {
      title: 'Company Information',
      icon: Building,
      fields: [
        { name: 'companyName', label: 'Company Name', type: 'text', required: true },
        { name: 'contactEmail', label: 'Contact Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
        { name: 'address', label: 'Address', type: 'textarea', required: true }
      ]
    },
    {
      title: 'Shipping & Tax',
      icon: Truck,
      fields: [
        { name: 'shippingRates', label: 'Shipping Rates', type: 'shipping', required: false },
        { name: 'taxRate', label: 'Tax Rate', type: 'tax', required: false }
      ]
    },
    {
      title: 'Branding & Content',
      icon: Image,
      fields: [
        { name: 'logo', label: 'Logo URL', type: 'url', required: false },
        { name: 'footerText', label: 'Footer Text', type: 'textarea', required: false }
      ]
    }
  ];

  const renderField = (field) => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            rows={3}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
              errors[field.name] ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={!isEditing}
          />
        );
      
      case 'shipping':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Standard</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  type="number"
                  value={formData.shippingRates.standard}
                  onChange={(e) => handleShippingRateChange('standard', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Express</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  type="number"
                  value={formData.shippingRates.express}
                  onChange={(e) => handleShippingRateChange('express', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overnight</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  type="number"
                  value={formData.shippingRates.overnight}
                  onChange={(e) => handleShippingRateChange('overnight', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        );
      
      case 'tax':
        return (
          <div className="relative">
            <Input
              type="number"
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder="0.08"
              step="0.01"
              min="0"
              max="1"
              className={`pl-8 ${errors[field.name] ? 'border-red-500' : ''}`}
              disabled={!isEditing}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            <p className="text-xs text-gray-500 mt-1">
              Enter as decimal (e.g., 0.08 for 8%)
            </p>
          </div>
        );
      
      default:
        return (
          <Input
            type={field.type}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className={errors[field.name] ? 'border-red-500' : ''}
            disabled={!isEditing}
          />
        );
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Site Settings</h2>
          <p className="text-gray-600">Manage your store's configuration and branding</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Settings
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {sections.map((section, sectionIndex) => {
          const Icon = section.icon;
          
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center mb-6">
                <div className="p-2 rounded-lg bg-rose-100 mr-3">
                  <Icon className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
              </div>

              <div className="space-y-6">
                {section.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {renderField(field)}
                    
                    {errors[field.name] && (
                      <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="mr-2 h-5 w-5" />
          Settings Preview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Company Info</h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Name:</span> {formData.companyName || 'Not set'}</p>
              <p><span className="text-gray-600">Email:</span> {formData.contactEmail || 'Not set'}</p>
              <p><span className="text-gray-600">Phone:</span> {formData.phone || 'Not set'}</p>
              <p><span className="text-gray-600">Address:</span> {formData.address || 'Not set'}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Standard Shipping:</span> ₹{formData.shippingRates.standard.toFixed(2)}</p>
              <p><span className="text-gray-600">Express Shipping:</span> ₹{formData.shippingRates.express.toFixed(2)}</p>
              <p><span className="text-gray-600">Overnight Shipping:</span> ₹{formData.shippingRates.overnight.toFixed(2)}</p>
              <p><span className="text-gray-600">Tax Rate:</span> {(formData.taxRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SiteSettings;
