import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSearch, 
  faCheckCircle, 
  faTimesCircle, 
  faClipboardList,
  faFilter,
  faCheck,
  faExclamationTriangle,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { getProducts } from '../services/AddProducts.service';
import { showSuccessAlert, showErrorAlert } from '../helpers/swaHelper';
import SmartPagination from './SmartPagination';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/StockControlModal.css';

const StockControlModal = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatus, setStockStatus] = useState({}); // { productId: 'correct' | 'incorrect' | null }
  const [stockComments, setStockComments] = useState({}); // { productId: 'comment' }
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentCommentProduct, setCurrentCommentProduct] = useState(null);
  const [tempComment, setTempComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyChecked, setShowOnlyChecked] = useState(false);
  
  const productsPerPage = 15;

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts(1, Number.MAX_SAFE_INTEGER);
      const productsArray = Array.isArray(response.products) ? response.products : response.data.products;
      setProducts(productsArray);
    } catch (error) {
      console.error('Error fetching products:', error);
      showErrorAlert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.Nombre.toLowerCase().includes(query) ||
        product.codigoBarras?.toLowerCase().includes(query) ||
        product.Marca?.toLowerCase().includes(query)
      );
    }

    // Filtro por categoría
    if (categoryFilter && categoryFilter !== 'Todos') {
      filtered = filtered.filter(product => product.Categoria === categoryFilter);
    }

    // Filtro por productos verificados
    if (showOnlyChecked) {
      filtered = filtered.filter(product => stockStatus[product._id]);
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, stockStatus, showOnlyChecked]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const displayedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage]);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.Categoria))];
    return uniqueCategories.sort();
  }, [products]);

  const handleStockVerification = (productId, status) => {
    const currentStatus = stockStatus[productId];
    
    // Si el producto ya tiene el mismo estado, lo desmarcamos
    if (currentStatus === status) {
      setStockStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[productId];
        return newStatus;
      });
      
      // Si era incorrecto y tenía comentario, también lo eliminamos
      if (status === 'incorrect' && stockComments[productId]) {
        setStockComments(prev => {
          const newComments = { ...prev };
          delete newComments[productId];
          return newComments;
        });
      }
      return;
    }
    
    // Si es incorrecto y no estaba marcado como incorrecto, abrir modal de comentario
    if (status === 'incorrect') {
      setCurrentCommentProduct(productId);
      setTempComment(stockComments[productId] || '');
      setShowCommentModal(true);
    } else {
      // Para productos correctos, marcar directamente
      setStockStatus(prev => ({
        ...prev,
        [productId]: status
      }));
      
      // Limpiar comentario si existía cuando se marca como correcto
      if (stockComments[productId]) {
        setStockComments(prev => {
          const newComments = { ...prev };
          delete newComments[productId];
          return newComments;
        });
      }
    }
  };

  const handleCommentSubmit = () => {
    if (currentCommentProduct) {
      // Marcar como incorrecto
      setStockStatus(prev => ({
        ...prev,
        [currentCommentProduct]: 'incorrect'
      }));
      
      // Guardar comentario si existe
      if (tempComment.trim()) {
        setStockComments(prev => ({
          ...prev,
          [currentCommentProduct]: tempComment.trim()
        }));
      }
      
      // Cerrar modal
      setShowCommentModal(false);
      setCurrentCommentProduct(null);
      setTempComment('');
    }
  };

  const handleCommentCancel = () => {
    setShowCommentModal(false);
    setCurrentCommentProduct(null);
    setTempComment('');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setShowOnlyChecked(false);
    setCurrentPage(1);
  };

  // Función para determinar el color del stock
  const getStockColorClass = (stock) => {
    if (stock === 0) return 'stock-zero';
    if (stock <= 5) return 'stock-low';
    return 'stock-good';
  };

  // Función para formatear precios
  const formatPrice = (price) => {
    return `$${price.toLocaleString('es-ES', {
      maximumFractionDigits: 0,
      useGrouping: true
    }).replace(/,/g, '.')}`;
  };

  const generatePDFReport = () => {
    const checkedProducts = Object.keys(stockStatus).length;
    const correctStock = Object.values(stockStatus).filter(status => status === 'correct').length;
    const incorrectStock = Object.values(stockStatus).filter(status => status === 'incorrect').length;
    const completionPercentage = ((checkedProducts / products.length) * 100).toFixed(1);
    
    // Obtener información del usuario actual
    const usuarioActual = JSON.parse(localStorage.getItem('user')) || { 
      email: 'Usuario desconocido',
      username: 'Sistema'
    };
    
    // Obtener productos verificados con sus detalles
    const verifiedProducts = products.filter(product => stockStatus[product._id]);
    const correctProducts = verifiedProducts.filter(product => stockStatus[product._id] === 'correct');
    const incorrectProducts = verifiedProducts.filter(product => stockStatus[product._id] === 'incorrect');
    
    // Crear documento PDF
    const doc = new jsPDF();
    
    // ============ ENCABEZADO PROFESIONAL ============
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Fondo del encabezado
    doc.setFillColor(0, 110, 223);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Línea decorativa superior
    doc.setFillColor(255, 193, 7);
    doc.rect(0, 0, pageWidth, 3, 'F');
    
    // Título principal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("REPORTE DE CONTROL DE STOCK MANUAL", pageWidth / 2, 18, { align: 'center' });
    
    // Fecha y hora
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const fechaCompleta = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const horaActual = new Date().toLocaleTimeString('es-ES');
    doc.text(`Generado el ${fechaCompleta} a las ${horaActual}`, pageWidth / 2, 28, { align: 'center' });
    
    // Restablecer colores
    doc.setTextColor(0, 0, 0);
    
    // ============ INFORMACIÓN DEL USUARIO ============
    let currentY = 45;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Usuario responsable: ${usuarioActual.email}`, 20, currentY);
    
    // ============ RESUMEN EJECUTIVO ============
    currentY += 10;
    doc.setFontSize(16);
    doc.setTextColor(0, 110, 223);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN EJECUTIVO", 20, currentY);
    
    // Línea decorativa
    doc.setDrawColor(0, 110, 223);
    doc.setLineWidth(1);
    doc.line(20, currentY + 3, pageWidth - 20, currentY + 3);
    
    currentY += 15;
    
    // Tabla de resumen
    const summaryData = [
      ["Total de Productos", products.length.toString()],
      ["Productos Verificados", checkedProducts.toString()],
      ["Stock Correcto", correctStock.toString()],
      ["Stock Incorrecto", incorrectStock.toString()],
      ["Porcentaje Completado", `${completionPercentage}%`],
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [["Metrica", "Valor"]],
      body: summaryData,
      headStyles: { 
        fillColor: [0, 110, 223],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });
    
    currentY = doc.lastAutoTable.finalY + 20;
    
    // ============ PRODUCTOS CON STOCK CORRECTO ============
    if (correctProducts.length > 0) {
      // Verificar espacio en la página
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 167, 69);
      doc.setFont("helvetica", "bold");
      doc.text(`PRODUCTOS CON STOCK CORRECTO (${correctProducts.length})`, 20, currentY);
      
      currentY += 10;
      
      const correctTableData = correctProducts.map(product => [
        product.Nombre,
        product.Marca || '-',
        product.Categoria,
        product.Stock.toString(),
        `$${product.PrecioVenta.toLocaleString('es-ES')}`,
        product.codigoBarras || 'Sin codigo'
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [["Producto", "Marca", "Categoria", "Stock", "Precio", "Codigo de Barras"]],
        body: correctTableData,
        headStyles: { 
          fillColor: [40, 167, 69],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 35 }
        },
        margin: { left: 20, right: 20 }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
    }
    
    // ============ PRODUCTOS CON STOCK INCORRECTO ============
    if (incorrectProducts.length > 0) {
      // Verificar espacio en la página
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(220, 53, 69);
      doc.setFont("helvetica", "bold");
      doc.text(`PRODUCTOS CON STOCK INCORRECTO (${incorrectProducts.length})`, 20, currentY);
      
      currentY += 10;
      
      const incorrectTableData = incorrectProducts.map(product => [
        product.Nombre,
        product.Marca || '-',
        product.Categoria,
        product.Stock.toString(),
        `$${product.PrecioVenta.toLocaleString('es-ES')}`,
        product.codigoBarras || 'Sin codigo',
        stockComments[product._id] || 'Sin comentario'
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [["Producto", "Marca", "Categoria", "Stock", "Precio", "Codigo de Barras", "Comentario"]],
        body: incorrectTableData,
        headStyles: { 
          fillColor: [220, 53, 69],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 25 },
          6: { cellWidth: 40 }
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // ============ MENSAJE SI NO HAY DATOS ============
    if (checkedProducts === 0) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(108, 117, 125);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMACION", 20, currentY);
      
      currentY += 15;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("No se han verificado productos aun.", 20, currentY);
      doc.text("Utilice el sistema de control de stock para marcar productos como correctos o incorrectos.", 20, currentY + 8);
    }
    
    // ============ PIE DE PÁGINA ============
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Línea separadora
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      // Información del pie
      doc.setFontSize(9);
      doc.setTextColor(108, 117, 125);
      doc.setFont("helvetica", "normal");
      
      // Lado izquierdo - Sistema y usuario
      doc.text("La Despensa - Sistema de Gestion de Inventario", 20, pageHeight - 15);
      
      // Centro - Fecha
      doc.text(new Date().toLocaleDateString('es-ES'), pageWidth / 2, pageHeight - 15, { align: 'center' });
      
      // Lado derecho - Página
      doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
      
      // Información del usuario en el pie
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generado por: ${usuarioActual.email}`, 20, pageHeight - 8);
      
      // Marca de agua
      doc.text("Control de Stock Manual", pageWidth / 2, pageHeight - 8, { align: 'center' });
    }
    
    // ============ GUARDAR PDF ============
    const timestamp = new Date().toISOString().split('T')[0];
    const nombreArchivo = `LaDespensa_ControlStock_${timestamp}.pdf`;
    doc.save(nombreArchivo);

    showSuccessAlert(
      'Reporte de Control de Stock Generado',
      `Se ha descargado el reporte PDF "${nombreArchivo}" con ${checkedProducts} productos verificados.`
    );
  };

  const generateReportHTML = (data) => {
    // Esta función ya no se usa, pero la mantenemos por compatibilidad
    return '';
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="stock-control-modal-overlay" onClick={handleOverlayClick}>
      <div className="stock-control-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stock-control-modal-header">
          <div className="modal-title-section">
            <FontAwesomeIcon icon={faClipboardList} className="title-icon" />
            <div>
              <h2>Control de Stock Manual</h2>
              <p>Verifica que el stock del sistema coincida con tu inventario físico</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="stock-control-modal-body">
          {/* Filtros y controles */}
          <div className="controls-section">
            <div className="search-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filters-container">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showOnlyChecked}
                  onChange={(e) => setShowOnlyChecked(e.target.checked)}
                />
                Solo verificados
              </label>

              <button onClick={handleClearFilters} className="clear-filters-btn">
                <FontAwesomeIcon icon={faFilter} /> Limpiar
              </button>

              <button onClick={generatePDFReport} className="generate-report-btn">
                <FontAwesomeIcon icon={faFilePdf} /> Generar Reporte PDF
              </button>
            </div>
          </div>

          {/* Lista de productos */}
          <div className="products-list-container">
            {loading ? (
              <div className="loading-container">
                <p>Cargando productos...</p>
              </div>
            ) : (
              <>
                <div className="products-table-wrapper">
                  <table className="products-control-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Marca</th>
                        <th>Categoría</th>
                        <th>Stock Sistema</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th>Verificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedProducts.map((product) => (
                        <tr key={product._id} className="product-control-row">
                          <td className="product-name-cell">
                            <div className="product-info">
                              <span className="product-name">{product.Nombre}</span>
                              {product.codigoBarras && (
                                <span className="product-barcode">{product.codigoBarras}</span>
                              )}
                            </div>
                          </td>
                          <td className="product-brand">{product.Marca}</td>
                          <td className="product-category">
                            <span className="category-badge">{product.Categoria}</span>
                          </td>
                          <td className="product-stock">
                            <span className={`stock-badge ${getStockColorClass(product.Stock)}`}>
                              {product.Stock} unidades
                            </span>
                          </td>
                          <td className="product-price">{formatPrice(product.PrecioVenta)}</td>
                          <td className="product-status">
                            {stockStatus[product._id] === 'correct' && (
                              <span className="status-correct">
                                <FontAwesomeIcon icon={faCheckCircle} /> Correcto
                              </span>
                            )}
                            {stockStatus[product._id] === 'incorrect' && (
                              <div className="status-incorrect-container">
                                <span className="status-incorrect">
                                  <FontAwesomeIcon icon={faExclamationTriangle} /> Incorrecto
                                </span>
                                {stockComments[product._id] && (
                                  <div className="status-comment">
                                    <small className="comment-preview">
                                      {stockComments[product._id].length > 30 
                                        ? `${stockComments[product._id].substring(0, 30)}...` 
                                        : stockComments[product._id]
                                      }
                                    </small>
                                  </div>
                                )}
                              </div>
                            )}
                            {!stockStatus[product._id] && (
                              <span className="status-pending">Sin verificar</span>
                            )}
                          </td>
                          <td className="verification-actions">
                            <div className="verification-buttons">
                              <button
                                onClick={() => handleStockVerification(product._id, 'correct')}
                                className={`verify-btn correct-btn ${stockStatus[product._id] === 'correct' ? 'active' : ''}`}
                                title="Stock correcto"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} />
                              </button>
                              <button
                                onClick={() => handleStockVerification(product._id, 'incorrect')}
                                className={`verify-btn incorrect-btn ${stockStatus[product._id] === 'incorrect' ? 'active' : ''}`}
                                title="Stock incorrecto"
                              >
                                <FontAwesomeIcon icon={faTimesCircle} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <SmartPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  maxVisiblePages={5}
                />
              </>
            )}
          </div>
        </div>

        <div className="stock-control-modal-footer">
          <div className="progress-info">
            <span>
              Verificados: {Object.keys(stockStatus).length} de {products.length} productos
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${(Object.keys(stockStatus).length / products.length) * 100}%` 
                }}
              />
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {/* Modal de comentario */}
        {showCommentModal && (
          <div className="comment-modal-overlay">
            <div className="comment-modal">
              <div className="comment-modal-header">
                <h3>Comentario sobre el producto</h3>
                <button className="close-button" onClick={handleCommentCancel}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="comment-modal-body">
                <p>Producto: {currentCommentProduct && products.find(p => p._id === currentCommentProduct)?.Nombre}</p>
                <textarea
                  value={tempComment}
                  onChange={(e) => setTempComment(e.target.value)}
                  placeholder="Ingrese un comentario sobre por qué el stock es incorrecto..."
                  className="comment-textarea"
                />
              </div>
              <div className="comment-modal-footer">
                <button onClick={handleCommentSubmit} className="submit-comment-btn">
                  <FontAwesomeIcon icon={faCheck} /> Guardar Comentario
                </button>
                <button onClick={handleCommentCancel} className="cancel-comment-btn">
                  <FontAwesomeIcon icon={faTimes} /> Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockControlModal;