import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OdooUsers, ValidationUtils } from '@/lib/odooServices';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

const ADMIN_EMAIL = 'admin@hidaya.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('hidaya-user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('hidaya-user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsAuthenticating(true);
    
    try {
      // Handle admin login separately
      if (email === ADMIN_EMAIL) {
        // For admin, we'll use a simple check (in production, use proper authentication)
        if (password === 'admin123') { // This should be replaced with proper admin authentication
          const adminUser = { 
            id: 'admin', 
            email, 
            name: 'Admin', 
            isAdmin: true,
            mobile: '9876543210'
          };
          localStorage.setItem('hidaya-user', JSON.stringify(adminUser));
          setUser(adminUser);
          return adminUser;
        } else {
          throw new Error('Invalid admin credentials.');
        }
      }

      // Regular user authentication with Odoo
      const userData = await OdooUsers.authenticate(email, password);
      
      // Store user data
      const userWithTimestamp = {
        ...userData,
        isAdmin: false,
        lastLogin: new Date().toISOString()
      };
      
      localStorage.setItem('hidaya-user', JSON.stringify(userWithTimestamp));
      setUser(userWithTimestamp);
      
      toast({
        title: "Login Successful!",
        description: `Welcome back, ${userData.name}!`
      });
      
      return userWithTimestamp;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const register = async (userData) => {
    setIsAuthenticating(true);
    
    try {
      // Prevent registering with admin email
      if (userData.email === ADMIN_EMAIL) {
        throw new Error("This email address is reserved.");
      }

      // Validate input
      if (!userData.name || !userData.email || !userData.mobile || !userData.password) {
        throw new Error("All fields are required.");
      }

      if (!ValidationUtils.validateEmail(userData.email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!ValidationUtils.validateMobile(userData.mobile)) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }

      if (!ValidationUtils.validatePassword(userData.password)) {
        throw new Error("Password must be at least 6 characters long.");
      }

      // Register user with Odoo
      const newUser = await OdooUsers.register({
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        password: userData.password // In production, this should be hashed
      });

      // Store user data
      const userWithTimestamp = {
        ...newUser,
        isAdmin: false,
        lastLogin: new Date().toISOString()
      };
      
      localStorage.setItem('hidaya-user', JSON.stringify(userWithTimestamp));
      setUser(userWithTimestamp);
      
      toast({
        title: "Account Created Successfully!",
        description: `Welcome to HIDAYA Jewelry, ${newUser.name}!`
      });
      
      return userWithTimestamp;
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user || user.isAdmin) {
      throw new Error("Cannot update admin profile.");
    }

    try {
      const updatedUser = await OdooUsers.updateUser(user.id, updates);
      
      // Update local user data
      const userWithTimestamp = {
        ...updatedUser,
        isAdmin: false,
        lastLogin: user.lastLogin
      };
      
      localStorage.setItem('hidaya-user', JSON.stringify(userWithTimestamp));
      setUser(userWithTimestamp);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
      
      return updatedUser;
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('hidaya-user');
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
    navigate('/');
  };

  const checkAuth = async () => {
    if (!user) return false;
    
    try {
      // For admin, we don't need to verify with Odoo
      if (user.isAdmin) return true;
      
      // Verify user still exists in Odoo
      const currentUser = await OdooUsers.getUserById(user.id);
      if (!currentUser || !currentUser.isActive) {
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't logout on network errors, only on actual auth failures
      return true;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    isAuthenticating,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};