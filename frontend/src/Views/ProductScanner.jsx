import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import { scanProducts, actualizarStockVenta, registrarVenta } from "../services/AddProducts.service.js";
import "../styles/ProductScannerStyles.css";

const ProductScanner = () => {
  const navigate = useNavigate();
  const [codigoEscaneado, setCodigoEscaneado] = useState("");
  const [productoActual, setProductoActual] = useState(null); // Último producto escaneado
  const [stockPorProducto, setStockPorProducto] = useState({}); // Control de stock en tiempo real
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
        if (productoEncontrado.stock > 0) {
          // Guardar el producto actual y su stock en el mapeo
          setProductoActual(productoEncontrado);
          
          // Actualizar o inicializar el stock por producto
          setStockPorProducto(prevStock => ({
            ...prevStock,
            [productoEncontrado.codigoBarras]: productoEncontrado.stock
          }));
          
          agregarAlCarrito(productoEncontrado);
        } else {
          console.warn("⚠️ Producto agotado.");
          Swal.fire({
            title: "Stock insuficiente",
            text: "No hay suficiente stock disponible para este producto.",
            icon: "error",
            confirmButtonText: "Aceptar",
          });
        }
      } else {
        setProductoActual(null);
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
      setProductoActual(null);
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
    if (productoActual) {
      const stockDisponible = stockPorProducto[productoActual.codigoBarras] || 0;
      if (cantidad < stockDisponible) {
        setCantidad(cantidad + 1);
      }
    }
  }, [cantidad, productoActual, stockPorProducto]);

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

    const stockDisponible = stockPorProducto[producto.codigoBarras] || producto.stock;
    
    if (stockDisponible < cantidad) {
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

    // Actualizar el stock del producto en tiempo real
    setStockPorProducto(prevStock => ({
      ...prevStock,
      [producto.codigoBarras]: (prevStock[producto.codigoBarras] || producto.stock) - cantidad
    }));

    setCodigoEscaneado("");
    setCantidad(1);
  };

  const eliminarDelCarrito = (index) => {
    const productoEliminado = carrito[index];
    const nuevoCarrito = carrito.filter((_, i) => i !== index);

    setCarrito(nuevoCarrito);

    // Restaurar el stock del producto eliminado
    setStockPorProducto(prevStock => ({
      ...prevStock,
      [productoEliminado.codigoBarras]: (prevStock[productoEliminado.codigoBarras] || 0) + productoEliminado.cantidad
    }));

    // Si el carrito está vacío, restablecer el estado o recargar la página
    if (nuevoCarrito.length === 0) {
      resetState(); // Restablecer el estado del componente
    }
  };

  const incrementarCantidadCarrito = (index) => {
    const productoEnCarrito = carrito[index];
    const stockDisponible = stockPorProducto[productoEnCarrito.codigoBarras] || 0;
    
    if (stockDisponible > 0) {
      // Actualizar el carrito
      setCarrito(
        carrito.map((p, i) =>
          i === index ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
      
      // Actualizar el stock del producto específico
      setStockPorProducto(prevStock => ({
        ...prevStock,
        [productoEnCarrito.codigoBarras]: prevStock[productoEnCarrito.codigoBarras] - 1
      }));
    }
  };

  const disminuirCantidadCarrito = (index) => {
    const productoEnCarrito = carrito[index];
    if (productoEnCarrito.cantidad > 1) {
      // Actualizar el carrito
      setCarrito(
        carrito.map((p, i) =>
          i === index ? { ...p, cantidad: p.cantidad - 1 } : p
        )
      );
      
      // Actualizar el stock del producto específico
      setStockPorProducto(prevStock => ({
        ...prevStock,
        [productoEnCarrito.codigoBarras]: prevStock[productoEnCarrito.codigoBarras] + 1
      }));
    }
  };

  const resetState = () => {
    setCodigoEscaneado("");
    setProductoActual(null);
    setCantidad(1);
    setCarrito([]);
    setStockPorProducto({});
    setLoading(false);
    setError(null);
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      Swal.fire({
        title: "Carrito vacío",
        text: "Agrega productos antes de finalizar la venta.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return Promise.reject("Carrito vacío");
    }
  
    const total = carrito.reduce((acc, p) => acc + p.precioVenta * p.cantidad, 0);
    const montoEntregado = parseFloat(document.getElementById("montoEntregado").value);
  
    if (montoEntregado < total) {
      Swal.fire({
        title: "Monto insuficiente",
        text: "El monto entregado es menor que el total. Por favor, ingrese un monto mayor.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return Promise.reject("Monto insuficiente");
    }
  
    setLoading(true);
    setError(null);
    try {
      // First register the sale and update stock
      await actualizarStockVenta(carrito);
      await registrarVenta(carrito);
  
      // Show success message
      Swal.fire({
        title: "Venta realizada",
        text: "Los productos han sido vendidos con éxito y el stock ha sido actualizado.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });
  
      // Reset the state
      resetState();
      return Promise.resolve(); // Retornar promesa resuelta
    } catch (error) {
      console.error("❌ Error al registrar la venta:", error);
      setError("Hubo un problema al actualizar el stock y registrar la venta en la base de datos.");
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al registrar la venta en la base de datos.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
      return Promise.reject(error); // Retornar promesa rechazada
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
          producto={productoActual}
          stockActual={productoActual ? stockPorProducto[productoActual.codigoBarras] || 0 : 0}
          cantidad={cantidad}
          disminuirCantidad={disminuirCantidad}
          incrementarCantidad={incrementarCantidad}
          agregarAlCarrito={() => productoActual && agregarAlCarrito(productoActual)}
        />
        <Cart
          carrito={carrito}
          stockPorProducto={stockPorProducto}
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

const ProductInfo = React.memo(({ producto, stockActual, cantidad, disminuirCantidad, incrementarCantidad, agregarAlCarrito }) => (
  <div className="scanner-section">
    <h2>Escanear Producto</h2>
    {producto && (
      <div className="product-info">
        <img src={producto.image} alt={producto.nombre} className="product-image" />
        <h3>{producto.nombre}</h3>
        <p>Marca: {producto.marca}</p>
        <p>Categoría: {producto.categoria}</p>
        <p className="product-price">Precio: ${producto.precioVenta}</p>
        <p className="product-price">Precio de compra: ${producto.precioCompra}</p>
        <p>Stock restante: {stockActual}</p>
        <p>Fecha de Vencimiento: {new Date(producto.fechaVencimiento).toLocaleDateString()}</p>
      </div>
    )}
  </div>
));

const Cart = React.memo(({ carrito, stockPorProducto, eliminarDelCarrito, incrementarCantidadCarrito, disminuirCantidadCarrito, finalizarVenta }) => {
  const [montoEntregado, setMontoEntregado] = useState("");
  const [errorMonto, setErrorMonto] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // Estado para controlar procesamiento

  // Calcular el total de la compra
  const total = carrito.reduce((acc, p) => acc + p.precioVenta * p.cantidad, 0);

  // Calcular el vuelto
  const vuelto = montoEntregado ? parseFloat(montoEntregado) - total : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (montoEntregado && parseFloat(montoEntregado) < total) {
        setErrorMonto("El monto entregado es menor que el total. Por favor, ingrese un monto mayor.");
      } else {
        setErrorMonto("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [montoEntregado, total]);

  // Función que maneja el procesamiento de venta con bloqueo
  const handleFinalizarVenta = async () => {
    if (isProcessing) return; // Evitar múltiples clics
    
    setIsProcessing(true); // Activar bloqueo
    
    try {
      await finalizarVenta();
    } finally {
      // Agregar un retraso antes de permitir otra venta
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500); // 1.5 segundos de espera
    }
  };

  return (
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
          <p className="total-price">Total: ${total}</p>

          {/* Campo para ingresar el monto entregado */}
          <div className="payment-section">
            <label htmlFor="montoEntregado">Efectivo entregado:</label>
            <input
              type="number"
              id="montoEntregado"
              value={montoEntregado}
              onChange={(e) => setMontoEntregado(e.target.value)}
              min={total}
              placeholder="Ingrese el monto"
              disabled={isProcessing}
            />
            {errorMonto && <p className="error-text">{errorMonto}</p>}
          </div>
          
          {montoEntregado && vuelto >= 0 && (
            <p className="vuelto">Vuelto: ${vuelto}</p>
          )}

          <button 
            className="checkout-button" 
            onClick={handleFinalizarVenta} 
            aria-label="Aceptar venta"
            disabled={isProcessing} // Deshabilitar botón durante procesamiento
            style={{ 
              opacity: isProcessing ? 0.7 : 1,
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? 'Procesando...' : 'Aceptar Venta'}
          </button>
        </>
      )}
    </div>
  );
});

export default ProductScanner;