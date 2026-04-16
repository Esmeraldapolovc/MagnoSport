import { useState, useEffect } from "react";
import { UserContext } from "./UserContext";
import { getUserFromToken } from "../../utils/auth";

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUserFromToken());

  useEffect(() => {
    // Escuchar cambios en la autenticación
    const handleAuthError = () => {
      setUser(null);
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const login = (token) => {
    sessionStorage.setItem("token", token);
    const userData = getUserFromToken();
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setUser(null);
    
    
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};