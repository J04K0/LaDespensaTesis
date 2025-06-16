import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import cookies from 'js-cookie';
import 'react-toastify/dist/ReactToastify.css';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        const token = cookies.get('jwt-auth');
        
        if (userData && token) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('✅ Usuario autenticado detectado:', parsedUser.email);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          console.log('❌ No hay autenticación válida');
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        checkAuth();
      }
    };

    // Escuchar eventos personalizados de autenticación
    const handleAuthStateChanged = (e) => {
      console.log('🔄 Estado de autenticación cambió:', e.detail);
      const { authenticated, user: userData } = e.detail;
      
      if (authenticated && userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, []);

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated && window.location.pathname !== '/auth') {
      console.log('🔄 Redirigiendo a login...');
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Función para actualizar el estado de autenticación manualmente
  const updateAuthState = (userData = null) => {
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      isLoading, 
      updateAuthState 
    }}>
      {children}
      <ToastContainer />
    </AuthContext.Provider>
  );
}