import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useAuthenticatedData = (fetchFunction, dependencies = [], options = {}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const { 
    maxRetries = 3, 
    retryDelay = 1000,
    immediate = true,
    onSuccess,
    onError
  } = options;

  const loadData = async (isRetry = false) => {
    // No cargar datos si no está autenticado
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }
      
      console.log('🔄 Cargando datos autenticados...');
      const result = await fetchFunction();
      
      setData(result);
      setRetryCount(0);
      setError(null);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      console.log('✅ Datos cargados exitosamente');
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      
      // Manejar errores de autenticación con reintentos
      if ((err.response?.status === 401 || err.response?.status === 403) && retryCount < maxRetries) {
        console.log(`🔄 Reintentando carga de datos (intento ${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        
        setTimeout(() => {
          loadData(true);
        }, retryDelay * (retryCount + 1));
        return;
      }
      
      setError(err.message || 'Error al cargar los datos');
      
      if (onError) {
        onError(err);
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  // Cargar datos cuando cambie la autenticación o las dependencias
  useEffect(() => {
    if (!authLoading && immediate) {
      loadData();
    }
  }, [isAuthenticated, authLoading, retryCount, ...dependencies]);

  // Función para recargar manualmente
  const refetch = () => {
    setRetryCount(0);
    loadData();
  };

  return {
    data,
    loading: loading || authLoading,
    error,
    refetch,
    isRetrying: retryCount > 0
  };
};

export default useAuthenticatedData;