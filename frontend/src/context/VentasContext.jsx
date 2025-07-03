import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { obtenerVentasPorTicket } from '../services/venta.service';
import cookies from 'js-cookie';

const VentasContext = createContext();

export const useVentas = () => {
  const context = useContext(VentasContext);
  if (!context) {
    throw new Error('useVentas debe ser usado dentro de un VentasProvider');
  }
  return context;
};

export const VentasProvider = ({ children }) => {
  const [ventasGlobales, setVentasGlobales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const user = localStorage.getItem('user');
        const token = cookies.get('jwt-auth');
        
        if (!user || !token) {
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        
        const response = await obtenerVentasPorTicket();
        const ventas = response.data || [];
        
        setVentasGlobales(ventas);
        setLastFetch(new Date());
        setRetryCount(0);
      } catch (err) {
        console.error('❌ Error al cargar ventas globales:', err);
        
        // Si es error de autenticación y no hemos reintentado muchas veces
        if ((err.response?.status === 401 || err.response?.status === 403) && retryCount < 2) {
          console.log(`🔄 Reintentando carga de ventas (intento ${retryCount + 1}/2)...`);
          setRetryCount(prev => prev + 1);
          
          // Reintentar después de un breve delay
          setTimeout(() => {
            fetchVentas();
          }, 1000);
          return;
        }
        
        setError('Error al cargar los datos de ventas');
        setVentasGlobales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, [retryCount]);

  useEffect(() => {
    const handleStorageChange = () => {
      const user = localStorage.getItem('user');
      const token = cookies.get('jwt-auth');
      
      if (user && token && !ventasGlobales && !loading) {
        setRetryCount(0);
      }
    };

    const handleAuthStateChanged = (e) => {
      const { authenticated } = e.detail;
      
      if (authenticated && !ventasGlobales && !loading) {
        setRetryCount(0);
      } else if (!authenticated) {
        setVentasGlobales(null);
        setError(null);
        setLoading(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, [ventasGlobales, loading]);

  const getVentasProducto = useMemo(() => {
    return (codigoBarras, nombre = null) => {
      if (!ventasGlobales) return [];
      
      return ventasGlobales.filter(venta => {
        // Buscar en el array de productos de cada ticket
        if (venta.ventas && Array.isArray(venta.ventas)) {
          return venta.ventas.some(producto => 
            producto.codigoBarras === codigoBarras || 
            (nombre && producto.nombre === nombre)
          );
        }
        return venta.codigoBarras === codigoBarras || 
               (nombre && venta.nombre === nombre);
      }).flatMap(venta => {
        if (venta.ventas && Array.isArray(venta.ventas)) {
          return venta.ventas
            .filter(producto => 
              producto.codigoBarras === codigoBarras || 
              (nombre && producto.nombre === nombre)
            )
            .map(producto => ({
              ...producto,
              fecha: venta.fecha,
              ticketId: venta._id
            }));
        }
        if (venta.codigoBarras === codigoBarras || (nombre && venta.nombre === nombre)) {
          return [{
            ...venta,
            ticketId: venta._id
          }];
        }
        return [];
      });
    };
  }, [ventasGlobales]);

  const getVentasByDateRange = useMemo(() => {
    return (fechaInicio, fechaFin) => {
      if (!ventasGlobales) return [];
      
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);

      return ventasGlobales.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= inicio && fechaVenta <= fin;
      });
    };
  }, [ventasGlobales]);

  const getVentasByCategoria = useMemo(() => {
    return (categoria) => {
      if (!ventasGlobales) return [];
      
      return ventasGlobales.filter(venta => {
        if (venta.ventas && Array.isArray(venta.ventas)) {
          return venta.ventas.some(producto => producto.categoria === categoria);
        }
        return venta.categoria === categoria;
      });
    };
  }, [ventasGlobales]);

  const getEstadisticasRapidas = useMemo(() => {
    if (!ventasGlobales) {
      return {
        totalVentas: 0,
        ingresosTotales: 0,
        transacciones: 0,
        productosMasVendidos: [],
        categoriasPrincipales: []
      };
    }

    let ingresosTotales = 0;
    let transacciones = ventasGlobales.length;
    const productos = {};
    const categorias = {};

    ventasGlobales.forEach(venta => {
      if (venta.ventas && Array.isArray(venta.ventas)) {
        venta.ventas.forEach(producto => {
          const ingreso = producto.precioVenta * producto.cantidad;
          ingresosTotales += ingreso;
          
          const nombreProducto = producto.nombre;
          productos[nombreProducto] = (productos[nombreProducto] || 0) + producto.cantidad;
          
          const categoria = producto.categoria || 'Sin categoría';
          categorias[categoria] = (categorias[categoria] || 0) + producto.cantidad;
        });
      } else {
        const ingreso = venta.precioVenta * venta.cantidad;
        ingresosTotales += ingreso;
        
        productos[venta.nombre] = (productos[venta.nombre] || 0) + venta.cantidad;
        categorias[venta.categoria || 'Sin categoría'] = (categorias[venta.categoria || 'Sin categoría'] || 0) + venta.cantidad;
      }
    });

    const productosMasVendidos = Object.entries(productos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    const categoriasPrincipales = Object.entries(categorias)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    return {
      totalVentas: Object.values(productos).reduce((a, b) => a + b, 0),
      ingresosTotales,
      transacciones,
      productosMasVendidos,
      categoriasPrincipales
    };
  }, [ventasGlobales]);

  const refreshVentas = async () => {
    setLoading(true);
    try {
      const response = await obtenerVentasPorTicket();
      const ventas = response.data || [];
      
      console.log(`✅ Ventas refrescadas: ${ventas.length} registros`);
      setVentasGlobales(ventas);
      setLastFetch(new Date());
      setError(null);
    } catch (err) {
      console.error('❌ Error al refrescar ventas:', err);
      setError('Error al refrescar los datos de ventas');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    ventasGlobales,
    loading,
    error,
    lastFetch,
    
    getVentasProducto,
    getVentasByDateRange,
    getVentasByCategoria,
    getEstadisticasRapidas,
    
    refreshVentas
  };

  return (
    <VentasContext.Provider value={value}>
      {children}
    </VentasContext.Provider>
  );
};