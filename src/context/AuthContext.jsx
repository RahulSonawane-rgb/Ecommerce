import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const ADMIN_EMAIL = 'admin@hidaya.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('hidaya-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const isAdmin = email === ADMIN_EMAIL;
    // In a real app, you would validate the password against a backend.
    const mockUser = { id: 1, email, name: isAdmin ? 'Admin' : 'Jane Doe', isAdmin };
    localStorage.setItem('hidaya-user', JSON.stringify(mockUser));
    setUser(mockUser);
    navigate('/account');
    return mockUser;
  };

  const register = (name, email, password) => {
    // Prevent registering with admin email
    if (email === ADMIN_EMAIL) {
        throw new Error("This email address is reserved.");
    }
    const mockUser = { id: Date.now(), email, name, isAdmin: false };
    localStorage.setItem('hidaya-user', JSON.stringify(mockUser));
    setUser(mockUser);
    navigate('/account');
    return mockUser;
  };

  const logout = () => {
    localStorage.removeItem('hidaya-user');
    setUser(null);
    navigate('/');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
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