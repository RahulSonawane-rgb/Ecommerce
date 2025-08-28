import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated || !user?.isAdmin) {
    toast({
      title: "Access Denied",
      description: "You do not have permission to view this page.",
      variant: "destructive"
    });
    return <Navigate to="/account" replace />;
  }

  return children;
};

export default AdminRoute;