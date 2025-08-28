import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid, List, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { useAdmin } from '@/context/AdminContext';
import { toast } from '@/components/ui/use-toast';
import { AnimatePresence } from 'framer-motion';

// Custom RangeSlider Component
const RangeSlider = ({ min, max, value, onValueChange }) => {
  const [minValue, setMinValue] = useState(value[0]);
  const [maxValue, setMaxValue] = useState(value[1]);

  const handleMinChange = (e) => {
    const newMin = Math.min(Number(e.target.value), maxValue - 10);
    setMinValue(newMin);
    onValueChange([newMin, maxValue]);
  };

  const handleMaxChange = (e) => {
    const newMax = Math.max(Number(e.target.value), minValue + 10);
    setMaxValue(newMax);
    onValueChange([minValue, newMax]);
  };

  const getTrackBackground = () => {
    const minPercent = ((minValue - min) / (max - min)) * 100;
    const maxPercent = ((maxValue - min) / (max - min)) * 100;
    return `linear-gradient(to right, #d1d5db ${minPercent}%, #e11d48 ${minPercent}%, #e11d48 ${maxPercent}%, #d1d5db ${maxPercent}%)`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm font-medium text-gray-700">
        <span>₹{minValue}</span>
        <span>₹{maxValue}</span>
      </div>
      <div className="relative h-3">
        <div
          className="absolute w-full h-3 rounded-full"
          style={{ background: getTrackBackground() }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={handleMinChange}
          className="absolute w-full h-3 bg-transparent appearance-none cursor-pointer"
          style={{ zIndex: maxValue - minValue < 50 ? 2 : 1 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-3 bg-transparent appearance-none cursor-pointer"
        />
        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            background: #e11d48;
            border: 3px solid #ffffff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            transition: transform 0.2s ease;
          }
          input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          input[type='range']::-moz-range-thumb {
            width: 24px;
            height: 24px;
            background: #e11d48;
            border: 3px solid #ffffff;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            transition: transform 0.2s ease;
          }
          input[type='range']::-moz-range-thumb:hover {
            transform: scale(1.1);
          }
          input[type='range']::-webkit-slider-runnable-track {
            background: transparent;
          }
          input[type='range']::-moz-range-track {
            background: transparent;
          }
        `}</style>
      </div>
    </div>
  );
};

const Products = () => {
  const { category } = useParams();
  const { products } = useAdmin();
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Get products by category from AdminContext
  const getProductsByCategory = (category) => {
    if (!category) return products;
    return products.filter(product => 
      product.category && product.category.toLowerCase() === category.toLowerCase()
    );
  };

  const allProducts = getProductsByCategory(category);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = allProducts.filter(
      product => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high':
        return filtered.sort((a, b) => b.price - a.price);
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return filtered.sort((a, b) => b.id - a.id);
      default:
        return filtered;
    }
  }, [allProducts, sortBy, priceRange]);

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handlePriceRangeChange = (newRange) => {
    setPriceRange(newRange);
    toast({
      title: 'Filters Updated',
      description: `Price range set to ₹${newRange[0]} - ₹${newRange[1]}`,
    });
  };

  const clearFilters = () => {
    setSortBy('featured');
    setPriceRange([0, 2000]);
    setShowFilters(false);
    toast({
      title: 'Filters Reset',
      description: 'All filters have been cleared.',
    });
  };

  const getCategoryTitle = () => {
    if (!category) return 'All Products';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryDescription = () => {
    switch (category) {
      case 'bracelets':
        return 'Elegant bracelets crafted with precision and style';
      case 'rings':
        return 'Stunning rings for every occasion and celebration';
      default:
        return 'Discover our complete collection of fine jewelry';
    }
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
            <h1 className="font-display text-4xl md:text-6xl font-bold">
              {getCategoryTitle()}
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {getCategoryDescription()}
            </p>
            <div className="text-lg opacity-80">
              {filteredAndSortedProducts.length} products available
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleFilterToggle}
              className="flex items-center space-x-2 border-rose-200 hover:bg-rose-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>

            <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
                  <RangeSlider
                    min={0}
                    max={2000}
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                  />
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Category</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Bracelets</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Rings</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {rating}+ stars
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <div className={`grid gap-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredAndSortedProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredAndSortedProducts.length > 0 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="default" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;