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
import ExpiringProducts from './Views/ExpiringProducts.jsx';
import ProductScanner from './Views/ProductScanner.jsx';
import HistorySale from './Views/HistorySale.jsx';
import Finanzas from './Views/Finanzas.jsx';
import Proveedores from './Views/Proveedores.jsx';

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
    element: <App />,
  },
  {
    path: '/products',
    element: <Products />,
  },
  {
    path: '/add-product',
    element: <AddProducts />,
  },
  {
    path: '/deudores',
    element: <DeudoresList />,
  },
  {
  path: '/agregar-deudor',
  element: <AddDeudor />,
  },
  {
  path: '/expiring-products',
  element: <ExpiringProducts />,
  },
  {
  path: '/ProductScanner',
  element: <ProductScanner />,
  },
  {
  path: '/HistorySale',
  element: <HistorySale />,
  },
  {
  path: '/finanzas',
  element: <Finanzas />,
  },
  {
  path: '/proveedores',
  element: <Proveedores />,
  },
  ]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
