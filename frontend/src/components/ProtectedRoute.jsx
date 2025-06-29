import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { showErrorAlert } from '../helpers/swaHelper';

const ProtectedRoute = ({ children, requiredRoute }) => {
  const { canAccessRoute, userRole } = useRole();
  const [showAlert, setShowAlert] = React.useState(false);

  if (!canAccessRoute(requiredRoute)) {
    React.useEffect(() => {
      if (!showAlert) {
        showErrorAlert(
          'Acceso Denegado',
          `No tienes permisos para acceder a esta sección. Tu rol actual es: ${userRole}`
        );
        setShowAlert(true);
      }
    }, [userRole, showAlert]);

    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;