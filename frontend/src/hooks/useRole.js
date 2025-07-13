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
      return 'empleado';
    }
    return user.roles[0].name || 'empleado';
  }, [user]);

  const permissions = useMemo(() => {
    const rolePermissions = {
      admin: {
        canAccessHistorySale: true,
        canAddProduct: true,
        canEditProduct: true,
        canManageProveedores: true,
        canAccessFinanzas: true,
        canAccessCuentasPorPagar: true,
        canAccessAll: true
      },
      jefe: {
        canAccessHistorySale: true,
        canAddProduct: true,
        canEditProduct: true,
        canManageProveedores: true,
        canAccessFinanzas: true,
        canAccessCuentasPorPagar: true,
        canAccessAll: true
      },
      empleado: {
        canAccessHistorySale: true,
        canAddProduct: false,
        canEditProduct: false,
        canManageProveedores: false,
        canAccessFinanzas: false,
        canAccessCuentasPorPagar: false,
        canAccessAll: false
      }
    };

    return rolePermissions[userRole] || rolePermissions.empleado;
  }, [userRole]);

  const canAccessRoute = useMemo(() => {
    return (routePath) => {
      if (userRole === 'admin' || userRole === 'jefe') {
        return true;
      }

      const restrictedRoutes = [
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