import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthErrorHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthError = () => {
      alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      navigate('/login');
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [navigate]);

  return null;
};

export default AuthErrorHandler;