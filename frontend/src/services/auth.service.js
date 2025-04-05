import axios from './root.service';
import cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';

export const login = async ({ email, password }) => {
  try {
    const response = await axios.post('auth/login', { email, password });
    const { status, data } = response;
    if (status === 200) {
      const { email, roles } = await jwtDecode(data.data.accessToken);
      localStorage.setItem('user', JSON.stringify({ email, roles }));
      localStorage.setItem('sessionStartTime', new Date().toISOString()); // Registrar inicio de sesión
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
      cookies.set('jwt-auth', data.data.accessToken, { path: '/' });
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('Credenciales incorrectas');
    } else {
      throw new Error('Error al iniciar sesión');
    }
  }
};

export const logout = () => {
  localStorage.removeItem('user');
  // No eliminamos 'sessionStartTime' porque lo necesitamos para el reporte
  delete axios.defaults.headers.common['Authorization'];
  cookies.remove('jwt');
  cookies.remove('jwt-auth');
};

export const test = async () => {
  try {
    const response = await axios.get('/users');
    const { status, data } = response;
    if (status === 200) {
      console.log(data.data);
    }
  } catch (error) {
    console.log(error);
  }
};