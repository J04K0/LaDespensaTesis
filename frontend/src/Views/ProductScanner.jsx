import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Swal from 'sweetalert2';
import { scanProducts } from '../services/AddProducts.service.js';
import '../styles/ProductScannerStyles.css';

const ProductScanner = () => {
  const navigate = useNavigate();
  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);

  const handleScan = async (e) => {
    e.preventDefault();

    if (!codigoEscaneado.trim()) {
      Swal.fire({
        title: 'Código inválido',
        text: 'Ingrese un código de barras válido',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      const response = await scanProducts(codigoEscaneado);
      console.log("✅ Producto escaneado:", response);

      const productoEncontrado = response.data.data;

      if (productoEncontrado) {
        setProducto({ ...productoEncontrado, stock: productoEncontrado.stock });
        Swal.fire({
          title: 'Producto encontrado',
          html: `
            <strong>Nombre:</strong> ${productoEncontrado.nombre} <br>
            <strong>Marca:</strong> ${productoEncontrado.marca} <br>
            <strong>Categoría:</strong> ${productoEncontrado.categoria} <br>
            <strong>Stock:</strong> ${productoEncontrado.stock} <br>
            <strong>Precio Venta:</strong> $${productoEncontrado.precioVenta} <br>
            <strong>Fecha de Vencimiento:</strong> ${new Date(productoEncontrado.fechaVencimiento).toLocaleDateString()}
          `,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      } else {
        setProducto(null);
        Swal.fire({
          title: 'Producto no encontrado',
          text: 'No existe un producto con este código de barras en la base de datos.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }

      setCodigoEscaneado('');
      setCantidad(1);
    } catch (error) {
      console.error("❌ Error al escanear el producto:", error);
      setProducto(null);
      Swal.fire({
        title: 'Error al escanear el producto',
        text: error.response?.data?.message || 'Ha ocurrido un error inesperado',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const disminuirCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  const incrementarCantidad = () => {
    if (producto && cantidad < producto.stock) {
      setCantidad(cantidad + 1);
    }
  };

  const agregarAlCarrito = () => {
    if (!producto) {
      Swal.fire({
        title: 'Error',
        text: 'Debes escanear un producto primero',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (producto.stock < cantidad) {
      Swal.fire({
        title: 'Stock insuficiente',
        text: 'No hay suficiente stock disponible para esta cantidad.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const productoEnCarrito = carrito.find(p => p.codigoBarras === producto.codigoBarras);

    if (productoEnCarrito) {
      setCarrito(carrito.map(p =>
        p.codigoBarras === producto.codigoBarras
          ? { ...p, cantidad: p.cantidad + cantidad }
          : p
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad }]);
    }

    // Restar del stock total al agregar al carrito
    setProducto({ ...producto, stock: producto.stock - cantidad });

    Swal.fire({
      title: 'Producto agregado',
      text: `${cantidad} unidades de ${producto.nombre} agregadas al carrito.`,
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });

    setCodigoEscaneado('');
    setCantidad(1);
  };

  const eliminarDelCarrito = (index) => {
    const productoEliminado = carrito[index];

    // Restaurar stock en la vista si el producto eliminado es el mismo que el mostrado
    if (producto && producto.codigoBarras === productoEliminado.codigoBarras) {
      setProducto({ ...producto, stock: producto.stock + productoEliminado.cantidad });
    }

    // Filtrar el producto eliminado del carrito
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  // 🔴 Nuevo: Resetear la página al estado inicial después de la venta
  const finalizarVenta = () => {
    if (carrito.length === 0) {
      Swal.fire({
        title: 'Carrito vacío',
        text: 'Agrega productos antes de finalizar la venta.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    Swal.fire({
      title: 'Venta realizada',
      text: 'Los productos han sido vendidos con éxito y el stock ha sido actualizado.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    }).then(() => {
      // 🔄 Restablecer todos los estados
      setCarrito([]);  // Vaciar carrito
      setProducto(null); // Quitar producto escaneado
      setCodigoEscaneado(''); // Resetear input
      setCantidad(1); // Resetear cantidad
    });
  };

  return (
    <div className="scanner-container">
      <Navbar />

      {/* Barra de búsqueda */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Ingrese código de barras"
          value={codigoEscaneado}
          onChange={(e) => setCodigoEscaneado(e.target.value)}
          autoFocus
        />
        <button onClick={handleScan}>Escanear</button>
      </div>

      <div className="scanner-content">
        <div className="scanner-section">
          <h2>Escanear Producto</h2>

          {producto && (
            <div className="product-info">
              <h3>{producto.nombre}</h3>
              <p>Marca: {producto.marca}</p>
              <p>Categoría: {producto.categoria}</p>
              <p className="product-price">Precio: ${producto.precioVenta}</p>
              <p>Stock restante: {producto.stock}</p>
              <p>Fecha de Vencimiento: {new Date(producto.fechaVencimiento).toLocaleDateString()}</p>

              <div className="quantity-controls">
                <button onClick={disminuirCantidad}>-</button>
                <span>{cantidad}</span>
                <button onClick={incrementarCantidad}>+</button>
              </div>

              <button className="add-to-cart-button" onClick={agregarAlCarrito}>
                Agregar al carrito
              </button>
            </div>
          )}
        </div>

        <div className="cart-section">
          <h2>Carrito de Compras</h2>
          <ul className="cart-list">
            {carrito.map((producto, index) => (
              <li key={index}>
                {producto.nombre} - Cantidad: {producto.cantidad} - Total: ${producto.precioVenta * producto.cantidad}
                <button className="delete-product" onClick={() => eliminarDelCarrito(index)}>
                  🗑
                </button>
              </li>
            ))}
          </ul>
          {carrito.length > 0 && (
            <>
              <p className="total-price">Total: ${carrito.reduce((acc, p) => acc + p.precioVenta * p.cantidad, 0)}</p>
              <button className="checkout-button" onClick={finalizarVenta}>
                Aceptar Venta
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductScanner;
