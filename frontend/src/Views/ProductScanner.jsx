import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { scanProducts, actualizarStockVenta, addProducts } from "../services/AddProducts.service.js";
import { registrarVenta } from "../services/venta.service.js";
import { getDeudoresSimple } from "../services/deudores.service.js";
import { addDeudor } from "../services/deudores.service.js";
import { showSuccessAlert, showErrorAlert, showWarningAlert, showProductNotFoundAlert, showOutOfStockAlert } from "../helpers/swaHelper";
import ProductScannerSkeleton from '../components/Skeleton/ProductScannerSkeleton';
import "../styles/ProductScannerStyles.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrash, faShoppingCart, faBarcode, faMoneyBillAlt, faCheck, faSearch, 
  faExclamationTriangle, faStore, faCreditCard, faUser, faUserPlus, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
// 🆕 Importar categorías de productos
import { CATEGORIAS } from '../constants/products.constants.js';

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
  // 🆕 Estados para modal de creación rápida de producto
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    nombre: '',
    marca: '',
    categoria: '',
    stock: '',
    precioCompra: '',
    precioVenta: '',
    fechaVencimiento: '',
    codigoBarras: ''
  });
  const [creatingProduct, setCreatingProduct] = useState(false);
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
        // Verificar si el producto ya existe en el carrito
        const productoEnCarrito = carrito.find((p) => p.codigoBarras === productoEncontrado.codigoBarras);
        
        // Calcular stock disponible real considerando lo que ya está en el carrito
        let stockDisponibleReal;
        if (productoEnCarrito) {
          // Si ya está en el carrito, usar el stock que ya tenemos guardado
          stockDisponibleReal = stockPorProducto[productoEncontrado.codigoBarras] || 0;
        } else {
          // Si no está en el carrito, usar el stock completo del producto
          stockDisponibleReal = productoEncontrado.stock;
          // Actualizar el stock en nuestro estado local
          setStockPorProducto(prevStock => ({
            ...prevStock,
            [productoEncontrado.codigoBarras]: productoEncontrado.stock
          }));
        }

        if (stockDisponibleReal > 0) {
          setProductoActual(productoEncontrado);
          
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
          agregarAlCarrito({...productoEncontrado}, 1);
        } else {
          console.warn("⚠️ Producto agotado.");
          showErrorAlert("Stock insuficiente", "No hay suficiente stock disponible para este producto.");
        }
      } else {
        setProductoActual(null);
        // 🆕 CAMBIO: Mostrar modal para crear producto en lugar de redirigir
        setNewProductData({
          nombre: '',
          marca: '',
          categoria: '',
          stock: '',
          precioCompra: '',
          precioVenta: '',
          fechaVencimiento: '',
          codigoBarras: codigoEscaneado // Pre-llenar con el código escaneado
        });
        setShowCreateProductModal(true);
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
          // 🆕 CAMBIO: Mostrar alerta primero, luego modal si confirma
          showProductNotFoundAlert(codigoEscaneado).then((result) => {
            if (result.isConfirmed) {
              // Usuario confirmó que quiere crear el producto, abrir modal
              setNewProductData({
                nombre: '',
                marca: '',
                categoria: '',
                stock: '',
                precioCompra: '',
                precioVenta: '',
                fechaVencimiento: '',
                codigoBarras: codigoEscaneado // Pre-llenar con el código escaneado
              });
              setShowCreateProductModal(true);
            }
          });
        } else if (statusCode === 400 && errorMessage && errorMessage.includes("stock")) {
          // Error específico de stock insuficiente - necesitamos obtener el nombre del producto
          // Primero intentamos obtener la información del producto para mostrar su nombre
          try {
            const productResponse = await fetch(`/api/products/creation/${codigoEscaneado}`);
            if (productResponse.ok) {
              const productData = await productResponse.json();
              const productName = productData.data?.nombre || `código ${codigoEscaneado}`;
              
              showOutOfStockAlert(codigoEscaneado, productName).then((result) => {
                if (result.isConfirmed) {
                  // Navigate to add product page with the barcode pre-filled for stock addition
                  navigate(`/add-product?barcode=${codigoEscaneado}`);
                }
              });
            } else {
              // Si no podemos obtener el nombre, usar el código de barras
              showOutOfStockAlert(codigoEscaneado, `código ${codigoEscaneado}`).then((result) => {
                if (result.isConfirmed) {
                  navigate(`/add-product?barcode=${codigoEscaneado}`);
                }
              });
            }
          } catch (fetchError) {
            // Si hay error al obtener el producto, usar mensaje genérico
            showOutOfStockAlert(codigoEscaneado, `código ${codigoEscaneado}`).then((result) => {
              if (result.isConfirmed) {
                navigate(`/add-product?barcode=${codigoEscaneado}`);
              }
            });
          }
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

  const agregarAlCarrito = (producto, cantidadPersonalizada = null) => {
    if (!producto) {
      showWarningAlert("Error", "Debes escanear un producto primero");
      return;
    }

    // Verificar si el producto ya existe en el carrito
    const productoEnCarrito = carrito.find((p) => p.codigoBarras === producto.codigoBarras);
    
    // Calcular stock disponible considerando lo que ya está en el carrito
    // Si no existe en stockPorProducto, usar el stock del producto escaneado
    const stockDisponible = stockPorProducto[producto.codigoBarras] !== undefined 
      ? stockPorProducto[producto.codigoBarras] 
      : producto.stock || 0;
    
    // Usar la cantidad personalizada si se proporciona, sino usar la cantidad del estado
    const cantidadAUsar = cantidadPersonalizada || cantidad;
    
    if (stockDisponible < cantidadAUsar) {
      showErrorAlert("Stock insuficiente", "No hay suficiente stock disponible para esta cantidad.");
      return;
    }

    let nuevoCarrito;
    if (productoEnCarrito) {
      nuevoCarrito = carrito.map((p) =>
        p.codigoBarras === producto.codigoBarras
          ? { ...p, cantidad: p.cantidad + cantidadAUsar }
          : p
      );
    } else {
      nuevoCarrito = [
        ...carrito,
        {
          ...producto,
          cantidad: cantidadAUsar,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra
        }
      ];
    }
    
    setCarrito(nuevoCarrito);
    
    // Actualizar el stock disponible restando la cantidad agregada
    // Si es la primera vez que agregamos este producto, inicializar con su stock real
    setStockPorProducto(prevStock => ({
      ...prevStock,
      [producto.codigoBarras]: stockDisponible - cantidadAUsar
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
    // Resetear estados relacionados con deudores
    setIsDeudor(false);
    setSelectedDeudorId("");
    setMetodoPago("efectivo"); // Resetear método de pago a efectivo por defecto
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
  
    setLoading(true);
    setError(null);
    try {
      // Determinar si se debe enviar un ID de deudor
      const deudorIdToSend = isDeudor && selectedDeudorId ? selectedDeudorId : null;
      
      // 🆕 SIMPLIFICADO: Solo registrar la venta (que ahora incluye automáticamente la actualización del stock)
      const response = await registrarVenta(carrito, metodoPago, deudorIdToSend);
      
      // Verificar si hay productos vencidos vendidos en la respuesta
      if (response.data && response.data.productosVencidosVendidos) {
        const productosVencidos = response.data.productosVencidosVendidos;
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
      
      let mensaje = "Los productos han sido vendidos con éxito y el stock ha sido actualizado.";
      
      // Si se asignó a un deudor, incluir esa información en el mensaje
      if (deudorIdToSend && response.data.deudor) {
        const deudorInfo = response.data.deudor;
        mensaje += ` La deuda de ${deudorInfo.nombre} ha sido actualizada a $${formatNumberWithDots(deudorInfo.deudaTotal)}.`;
      }
      
      showSuccessAlert("Venta realizada", mensaje);
      resetState();
      return Promise.resolve();
    } catch (error) {
      console.error("❌ Error al registrar la venta:", error);
      setError("Hubo un problema al registrar la venta en la base de datos.");
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

  // Función helper para formatear números con punto como separador de miles
  const formatNumberWithDots = (number) => {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // 🆕 Función para manejar la creación rápida de productos
  const handleCreateProduct = async () => {
    // Validar datos del nuevo producto
    const { nombre, marca, categoria, stock, precioCompra, precioVenta, fechaVencimiento, codigoBarras } = newProductData;
    
    if (!nombre || !marca || !categoria || !codigoBarras) {
      return showWarningAlert("Faltan datos", "Por favor, complete todos los campos obligatorios.");
    }
    
    // Confirmar creación del producto
    const result = await Swal.fire({
      title: 'Confirmar creación de producto',
      text: `¿Desea crear el producto "${nombre}" con los siguientes datos?\n\n` + 
            `Marca: ${marca}\n` +
            `Categoría: ${categoria}\n` +
            `Código de barras: ${codigoBarras}\n` +
            `Stock: ${stock}\n` +
            `Precio de compra: $${precioCompra}\n` +
            `Precio de venta: $${precioVenta}\n` +
            `Fecha de vencimiento: ${fechaVencimiento ? new Date(fechaVencimiento).toLocaleDateString() : 'N/A'}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear producto',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      customClass: {
        container: 'swal-optimized-container',
        popup: 'swal-optimized-popup'
      }
    });
    
    if (!result.isConfirmed) {
      return;
    }
    
    setCreatingProduct(true);
    
    try {
      // 🔧 CAMBIO: Usar FormData con el formato correcto del servicio addProducts
      const formData = new FormData();
      formData.append('addproducts-nombre', nombre);
      formData.append('addproducts-marca', marca);
      formData.append('addproducts-categoria', categoria);
      formData.append('addproducts-codigo-barras', codigoBarras);
      formData.append('addproducts-stock', parseInt(stock) || 0);
      formData.append('addproducts-precio-compra', parseFloat(precioCompra) || 0);
      formData.append('addproducts-precio-venta', parseFloat(precioVenta) || 0);
      
      if (fechaVencimiento) {
        formData.append('addproducts-fecha-vencimiento', fechaVencimiento);
      }
      
      // 🔧 CORRECCIÓN: Usar el servicio addProducts en lugar de fetch directo
      await addProducts(formData);
      
      showSuccessAlert('Producto creado', 'El producto ha sido creado exitosamente y ya puede ser escaneado.');
      
      // Limpiar datos del nuevo producto y cerrar modal
      setNewProductData({
        nombre: '',
        marca: '',
        categoria: '',
        stock: '',
        precioCompra: '',
        precioVenta: '',
        fechaVencimiento: '',
        codigoBarras: ''
      });
      setShowCreateProductModal(false);
      
      // Opcional: Intentar escanear automáticamente el producto recién creado
      if (codigoBarras) {
        setTimeout(() => {
          setCodigoEscaneado(codigoBarras);
          // Simular el envío del formulario de escaneo
          const scanEvent = { preventDefault: () => {} };
          handleScan(scanEvent);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error al crear producto:', error);
      showErrorAlert('Error', 'No se pudo crear el producto. Por favor, intente nuevamente.');
    } finally {
      setCreatingProduct(false);
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
                    <p className="productscanner-product-price"><strong>Precio de venta:</strong> ${formatNumberWithDots(productoActual.precioVenta)}</p>
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
                            <p className="productscanner-cart-item-price">${formatNumberWithDots(producto.precioVenta)}</p>
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
                            
                            <p className="productscanner-item-subtotal">${formatNumberWithDots(producto.precioVenta * producto.cantidad)}</p>
                            
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
                        <p className="productscanner-total-price">Total a pagar: <span>${formatNumberWithDots(total)}</span></p>
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
                                      {deudor.Nombre} - Deuda: ${formatNumberWithDots(deudor.deudaTotal)}
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
                                <div>Total a añadir a la deuda: <span>${formatNumberWithDots(total)}</span></div>
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
                                Cambio a devolver: <span>${formatNumberWithDots(vuelto)}</span>
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
      
      {/* 🆕 Modal para creación rápida de productos */}
      {showCreateProductModal && (
        <div className="productscanner-create-product-modal">
          <div className="productscanner-modal-content">
            <h2>Crear Producto Rápido</h2>
            
            <div className="productscanner-modal-body">
              <div className="productscanner-modal-field">
                <label>Nombre <span className="required-field">*</span>:</label>
                <input
                  type="text"
                  value={newProductData.nombre}
                  onChange={(e) => setNewProductData({ ...newProductData, nombre: e.target.value })}
                  disabled={creatingProduct}
                />
              </div>
              
              <div className="productscanner-modal-field">
                <label>Marca <span className="required-field">*</span>:</label>
                <input
                  type="text"
                  value={newProductData.marca}
                  onChange={(e) => setNewProductData({ ...newProductData, marca: e.target.value })}
                  disabled={creatingProduct}
                />
              </div>
              
              <div className="productscanner-modal-field">
                <label>Categoría <span className="required-field">*</span>:</label>
                <select
                  value={newProductData.categoria}
                  onChange={(e) => setNewProductData({ ...newProductData, categoria: e.target.value })}
                  disabled={creatingProduct}
                  className="productscanner-category-select"
                >
                  <option value="">Seleccione una categoría</option>
                  {CATEGORIAS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="productscanner-modal-field">
                <label>Código de barras <span className="required-field">*</span>:</label>
                <input
                  type="text"
                  value={newProductData.codigoBarras}
                  onChange={(e) => setNewProductData({ ...newProductData, codigoBarras: e.target.value })}
                  disabled={creatingProduct}
                />
              </div>
              
              <div className="productscanner-modal-field">
                <label>Stock:</label>
                <input
                  type="number"
                  value={newProductData.stock}
                  onChange={(e) => setNewProductData({ ...newProductData, stock: e.target.value })}
                  disabled={creatingProduct}
                />
              </div>
              
              <div className="productscanner-modal-field">
                <label>Precio de compra:</label>
                <input
                  type="number"
                  value={newProductData.precioCompra}
                  onChange={(e) => setNewProductData({ ...newProductData, precioCompra: e.target.value })}
                  disabled={creatingProduct}
                />
              </div>
              
              <div className="productscanner-modal-field">
                <label>Precio de venta:</label>
                <input
                  type="number"
                  value={newProductData.precioVenta}
                  onChange={(e) => setNewProductData({ ...newProductData, precioVenta: e.target.value })}
                  disabled={creatingProduct}
                />
              </div>
              
              <div className="productscanner-modal-field">
                <label>Fecha de vencimiento:</label>
                <input
                  type="date"
                  value={newProductData.fechaVencimiento}
                  onChange={(e) => setNewProductData({ ...newProductData, fechaVencimiento: e.target.value })}
                  disabled={creatingProduct}
                />
              </div>
            </div>
            
            <div className="productscanner-modal-actions">
              <button 
                className="productscanner-modal-save-btn"
                onClick={handleCreateProduct}
                disabled={creatingProduct}
              >
                {creatingProduct ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    Guardar Producto
                  </>
                )}
              </button>
              
              <button 
                className="productscanner-modal-cancel-btn"
                onClick={() => setShowCreateProductModal(false)}
                disabled={creatingProduct}
              >
                <FontAwesomeIcon icon={faTimes} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductScanner;