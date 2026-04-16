import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../utils/auth';

export const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const user = getUserFromToken();
      
      if (!user) {
        navigate('/login');
      }
    };

    checkAuth();
    
    const interval = setInterval(checkAuth, 60000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  return children;
};