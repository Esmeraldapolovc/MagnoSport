import { jwtDecode } from "jwt-decode";

export const getUserFromToken = () => {
  const token = sessionStorage.getItem("token"); 
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      sessionStorage.removeItem("token");
      
      // Disparar evento
      const event = new CustomEvent('auth-error');
      window.dispatchEvent(event);
      
      return null;
    }
    return decoded;
  } catch (error) {
    sessionStorage.removeItem("token");
    return null;
  }
};