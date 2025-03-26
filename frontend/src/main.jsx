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
import VirtualAssistant from './components/VirtualAssistant.jsx';

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
    element: (
      <>
        <App />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/products',
    element: (
      <>
        <Products />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/add-product',
    element: (
      <>
        <AddProducts />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/deudores',
    element: (
      <>
        <DeudoresList />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/agregar-deudor',
    element: (
      <>
        <AddDeudor />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/ProductScanner',
    element: (
      <>
        <ProductScanner />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/HistorySale',
    element: (
      <>
        <HistorySale />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/finanzas',
    element: (
      <>
        <Finanzas />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/proveedores',
    element: (
      <>
        <Proveedores />
        <VirtualAssistant />
      </>
    ),
  },
  {
    path: '/cuentas-por-pagar',
    element: (
      <>
        <CuentasPorPagar />
        <VirtualAssistant />
      </>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
