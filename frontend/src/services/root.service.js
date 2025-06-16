import axios from 'axios';
import cookies from 'js-cookie';
const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:4000/api';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const token = cookies.get('jwt-auth', { path: '/' });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es un error 401 (no autorizado) y no hemos reintentado ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        console.log('🔄 Token expirado, intentando refrescar...');
        const refreshResponse = await axios.get('/auth/refresh', { withCredentials: true });
        
        if (refreshResponse.data.status === 'success') {
          const newToken = refreshResponse.data.data.accessToken;
          
          // Actualizar el token en las cookies y headers
          cookies.set('jwt-auth', newToken, { path: '/' });
          instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          console.log('✅ Token refrescado exitosamente');
          
          // Reintentar la petición original
          return instance(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Error al refrescar token:', refreshError);
        
        // Si falla el refresh, limpiar datos y redirigir al login
        localStorage.removeItem('user');
        cookies.remove('jwt-auth');
        delete instance.defaults.headers.common['Authorization'];
        
        // Redirigir al login
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default instance;