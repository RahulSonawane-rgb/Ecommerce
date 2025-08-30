import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, Star, ShoppingBag, Shield, Truck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/context/AdminContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const { getProductById } = useAdmin();
  const product = getProductById(parseInt(id));
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Product not found</h2>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isProductInWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast({
      title: "Added to Cart! 🛍️",
      description: `${quantity} x ${product.name} added to your cart.`
    });
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your wishlist.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    toggleWishlist(product);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied! 🔗",
      description: "Product link copied to your clipboard."
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-2 text-sm text-gray-600 mb-8"
        >
          <Link to="/" className="hover:text-rose-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-rose-600">Products</Link>
          <span>/</span>
          <Link to={`/products/${product.category}`} className="hover:text-rose-600 capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-rose-500'
                        : 'border-gray-200 hover:border-rose-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Product Header */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 capitalize">{product.category}</span>
                <span className="text-sm text-gray-300">•</span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{product.name}</h1>
              
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-rose-600">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>
                )}
                {product.originalPrice && (
                  <span className="text-sm bg-rose-100 text-rose-800 px-2 py-1 rounded-full">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>

              <p className="text-lg text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Product Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.stock} available
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white py-3 text-lg"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className="px-6 py-3 border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Heart className={`mr-2 h-5 w-5 ${isProductInWishlist ? 'fill-current text-rose-600' : ''}`} />
                  {isProductInWishlist ? 'In Wishlist' : 'Wishlist'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleShare}
                  className="px-6 py-3"
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              </div>
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-100 rounded-full">
                  <Shield className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Quality Assurance</h4>
                  <p className="text-sm text-gray-600">100% genuine products</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-100 rounded-full">
                  <Truck className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Free Shipping</h4>
                  <p className="text-sm text-gray-600">On orders over ₹200</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-100 rounded-full">
                  <RotateCcw className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Easy Returns</h4>
                  <p className="text-sm text-gray-600">30-day return policy</p>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Material:</span>
                  <span className="ml-2 text-gray-900">{product.material || 'Sterling Silver'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Weight:</span>
                  <span className="ml-2 text-gray-900">{product.weight || '5.2g'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="ml-2 text-gray-900">{product.dimensions || '18cm x 2cm'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Clasp:</span>
                  <span className="ml-2 text-gray-900">{product.clasp || 'Lobster Clasp'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">You Might Also Like</h2>
            <p className="text-gray-600">Discover more beautiful pieces from our collection</p>
          </div>

          {/* This would typically show related products */}
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-600">Related products feature coming soon...</p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ProductDetail;