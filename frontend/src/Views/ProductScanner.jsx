import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { scanProducts, actualizarStockVenta } from "../services/AddProducts.service.js";
import { registrarVenta } from "../services/venta.service.js";
import { getDeudoresSimple } from "../services/deudores.service.js";
import { addDeudor } from "../services/deudores.service.js";
import { showSuccessAlert, showErrorAlert, showWarningAlert, showProductNotFoundAlert } from "../helpers/swaHelper";
import ProductScannerSkeleton from '../components/Skeleton/ProductScannerSkeleton';
import "../styles/ProductScannerStyles.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrash, faShoppingCart, faBarcode, faMoneyBillAlt, faCheck, faSearch, 
  faExclamationTriangle, faStore, faCreditCard, faUser, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2'; // Agregando la importación de SweetAlert2

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
  const [deudores, setDeudores] = useState([]);
  const [selectedDeudorId, setSelectedDeudorId] = useState("");
  const [isDeudor, setIsDeudor] = useState(false);
  const [loadingDeudores, setLoadingDeudores] = useState(false);
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

  // Cargar la lista de deudores al montar el componente
  useEffect(() => {
    const fetchDeudores = async () => {
      try {
        setLoadingDeudores(true);
        const deudoresData = await getDeudoresSimple();
        setDeudores(deudoresData);
      } catch (error) {
        console.error("Error al cargar los deudores:", error);
        setError("No se pudieron cargar los deudores. " + error.message);
      } finally {
        setLoadingDeudores(false);
      }
    };

    fetchDeudores();
  }, []);

  // Eliminar el reset automático del deudor cuando se selecciona tarjeta
  // Permitir que la opción de deudor esté siempre disponible independientemente del método de pago
  useEffect(() => {
    // Este efecto se mantiene vacío para futuras funcionalidades si son necesarias
    // pero ya no resetea la opción de deudor al cambiar el método de pago
  }, [metodoPago]);

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
          
          // Verificar si el producto está vencido y mostrar advertencia
          if (productoEncontrado.isExpired) {
            showWarningAlert(
              "¡Producto vencido!",
              `El producto ${productoEncontrado.nombre} está vencido (Fecha: ${new Date(productoEncontrado.fechaVencimiento).toLocaleDateString()}). Puede continuar con la venta, pero se recomienda revisar el producto.`,
              null,
              "warning",
              true  // Necesita confirmación
            );
          }
          
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
      
      // Verificar si el error es específicamente por stock insuficiente o no encontrado
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data && error.response.data.message;
        
        if (statusCode === 404) {
          // Producto no encontrado
          showProductNotFoundAlert(codigoEscaneado).then((result) => {
            if (result.isConfirmed) {
              navigate(`/addproduct?barcode=${codigoEscaneado}`);
            }
          });
        } else if (statusCode === 400 && errorMessage && errorMessage.includes("stock")) {
          // Error específico de stock insuficiente
          showErrorAlert("Stock insuficiente", "No hay stock disponible para este producto.");
        } else {
          // Otros errores
          setError("Error al escanear el producto: " + (errorMessage || "Inténtalo de nuevo."));
        }
      } else {
        setError("Error al escanear el producto. Inténtalo de nuevo.");
      }
      
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
  
    // Verificar si es un deudor válido cuando se marca esa opción
    if (isDeudor && !selectedDeudorId) {
      showErrorAlert("Deudor no seleccionado", "Por favor, seleccione un deudor de la lista.");
      return Promise.reject("Deudor no seleccionado");
    }
  
    // Ya no verificamos el monto entregado como condición para finalizar la venta
    // El campo ahora solo sirve como calculadora de vuelto
  
    setLoading(true);
    setError(null);
    try {
      // Realizar la actualización de stock
      const responseStock = await actualizarStockVenta(carrito);
      
      // Verificar si hay productos vencidos vendidos
      if (responseStock.data && responseStock.data.data && responseStock.data.data.productosVencidosVendidos) {
        const productosVencidos = responseStock.data.data.productosVencidosVendidos;
        const nombresProductos = productosVencidos.map(p => p.Nombre).join(", ");
        
        // Mostrar una advertencia pero permitir continuar
        await showWarningAlert(
          "¡Atención! Productos vencidos", 
          `Se han vendido los siguientes productos vencidos: ${nombresProductos}. Se recomienda verificar estos productos.`,
          null,
          "warning",
          true  // Necesita confirmación
        );
      }
      
      // Determinar si se debe enviar un ID de deudor
      const deudorIdToSend = isDeudor && selectedDeudorId ? selectedDeudorId : null;
      
      // Registrar la venta con el deudor seleccionado si corresponde
      const response = await registrarVenta(carrito, metodoPago, deudorIdToSend);
      
      let mensaje = "Los productos han sido vendidos con éxito y el stock ha sido actualizado.";
      
      // Si se asignó a un deudor, incluir esa información en el mensaje
      if (deudorIdToSend && response.data.deudor) {
        const deudorInfo = response.data.deudor;
        mensaje += ` La deuda de ${deudorInfo.nombre} ha sido actualizada a $${deudorInfo.deudaTotal.toLocaleString()}.`;
      }
      
      showSuccessAlert("Venta realizada", mensaje);
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

  // Función para mostrar un pop-up con formulario para crear un nuevo deudor
  const handleCreateDeudor = async () => {
    const fechaActual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    const { value: formValues, dismiss } = await Swal.fire({
      title: 'Crear Nuevo Deudor',
      html: `
        <div class="swal2-input-group">
          <div class="swal2-input-container">
            <label for="nombre" class="swal2-label">Nombre:</label>
            <input id="nombre" class="swal2-input" placeholder="Nombre completo" required>
          </div>
          <div class="swal2-input-container">
            <label for="fechaPaga" class="swal2-label">Fecha a Pagar:</label>
            <input id="fechaPaga" type="date" class="swal2-input" value="${fechaActual}" required>
          </div>
          <div class="swal2-input-container">
            <label for="numeroTelefono" class="swal2-label">Número de Teléfono:</label>
            <input id="numeroTelefono" class="swal2-input" placeholder="Número de teléfono" required>
          </div>
          <div class="swal2-input-container">
            <label for="deudaTotal" class="swal2-label">Deuda Inicial:</label>
            <input id="deudaTotal" type="number" class="swal2-input" value="0" min="0" required>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      customClass: {
        container: 'swal-optimized-container',
        popup: 'swal-optimized-popup'
      },
      preConfirm: () => {
        const nombre = document.getElementById('nombre').value;
        const fechaPaga = document.getElementById('fechaPaga').value;
        const numeroTelefono = document.getElementById('numeroTelefono').value;
        const deudaTotal = parseFloat(document.getElementById('deudaTotal').value) || 0;
        
        // Validaciones básicas
        if (!nombre) {
          Swal.showValidationMessage('Por favor ingrese el nombre');
          return false;
        }
        if (!fechaPaga) {
          Swal.showValidationMessage('Por favor seleccione una fecha');
          return false;
        }
        if (!numeroTelefono || numeroTelefono.length < 9) {
          Swal.showValidationMessage('Por favor ingrese un número de teléfono válido (mínimo 9 dígitos)');
          return false;
        }
        
        return { Nombre: nombre, fechaPaga, numeroTelefono, deudaTotal };
      }
    });
    
    // Si el usuario canceló, no hacemos nada
    if (dismiss === Swal.DismissReason.cancel || !formValues) {
      return;
    }
    
    try {
      setLoading(true);
      // Crear el deudor en la base de datos
      const deudorCreado = await addDeudor(formValues);
      
      // Actualizar la lista de deudores
      const deudoresActualizados = await getDeudoresSimple();
      setDeudores(deudoresActualizados);
      
      // Seleccionar automáticamente el deudor creado
      setSelectedDeudorId(deudorCreado._id);
      
      showSuccessAlert('Deudor creado', 'El deudor ha sido creado y seleccionado correctamente.');
    } catch (error) {
      console.error('Error al crear deudor:', error);
      showErrorAlert('Error', 'No se pudo crear el deudor. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
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
                    {productoActual.isExpired && (
                      <div className="productscanner-expired-badge">VENCIDO</div>
                    )}
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
                    <p className="productscanner-product-price"><strong>Precio de venta:</strong> ${productoActual.precioVenta.toLocaleString('es-ES', {
                      maximumFractionDigits: 0,
                      useGrouping: true
                    }).replace(/,/g, '.')}</p>
                    <p><strong>Stock:</strong> <span className={stockPorProducto[productoActual.codigoBarras] < 5 ? "productscanner-low-stock" : ""}>
                      {stockPorProducto[productoActual.codigoBarras] || 0} unidades
                    </span></p>
                    
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
                <h2>
                  <FontAwesomeIcon icon={faShoppingCart} /> 
                  Carrito de Compra
                  <span className="productscanner-cart-summary-count">
                    {carrito.length} productos • {carrito.reduce((sum, p) => sum + p.cantidad, 0)} unidades
                  </span>
                </h2>
                
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
                            <p className="productscanner-cart-item-price">${producto.precioVenta.toLocaleString('es-ES', {
                              maximumFractionDigits: 0,
                              useGrouping: true
                            }).replace(/,/g, '.')}</p>
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
                            
                            <p className="productscanner-item-subtotal">${(producto.precioVenta * producto.cantidad).toLocaleString('es-ES', {
                              maximumFractionDigits: 0,
                              useGrouping: true
                            }).replace(/,/g, '.')}</p>
                            
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
                        <p className="productscanner-total-price">Total a pagar: <span>${total.toLocaleString('es-ES', {
                          maximumFractionDigits: 0,
                          useGrouping: true
                        }).replace(/,/g, '.')}</span></p>
                      </div>
                      
                      <div className="productscanner-payment-options">
                        <div className="productscanner-deudor-option">
                          <label className="productscanner-checkbox-label">
                            <input
                              type="checkbox"
                              checked={isDeudor}
                              onChange={(e) => {
                                setIsDeudor(e.target.checked);
                                // Si marca como deudor, establecer método de pago a efectivo por defecto
                                if (e.target.checked) {
                                  setMetodoPago("efectivo");
                                }
                              }}
                              disabled={isProcessing || loadingDeudores}
                            />
                            <span>Cliente deudor</span>
                            <FontAwesomeIcon icon={faUser} className="productscanner-deudor-icon" />
                          </label>
                        </div>

                        {isDeudor && (
                          <div className="productscanner-deudor-selector">
                            <label>Seleccionar deudor:</label>
                            {loadingDeudores ? (
                              <div className="productscanner-loading-deudores">Cargando deudores...</div>
                            ) : deudores && deudores.length > 0 ? (
                              <div className="productscanner-deudor-select-container">
                                <select
                                  value={selectedDeudorId}
                                  onChange={(e) => setSelectedDeudorId(e.target.value)}
                                  className="productscanner-deudor-select"
                                  disabled={isProcessing}
                                  required={isDeudor}
                                >
                                  <option value="">Seleccione un deudor</option>
                                  {deudores.map((deudor) => (
                                    <option key={deudor._id} value={deudor._id}>
                                      {deudor.Nombre} - Deuda: ${deudor.deudaTotal.toLocaleString()}
                                    </option>
                                  ))}
                                </select>
                                <button 
                                  onClick={handleCreateDeudor}
                                  className="productscanner-add-deudor-btn"
                                  type="button"
                                >
                                  <FontAwesomeIcon icon={faUserPlus} />
                                </button>
                              </div>
                            ) : (
                              <div className="productscanner-no-deudores">
                                <p>No hay deudores registrados</p>
                                <button 
                                  onClick={handleCreateDeudor}
                                  className="productscanner-add-deudor-btn"
                                  type="button"
                                >
                                  <FontAwesomeIcon icon={faUserPlus} /> Crear deudor
                                </button>
                              </div>
                            )}
                            
                            {isDeudor && selectedDeudorId && (
                              <div className="productscanner-debt-info">
                                <div>Total a añadir a la deuda: <span>${total.toLocaleString('es-ES')}</span></div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mostrar selector de método de pago solo si NO es deudor */}
                        {!isDeudor && (
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
                        )}
                        
                        {metodoPago === "efectivo" && !isDeudor && (
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
                              required
                            />
                            {errorMonto && (
                              <p className="productscanner-error-text">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                {errorMonto}
                              </p>
                            )}
                            {montoEntregado && parseFloat(montoEntregado) >= total && (
                              <div className="productscanner-change-amount">
                                Cambio a devolver: <span>${vuelto.toLocaleString('es-ES', {
                                  maximumFractionDigits: 0,
                                  useGrouping: true
                                }).replace(/,/g, '.')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <button 
                        className="productscanner-finalize-sale-button"
                        onClick={handleFinalizarVenta}
                        disabled={
                          isProcessing || 
                          carrito.length === 0 || 
                          (isDeudor && !selectedDeudorId)
                        }
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