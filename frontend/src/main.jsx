import ReactDOM from 'react-dom/client';
import App from './routes/App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './routes/Root.jsx';
import ErrorPage from './routes/ErrorPage.jsx';
import Login from './routes/Login.jsx';
import Products from './Views/Products.jsx';
import AddProducts from './views/AddProducts.jsx';
import DeudoresList from './views/Deudores.jsx';
import AddDeudor from './views/AddDeudor.jsx';
import ProductScanner from './views/ProductScanner.jsx';
import HistorySale from './views/HistorySale.jsx';
import Finanzas from './views/Finanzas.jsx';
import Proveedores from './views/Proveedores.jsx';
import CuentasPorPagar from './views/CuentasPorPagar.jsx';
import FooterLayout from './components/FooterLayout';
import { VentasProvider } from './context/VentasContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

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
		element: <FooterLayout>
			<ProtectedRoute requiredRoute="/add-product">
				<AddProducts />
			</ProtectedRoute>
		</FooterLayout>,
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
		element: <FooterLayout>
			<ProtectedRoute requiredRoute="/HistorySale">
				<HistorySale />
			</ProtectedRoute>
		</FooterLayout>,
	},
	{
		path: '/finanzas',
		element: <FooterLayout>
			<ProtectedRoute requiredRoute="/finanzas">
				<Finanzas />
			</ProtectedRoute>
		</FooterLayout>,
	},
	{
		path: '/proveedores',
		element: <FooterLayout>
			<ProtectedRoute requiredRoute="/proveedores">
				<Proveedores />
			</ProtectedRoute>
		</FooterLayout>,
	},
	{
		path: '/cuentas-por-pagar',
		element: <FooterLayout>
			<ProtectedRoute requiredRoute="/cuentas-por-pagar">
				<CuentasPorPagar />
			</ProtectedRoute>
		</FooterLayout>,
	},

/* Configuración de React Router con future flags de v7 */
], {
	future: {
		v7_startTransition: true,
		v7_relativeSplatPath: true,
		v7_fetcherPersist: true,
		v7_normalizeFormMethod: true,
		v7_partialHydration: true,
		v7_skipActionErrorRevalidation: true,
	},
});

ReactDOM.createRoot(document.getElementById('root')).render(
	<VentasProvider>
		<RouterProvider router={router} future={{ v7_startTransition: true }} />
	</VentasProvider>
);
