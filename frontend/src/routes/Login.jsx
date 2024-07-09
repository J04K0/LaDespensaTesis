import axios from './root.service';
import jwtDecode from 'jwt-decode';

export const login = async ({ email, password }) => {
  try {
    const response = await axios.post('/auth/login', { email, password });
    const { status, data } = response;
    if (status === 200) {
      const { email, roles } = jwtDecode(data.data.accessToken);
      localStorage.setItem('user', JSON.stringify({ email, roles }));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};