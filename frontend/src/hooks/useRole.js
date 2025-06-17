import { useMemo } from 'react';

export const useRole = () => {
  const user = useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }, []);

  const userRole = useMemo(() => {
    if (!user?.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
      return 'empleado'; // Rol por defecto
    }
    // Retornar el primer rol del usuario
    return user.roles[0].name || 'empleado';
  }, [user]);

  // Definir permisos por rol
  const permissions = useMemo(() => {
    const rolePermissions = {
      admin: {
        canAccessHistorySale: true,
        canAddProduct: true,
        canManageProveedores: true,
        canAccessFinanzas: true,
        canAccessCuentasPorPagar: true,
        canAccessAll: true
      },
      jefe: {
        canAccessHistorySale: true,
        canAddProduct: true,
        canManageProveedores: true,
        canAccessFinanzas: true,
        canAccessCuentasPorPagar: true,
        canAccessAll: true
      },
      empleado: {
        canAccessHistorySale: false,
        canAddProduct: false,
        canManageProveedores: false,
        canAccessFinanzas: false,
        canAccessCuentasPorPagar: false,
        canAccessAll: false
      }
    };

    return rolePermissions[userRole] || rolePermissions.empleado;
  }, [userRole]);

  // Función para verificar si el usuario puede acceder a una ruta específica
  const canAccessRoute = useMemo(() => {
    return (routePath) => {
      // Si es admin o jefe, puede acceder a todo
      if (userRole === 'admin' || userRole === 'jefe') {
        return true;
      }

      // Rutas restringidas para empleados
      const restrictedRoutes = [
        '/HistorySale',
        '/add-product', 
        '/proveedores',
        '/finanzas',
        '/cuentas-por-pagar'
      ];

      return !restrictedRoutes.includes(routePath);
    };
  }, [userRole]);

  return {
    user,
    userRole,
    permissions,
    canAccessRoute,
    isAdmin: userRole === 'admin',
    isJefe: userRole === 'jefe',
    isEmpleado: userRole === 'empleado'
  };
};