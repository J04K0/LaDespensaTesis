import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import { scanProducts, actualizarStockVenta, registrarVenta } from "../services/AddProducts.service.js";
import "../styles/ProductScannerStyles.css";

const ProductScanner = () => {
  const navigate = useNavigate();
  const [codigoEscaneado, setCodigoEscaneado] = useState("");
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!codigoEscaneado.trim()) {
      Swal.fire({
        title: "Código inválido",
        text: "Ingrese un código de barras válido",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await scanProducts(codigoEscaneado);
      const productoEncontrado = response.data.data;
      if (productoEncontrado) {
        setProducto({ ...productoEncontrado, stock: productoEncontrado.stock });
        agregarAlCarrito({ ...productoEncontrado, stock: productoEncontrado.stock });
      } else {
        setProducto(null);
        Swal.fire({
          title: "Producto no encontrado",
          text: "No existe un producto con este código de barras en la base de datos.",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
      }
      setCodigoEscaneado("");
      setCantidad(1);
    } catch (error) {
      console.error("❌ Error al escanear el producto:", error);
      setError("Error al escanear el producto. Inténtalo de nuevo.");
      setProducto(null);
    } finally {
      setLoading(false);
    }
  };

  const disminuirCantidad = useCallback(() => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  }, [cantidad]);

  const incrementarCantidad = useCallback(() => {
    if (producto && cantidad < producto.stock) {
      setCantidad(cantidad + 1);
    }
  }, [cantidad, producto]);

  const agregarAlCarrito = (producto) => {
    if (!producto) {
      Swal.fire({
        title: "Error",
        text: "Debes escanear un producto primero",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
  
    if (producto.stock < cantidad) {
      Swal.fire({
        title: "Stock insuficiente",
        text: "No hay suficiente stock disponible para esta cantidad.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return;
    }
  
    // Verificar si el producto ya está en el carrito
    const productoEnCarrito = carrito.find((p) => p.codigoBarras === producto.codigoBarras);
  
    let nuevoCarrito;
    if (productoEnCarrito) {
      nuevoCarrito = carrito.map((p) =>
        p.codigoBarras === producto.codigoBarras
          ? { ...p, cantidad: p.cantidad + cantidad }
          : p
      );
    } else {
      nuevoCarrito = [
        ...carrito,
        {
          ...producto,
          cantidad,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra
        }
      ];
    }
  
    // Actualizar el estado del carrito
    setCarrito(nuevoCarrito);
  
    // No modificar el stock de `producto`, sino restarlo en el estado del carrito
    setCodigoEscaneado("");
    setCantidad(1);
  };
  

  const eliminarDelCarrito = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const incrementarCantidadCarrito = (index) => {
    const productoEnCarrito = carrito[index];
    if (productoEnCarrito.cantidad < productoEnCarrito.stock) {
      setCarrito(
        carrito.map((p, i) =>
          i === index ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    }
  };

  const disminuirCantidadCarrito = (index) => {
    const productoEnCarrito = carrito[index];
    if (productoEnCarrito.cantidad > 1) {
      setCarrito(
        carrito.map((p, i) =>
          i === index ? { ...p, cantidad: p.cantidad - 1 } : p
        )
      );
    }
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      Swal.fire({
        title: "Carrito vacío",
        text: "Agrega productos antes de finalizar la venta.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
  
    console.log("📦 Carrito antes de registrar venta:", carrito); // ✅ Depuración
  
    setLoading(true);
    setError(null);
    try {
      await actualizarStockVenta(carrito); // ✅ Actualiza el stock en la base de datos
      await registrarVenta(carrito); // ✅ Registra la venta en la base de datos
  
      Swal.fire({
        title: "Venta realizada",
        text: "Los productos han sido vendidos con éxito y el stock ha sido actualizado.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });
  
      setCarrito([]);  // Vaciar carrito
      setProducto(null); // Limpiar producto escaneado
      setCodigoEscaneado(""); // Limpiar input
      setCantidad(1); // Reiniciar cantidad
    } catch (error) {
      console.error("❌ Error al registrar la venta:", error);
      setError("Hubo un problema al actualizar el stock y registrar la venta en la base de datos.");
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al registrar la venta en la base de datos.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="scanner-container">
      <Navbar />
      <SearchBar
        codigoEscaneado={codigoEscaneado}
        setCodigoEscaneado={setCodigoEscaneado}
        handleScan={handleScan}
      />
      <div className="scanner-content">
        <ProductInfo
          producto={producto}
          cantidad={cantidad}
          disminuirCantidad={disminuirCantidad}
          incrementarCantidad={incrementarCantidad}
          agregarAlCarrito={agregarAlCarrito}
        />
        <Cart
          carrito={carrito}
          eliminarDelCarrito={eliminarDelCarrito}
          incrementarCantidadCarrito={incrementarCantidadCarrito}
          disminuirCantidadCarrito={disminuirCantidadCarrito}
          finalizarVenta={finalizarVenta}
        />
      </div>
      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

const SearchBar = React.memo(({ codigoEscaneado, setCodigoEscaneado, handleScan }) => (
  <div className="search-bar">
    <input
      type="text"
      placeholder="Ingrese código de barras"
      value={codigoEscaneado}
      onChange={(e) => setCodigoEscaneado(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleScan(e);
        }
      }}
      autoFocus
      aria-label="Código de barras"
    />
  </div>
));

const ProductInfo = React.memo(({ producto }) => (
  
  <div className="scanner-section">
    <h2>Escanear Producto</h2>
    {producto && (
      <div className="product-info">
        <h3>{producto.nombre}</h3>
        <p>Marca: {producto.marca}</p>
        <p>Categoría: {producto.categoria}</p>
        <p className="product-price">Precio: ${producto.precioVenta}</p>
        <p className="product-price">Precio de compra: ${producto.precioCompra}</p>
        <p>Stock restante: {producto.stock}</p>
        <p>Fecha de Vencimiento: {new Date(producto.fechaVencimiento).toLocaleDateString()}</p>
      </div>
    )}
  </div>
));

const Cart = React.memo(({ carrito, eliminarDelCarrito, incrementarCantidadCarrito, disminuirCantidadCarrito, finalizarVenta }) => (
  <div className="cart-section">
    <h2>Carrito de Compras</h2>
    <ul className="cart-list">
      {carrito.map((producto, index) => (
        <li key={index}>
          {producto.nombre} - Cantidad: {producto.cantidad} - Total: ${producto.precioVenta * producto.cantidad}
          <div className="quantity-controls">
            <button onClick={() => disminuirCantidadCarrito(index)} aria-label="Disminuir cantidad">-</button>
            <span>{producto.cantidad}</span>
            <button onClick={() => incrementarCantidadCarrito(index)} aria-label="Incrementar cantidad">+</button>
            <button className="delete-product" onClick={() => eliminarDelCarrito(index)} aria-label="Eliminar producto">
              🗑
            </button>
          </div>
        </li>
      ))}
    </ul>
    {carrito.length > 0 && (
      <>
        <p className="total-price">Total: ${carrito.reduce((acc, p) => acc + p.precioVenta * p.cantidad, 0)}</p>
        <button className="checkout-button" onClick={finalizarVenta} aria-label="Aceptar venta">
          Aceptar Venta
        </button>
      </>
    )}
  </div>
));

export default ProductScanner;