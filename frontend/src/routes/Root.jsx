import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth.service';
import { useAuth,AuthProvider } from '../context/AuthContext';

function Root() {
  return (
    <AuthProvider>
      <PageRoot />
    </AuthProvider> 
  );
}

function PageRoot() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
    navigate('/home');
    navigate('/products');
    navigate('/add-product');
    navigate('/deudores');
    navigate('/editar-deudor');
    navigate('/agregar-deudor');
    navigate('/edit-product');
    navigate('/ProductsSinStock');
    navigate('/ProductScanner');
    navigate('/estadisticas');
    navigate('/HistorySale');
  };

  const { user } = useAuth();

  return (
   <h1>Home!</h1>
  );
}

export default Root;
