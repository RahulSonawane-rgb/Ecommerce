import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Account from '@/pages/Account';
import Wishlist from '@/pages/Wishlist';
import Admin from '@/pages/Admin';
import PrivateRoute from '@/components/PrivateRoute';
import AdminRoute from '@/components/AdminRoute';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AdminProvider } from '@/context/AdminContext';

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <AdminProvider>
            <div className="min-h-screen flex flex-col">
              <Helmet>
                <title>HIDAYA Jewelry - Exquisite Bracelets & Rings</title>
                <meta name="description" content="Discover HIDAYA's stunning collection of handcrafted bracelets and rings. Premium jewelry designed for elegance and style." />
                <meta property="og:title" content="HIDAYA Jewelry - Exquisite Bracelets & Rings" />
                <meta property="og:description" content="Discover HIDAYA's stunning collection of handcrafted bracelets and rings. Premium jewelry designed for elegance and style." />
              </Helmet>
              
              <Header />
              
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:category" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                  <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
                  <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
                  <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                </Routes>
              </main>
              
              <Footer />
            </div>
          </AdminProvider>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;