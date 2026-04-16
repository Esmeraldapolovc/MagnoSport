import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// Interceptor para manejar respuestas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Verificar si el error es por token expirado (401)
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem("token");
      
      
      alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;