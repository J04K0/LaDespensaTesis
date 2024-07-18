import ReactDOM from 'react-dom/client';
import App from './routes/App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './routes/Root.jsx';
import ErrorPage from './routes/ErrorPage.jsx';
import Login from './routes/Login.jsx';
import Products from './Views/Products.jsx';
import AddProducts from './Views/AddProducts.jsx';


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

]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
