import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAdmin } from '@/context/AdminContext';

const Footer = () => {
  const { siteSettings } = useAdmin();

  // Get dynamic data from admin settings
  const logoUrl = siteSettings?.logo || "https://i.ibb.co/390KJ9YJ/HIDAYA-Logo.png";
  const companyName = siteSettings?.companyName || "HIDAYA Jewelry";
  const contactEmail = siteSettings?.contactEmail || "info@hidaya.com";
  const phone = siteSettings?.phone || "+1 (555) 123-4567";
  const address = siteSettings?.address || "123 Jewelry Street, City, State 12345";
  const footerText = siteSettings?.footerText || "© 2024 HIDAYA Jewelry. All rights reserved. Crafted with love for jewelry enthusiasts.";

  const handleSocialClick = (platform) => {
    toast({
      title: `${platform} Link`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "📧 Newsletter Signup",
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logoUrl} alt={`${companyName} Logo`} className="h-16 w-auto md:h-20" />
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              Crafting exquisite jewelry pieces that celebrate life's precious moments. 
              Each piece is designed with love and attention to detail.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSocialClick('Facebook')}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSocialClick('Instagram')}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Instagram className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSocialClick('Twitter')}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <span className="text-lg font-semibold">Quick Links</span>
            <div className="space-y-2">
              <Link to="/products" className="block text-gray-300 hover:text-white transition-colors">
                All Products
              </Link>
              <Link to="/products/bracelets" className="block text-gray-300 hover:text-white transition-colors">
                Bracelets
              </Link>
              <Link to="/products/rings" className="block text-gray-300 hover:text-white transition-colors">
                Rings
              </Link>
              <Link to="/about" className="block text-gray-300 hover:text-white transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-gray-300 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <span className="text-lg font-semibold">Customer Service</span>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Shipping & Returns</p>
              <p className="text-gray-300 text-sm">Size Guide</p>
              <p className="text-gray-300 text-sm">Care Instructions</p>
              <p className="text-gray-300 text-sm">FAQ</p>
              <p className="text-gray-300 text-sm">Privacy Policy</p>
            </div>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <span className="text-lg font-semibold">Stay Connected</span>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-300 text-sm">
                <Mail className="h-4 w-4" />
                <span>{contactEmail}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300 text-sm">
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{address}</span>
              </div>
            </div>
            
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <p className="text-sm text-gray-300">Subscribe to our newsletter</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <Button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-r-md rounded-l-none"
                >
                  Subscribe
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            {footerText}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;