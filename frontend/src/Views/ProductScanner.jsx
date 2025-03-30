import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { scanProducts, actualizarStockVenta, registrarVenta } from "../services/AddProducts.service.js";
import { showSuccessAlert, showErrorAlert, showWarningAlert, showProductNotFoundAlert } from "../helpers/swaHelper";
import "../styles/ProductScannerStyles.css";
import ProductScannerSkeleton from '../components/ProductScannerSkeleton';

const ProductScanner = () => {
  const navigate = useNavigate();
  const [codigoEscaneado, setCodigoEscaneado] = useState("");
  const [productoActual, setProductoActual] = useState(null);
  const [stockPorProducto, setStockPorProducto] = useState({});
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [montoEntregado, setMontoEntregado] = useState("");
  const [errorMonto, setErrorMonto] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const total = carrito.reduce((acc, p) => acc + p.precioVenta * p.cantidad, 0);
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

  const handleScan = async (e) => {
    e.preventDefault();
    if (!codigoEscaneado.trim()) {
      showWarningAlert("Código inválido", "Ingrese un código de barras válido");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await scanProducts(codigoEscaneado);
      const productoEncontrado = response.data.data;

      if (productoEncontrado) {
        if (productoEncontrado.stock > 0) {
          setProductoActual(productoEncontrado);
          setStockPorProducto(prevStock => ({
            ...prevStock,
            [productoEncontrado.codigoBarras]: productoEncontrado.stock
          }));
          
          agregarAlCarrito(productoEncontrado);
        } else {
          console.warn("⚠️ Producto agotado.");
          showErrorAlert("Stock insuficiente", "No hay suficiente stock disponible para este producto.");
        }
      } else {
        setProductoActual(null);
        showProductNotFoundAlert(codigoEscaneado).then((result) => {
          if (result.isConfirmed) {
            // Navigate to add product page with the barcode pre-filled
            navigate(`/addproduct?barcode=${codigoEscaneado}`);
          }
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
      showWarningAlert("Error", "Debes escanear un producto primero");
      return;
    }

    const stockDisponible = stockPorProducto[producto.codigoBarras] || producto.stock;
    
    if (stockDisponible < cantidad) {
      showErrorAlert("Stock insuficiente", "No hay suficiente stock disponible para esta cantidad.");
      return;
    }
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
    setCarrito(nuevoCarrito);
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
    setStockPorProducto(prevStock => ({
      ...prevStock,
      [productoEliminado.codigoBarras]: (prevStock[productoEliminado.codigoBarras] || 0) + productoEliminado.cantidad
    }));
    if (nuevoCarrito.length === 0) {
      resetState();
    }
  };

  const incrementarCantidadCarrito = (index) => {
    const productoEnCarrito = carrito[index];
    const stockDisponible = stockPorProducto[productoEnCarrito.codigoBarras] || 0;
    
    if (stockDisponible > 0) {
      setCarrito(
        carrito.map((p, i) =>
          i === index ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
      setStockPorProducto(prevStock => ({
        ...prevStock,
        [productoEnCarrito.codigoBarras]: prevStock[productoEnCarrito.codigoBarras] - 1
      }));
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
      showWarningAlert("Carrito vacío", "Agrega productos antes de finalizar la venta.");
      return Promise.reject("Carrito vacío");
    }
  
    const total = carrito.reduce((acc, p) => acc + p.precioVenta * p.cantidad, 0);
    const montoEntregado = parseFloat(document.getElementById("montoEntregado").value);
  
    if (montoEntregado < total) {
      showErrorAlert("Monto insuficiente", "El monto entregado es menor que el total. Por favor, ingrese un monto mayor.");
      return Promise.reject("Monto insuficiente");
    }
  
    setLoading(true);
    setError(null);
    try {
      await actualizarStockVenta(carrito);
      await registrarVenta(carrito);
      showSuccessAlert("Venta realizada", "Los productos han sido vendidos con éxito y el stock ha sido actualizado.");
      resetState();
      return Promise.resolve();
    } catch (error) {
      console.error("❌ Error al registrar la venta:", error);
      setError("Hubo un problema al actualizar el stock y registrar la venta en la base de datos.");
      showErrorAlert("Error", "Hubo un problema al registrar la venta en la base de datos.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarVenta = async () => {
    if (isProcessing) 
      return;
    
    // Guardar el foco actual antes de procesar
    const activeElement = document.activeElement;
    document.activeElement.blur();
    
    setIsProcessing(true);
    
    try {
      await finalizarVenta();
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        if (activeElement && document.contains(activeElement)) {
          activeElement.focus();
        }
      }, 1500);
    }
  };

  return (
    <div className="scanner-container">
      <Navbar />
      {loading ? (
        <ProductScannerSkeleton />
      ) : (
        <>
          <SearchBar
            codigoEscaneado={codigoEscaneado}
            setCodigoEscaneado={setCodigoEscaneado}
            handleScan={handleScan}
          />
          <div className="scanner-content">
            <Cart 
              carrito={carrito}
              stockPorProducto={stockPorProducto}
              eliminarDelCarrito={eliminarDelCarrito}
              incrementarCantidadCarrito={incrementarCantidadCarrito}
              disminuirCantidadCarrito={disminuirCantidadCarrito}
              finalizarVenta={finalizarVenta}
            />
            <div className="sidebar-panel">
              {productoActual && (
                <div className="current-product-info">
                  <h3>Producto Escaneado</h3>
                  <div className="scanned-product-details">
                    <h4>{productoActual.nombre}</h4>
                    <p>Marca: <strong>{productoActual.marca}</strong></p>
                    <p>Categoría: <strong>{productoActual.categoria}</strong></p>
                    <p className="scanned-price">Precio: <strong>${productoActual.precioVenta}</strong></p>
                    <p>Stock disponible: <strong>{stockPorProducto[productoActual.codigoBarras] || 0}</strong></p>
                    <button 
                      className="add-to-cart-button"
                      onClick={() => productoActual && agregarAlCarrito(productoActual)}
                    >
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              )}
              
              {/* Nueva sección de pago en el sidebar */}
              <div className="sidebar-payment-section">
                <h3>Detalles de Pago</h3>
                <div className="payment-section">
                  <label htmlFor="montoEntregado">
                    <span className="payment-icon">💵</span> Efectivo entregado:
                  </label>
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
                  
                  {montoEntregado && vuelto >= 0 && (
                    <p className="vuelto">Vuelto: <span>${vuelto}</span></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SearchBar = React.memo(({ codigoEscaneado, setCodigoEscaneado, handleScan }) => (
  <div className="search-bar">
    <input
      type="text"
      placeholder="Escanee código de barras"
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
  const [isProcessing, setIsProcessing] = useState(false);
  const total = carrito.reduce((acc, p) => acc + p.precioVenta * p.cantidad, 0);
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
  const handleFinalizarVenta = async () => {
    if (isProcessing) 
      return;
    
    // Guardar el foco actual antes de procesar
    const activeElement = document.activeElement;
    document.activeElement.blur();
    
    setIsProcessing(true);
    
    try {
      await finalizarVenta();
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        if (activeElement && document.contains(activeElement)) {
          activeElement.focus();
        }
      }, 1500);
    }
  };

  return (
    <div className="cart-section">
      <h2>Carrito de Compras</h2>
      {carrito.length === 0 ? (
        <div className="empty-cart">
          <p>No hay productos en el carrito</p>
          <span className="empty-cart-icon">🛒</span>
        </div>
      ) : (
        <>
          <div className="cart-items-container">
            {carrito.map((producto, index) => (
              <div key={index} className="cart-item-card">
                <div className="cart-item-details">
                  <h4>{producto.nombre}</h4>
                  <p className="cart-item-marca">{producto.marca}</p>
                  <p className="cart-item-price">
                    Precio: <span>${producto.precioVenta}</span>
                  </p>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-quantity-controls">
                    <button 
                      onClick={() => disminuirCantidadCarrito(index)} 
                      className="quantity-btn"
                      disabled={producto.cantidad <= 1}
                    >−</button>
                    <span className="quantity-display">{producto.cantidad}</span>
                    <button 
                      onClick={() => incrementarCantidadCarrito(index)}
                      className="quantity-btn"
                      disabled={!stockPorProducto[producto.codigoBarras]}
                    >+</button>
                  </div>
                  <p className="cart-item-total">
                    Subtotal: <span>${(producto.precioVenta * producto.cantidad)}</span>
                  </p>
                  <button 
                    className="delete-product-btn" 
                    onClick={() => eliminarDelCarrito(index)}
                    title="Eliminar producto"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="cart-totals">
              <h3>Resumen</h3>
              <p className="total-price">Total a pagar: <span>${total}</span></p>
            </div>            
            <button 
              className="checkout-button" 
              onClick={handleFinalizarVenta} 
              aria-label="Aceptar venta"
              disabled={isProcessing}
              style={{ 
                opacity: isProcessing ? 0.7 : 1,
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? 'Procesando...' : 'Finalizar Venta'}
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default ProductScanner;