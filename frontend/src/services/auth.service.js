import axios from './root.service';
import cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';

export const login = async ({ email, password }) => {
  try {
    const response = await axios.post('auth/login', { email, password });
    const { status, data } = response;
    if (status === 200) {
      const { email, roles } = await jwtDecode(data.data.accessToken);
      const userData = { email, roles };
      
      // Guardar datos del usuario y token
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('sessionStartTime', new Date().toISOString());
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
      cookies.set('jwt-auth', data.data.accessToken, { path: '/' });

      console.log('✅ Login exitoso para:', email);
      
      // Disparar evento personalizado para notificar al contexto
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { authenticated: true, user: userData } 
      }));
    }
  } catch (error) {
    console.error('❌ Error en login:', error);
    if (error.response && error.response.status === 401) {
      throw new Error('Credenciales incorrectas');
    } else {
      throw new Error('Error al iniciar sesión');
    }
  }
};

export const logout = () => {
  console.log('🔄 Cerrando sesión...');
  
  // Limpiar datos locales
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  cookies.remove('jwt');
  cookies.remove('jwt-auth');
  
  // Disparar evento de cambio de autenticación
  window.dispatchEvent(new CustomEvent('authStateChanged', { 
    detail: { authenticated: false, user: null } 
  }));
};