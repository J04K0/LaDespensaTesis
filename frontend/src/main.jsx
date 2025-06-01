import ReactDOM from 'react-dom/client';
import App from './routes/App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './routes/Root.jsx';
import ErrorPage from './routes/ErrorPage.jsx';
import Login from './routes/Login.jsx';
import Products from './Views/Products.jsx';
import AddProducts from './Views/AddProducts.jsx';
import DeudoresList from './Views/Deudores.jsx';
import AddDeudor from './Views/AddDeudor.jsx';
import ProductScanner from './Views/ProductScanner.jsx';
import HistorySale from './Views/HistorySale.jsx';
import Finanzas from './Views/Finanzas.jsx';
import Proveedores from './Views/Proveedores.jsx';
import CuentasPorPagar from './Views/CuentasPorPagar.jsx';
import FooterLayout from './components/FooterLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/auth',
    element: <Login />,
  },
  {
    path: '/home',
    element: <FooterLayout><App /></FooterLayout>,
  },
  {
    path: '/products',
    element: <FooterLayout><Products /></FooterLayout>,
  },
  {
    path: '/add-product',
    element: <FooterLayout><AddProducts /></FooterLayout>,
  },
  {
    path: '/deudores',
    element: <FooterLayout><DeudoresList /></FooterLayout>,
  },
  {
    path: '/agregar-deudor',
    element: <FooterLayout><AddDeudor /></FooterLayout>,
  },
  {
    path: '/ProductScanner',
    element: <FooterLayout><ProductScanner /></FooterLayout>,
  },
  {
    path: '/HistorySale',
    element: <FooterLayout><HistorySale /></FooterLayout>,
  },
  {
    path: '/finanzas',
    element: <FooterLayout><Finanzas /></FooterLayout>,
  },
  {
    path: '/proveedores',
    element: <FooterLayout><Proveedores /></FooterLayout>,
  },
  {
    path: '/cuentas-por-pagar',
    element: <FooterLayout><CuentasPorPagar /></FooterLayout>,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
