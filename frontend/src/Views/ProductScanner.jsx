import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { scanProducts, actualizarStockVenta } from "../services/AddProducts.service.js";
import { registrarVenta } from "../services/venta.service.js";
import { showSuccessAlert, showErrorAlert, showWarningAlert, showProductNotFoundAlert } from "../helpers/swaHelper";
import "../styles/ProductScannerStyles.css";
import ProductScannerSkeleton from '../components/ProductScannerSkeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrash, faShoppingCart, faBarcode, faMoneyBillAlt, faCheck, faSearch, faExclamationTriangle, faStore, faCreditCard } from '@fortawesome/free-solid-svg-icons';

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
  const [metodoPago, setMetodoPago] = useState("efectivo");
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
          
          // Agregar automáticamente al carrito con cantidad 1
          agregarAlCarrito({...productoEncontrado, cantidad: 1});
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
    setMontoEntregado(""); 
    setErrorMonto("");
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      showWarningAlert("Carrito vacío", "Agrega productos antes de finalizar la venta.");
      return Promise.reject("Carrito vacío");
    }
  
    if (metodoPago === "efectivo" && (!montoEntregado || parseFloat(montoEntregado) < total)) {
      showErrorAlert("Monto insuficiente", "El monto entregado es menor que el total. Por favor, ingrese un monto mayor.");
      return Promise.reject("Monto insuficiente");
    }
  
    setLoading(true);
    setError(null);
    try {
      await actualizarStockVenta(carrito);
      await registrarVenta(carrito, metodoPago);
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
    
    setIsProcessing(true);
    
    try {
      document.getElementById('root').setAttribute('inert', '');
      await finalizarVenta();
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        document.getElementById('root').removeAttribute('inert');
      }, 1500);
    }
  };

  return (
    <div className="productscanner-container">
      <Navbar />
      <div className="productscanner-content-container">
        {loading ? (
          <ProductScannerSkeleton />
        ) : (
          <div className="productscanner-new-scanner-layout">
            <h1 className="productscanner-title">Terminal Punto de Venta</h1>
            
            <div className="productscanner-search-bar-container">
              <form onSubmit={handleScan} className="productscanner-search-form">
                <div className="productscanner-search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Escanee o ingrese código de barras"
                    value={codigoEscaneado}
                    onChange={(e) => setCodigoEscaneado(e.target.value)}
                    className="productscanner-search-input"
                    autoFocus
                  />
                  <button type="submit" className="productscanner-search-button">
                    <FontAwesomeIcon icon={faSearch} /> Buscar
                  </button>
                </div>
              </form>
            </div>
            
            <div className="productscanner-tpv-main-container">
              <div className="productscanner-product-panel">
                <h2>Producto Escaneado</h2>
                {productoActual ? (
                  <div className="productscanner-product-info-container">
                    {productoActual.image && (
                      <img 
                        src={productoActual.image} 
                        alt={productoActual.nombre} 
                        className="productscanner-product-image" 
                      />
                    )}
                    <p><strong>Nombre:</strong> {productoActual.nombre}</p>
                    <p><strong>Marca:</strong> {productoActual.marca}</p>
                    <p><strong>Categoría:</strong> {productoActual.categoria}</p>
                    <p><strong>Código:</strong> {productoActual.codigoBarras}</p>
                    <p className="productscanner-product-price">${productoActual.precioVenta}</p>
                    <p><strong>Stock:</strong> <span className={stockPorProducto[productoActual.codigoBarras] < 5 ? "productscanner-low-stock" : ""}>
                      {stockPorProducto[productoActual.codigoBarras] || 0} unidades
                    </span></p>
                    
                    <div className="productscanner-quantity-controls">
                      <button 
                        onClick={disminuirCantidad} 
                        disabled={cantidad <= 1}
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span>{cantidad}</span>
                      <button 
                        onClick={incrementarCantidad}
                        disabled={!stockPorProducto[productoActual.codigoBarras] || cantidad >= stockPorProducto[productoActual.codigoBarras]}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                    
                    <button 
                      className="productscanner-add-to-cart-button"
                      onClick={() => agregarAlCarrito(productoActual)}
                      disabled={!stockPorProducto[productoActual.codigoBarras]}
                    >
                      <FontAwesomeIcon icon={faShoppingCart} /> Agregar al carrito
                    </button>
                  </div>
                ) : (
                  <div className="productscanner-empty-product-container">
                    <div className="productscanner-barcode-placeholder">
                      <FontAwesomeIcon icon={faBarcode} size="3x" />
                      <p>Escanee un código de barras para mostrar información del producto</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="productscanner-cart-panel">
                <h2><FontAwesomeIcon icon={faShoppingCart} /> Carrito de Compra</h2>
                
                {carrito.length === 0 ? (
                  <div className="productscanner-empty-cart">
                    <FontAwesomeIcon icon={faShoppingCart} size="3x" className="productscanner-empty-cart-icon" />
                    <p>No hay productos en el carrito</p>
                    <p>Escanee un código de barras para agregar productos</p>
                  </div>
                ) : (
                  <>
                    <div className="productscanner-cart-items-list">
                      {carrito.map((producto, index) => (
                        <div key={index} className="productscanner-cart-item">
                          <div className="productscanner-cart-item-info">
                            <h4>{producto.nombre}</h4>
                            <p className="productscanner-cart-item-price">${producto.precioVenta}</p>
                          </div>
                          
                          <div className="productscanner-cart-item-controls">
                            <div className="productscanner-quantity-control">
                              <button 
                                onClick={() => disminuirCantidadCarrito(index)} 
                                disabled={producto.cantidad <= 1}
                              >
                                <FontAwesomeIcon icon={faMinus} />
                              </button>
                              <span>{producto.cantidad}</span>
                              <button 
                                onClick={() => incrementarCantidadCarrito(index)}
                                disabled={!stockPorProducto[producto.codigoBarras]}
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </button>
                            </div>
                            
                            <p className="productscanner-item-subtotal">${(producto.precioVenta * producto.cantidad)}</p>
                            
                            <button 
                              className="productscanner-remove-item-btn"
                              onClick={() => eliminarDelCarrito(index)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="productscanner-checkout-section">
                      <div className="productscanner-cart-summary">
                        <h3>Resumen de Compra</h3>
                        <p className="productscanner-total-price">Total a pagar: <span>${total}</span></p>
                      </div>
                      
                      <div className="productscanner-payment-options">
                        <div className="productscanner-payment-method">
                          <label>Método de pago:</label>
                          <select 
                            value={metodoPago} 
                            onChange={(e) => setMetodoPago(e.target.value)} 
                            className="productscanner-payment-select"
                            disabled={isProcessing}
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta de crédito/débito</option>
                          </select>
                        </div>
                        
                        {metodoPago === "efectivo" && (
                          <div className="productscanner-cash-input">
                            <label>
                              <FontAwesomeIcon icon={faMoneyBillAlt} className="productscanner-payment-icon" />
                              Ingrese el monto recibido:
                            </label>
                            <input
                              type="number"
                              value={montoEntregado}
                              onChange={(e) => setMontoEntregado(e.target.value)}
                              min={total}
                              placeholder="Monto entregado"
                              id="montoEntregado"
                              disabled={isProcessing}
                            />
                            {errorMonto && (
                              <p className="productscanner-error-text">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                {errorMonto}
                              </p>
                            )}
                            {montoEntregado && parseFloat(montoEntregado) >= total && (
                              <div className="productscanner-change-amount">
                                Cambio a devolver: <span>${vuelto.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <button 
                        className="productscanner-finalize-sale-button"
                        onClick={handleFinalizarVenta}
                        disabled={isProcessing || carrito.length === 0 || (metodoPago === "efectivo" && vuelto < 0)}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        {isProcessing ? ' Procesando venta...' : ' Finalizar Venta'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {error && (
              <div className="productscanner-error-message">
                <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductScanner;