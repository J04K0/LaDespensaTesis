import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faInfo, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProductTableView.css';

const ProductTableView = ({ 
  products, 
  onEdit, 
  onDelete, 
  onInfo,
  getStockColorClass,
  userRole = 'empleado' // Añadir userRole como prop
}) => {
  
  const formatPrice = (price) => {
    return `$${price.toLocaleString('es-ES', {
      maximumFractionDigits: 0,
      useGrouping: true
    }).replace(/,/g, '.')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const expiryDate = new Date(dateString);
    return expiryDate < today;
  };

  const isExpiringSoon = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  // Verificar si el usuario es empleado
  const isEmpleado = userRole === 'empleado';

  return (
    <div className="product-table-container">
      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio Venta</th>
              <th>Vencimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="product-table-row">
                <td className="product-table-image-cell">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.Nombre}
                      className="product-table-image"
                    />
                  ) : (
                    <div className="product-table-no-image">
                      Sin imagen
                    </div>
                  )}
                </td>
                
                <td className="product-table-name">
                  <span className="product-name-text">{product.Nombre}</span>
                  {product.codigoBarras && (
                    <span className="product-barcode">{product.codigoBarras}</span>
                  )}
                </td>
                
                <td className="product-table-brand">{product.Marca}</td>
                
                <td className="product-table-category">
                  <span className="category-badge">{product.Categoria}</span>
                </td>
                
                <td className="product-table-stock">
                  <span className={`stock-value ${getStockColorClass(product.Stock, product.Categoria)}`}>
                    {product.Stock}
                  </span>
                </td>
                
                <td className="product-table-price">
                  {formatPrice(product.PrecioVenta)}
                </td>
                
                <td className="product-table-expiry">
                  <div className="expiry-container">
                    <span className={`expiry-date ${
                      isExpired(product.fechaVencimiento) ? 'expired' : 
                      isExpiringSoon(product.fechaVencimiento) ? 'expiring-soon' : ''
                    }`}>
                      {formatDate(product.fechaVencimiento)}
                    </span>
                    {isExpired(product.fechaVencimiento) && (
                      <FontAwesomeIcon 
                        icon={faExclamationTriangle} 
                        className="expiry-warning expired"
                        title="Producto vencido"
                      />
                    )}
                    {isExpiringSoon(product.fechaVencimiento) && !isExpired(product.fechaVencimiento) && (
                      <FontAwesomeIcon 
                        icon={faExclamationTriangle} 
                        className="expiry-warning expiring"
                        title="Próximo a vencer"
                      />
                    )}
                  </div>
                </td>
                
                <td className="product-table-actions">
                  <div className="action-buttons">
                    <button
                      onClick={() => onInfo(product)}
                      className="action-btn info-btn"
                      title="Ver información"
                    >
                      <FontAwesomeIcon icon={faInfo} />
                    </button>
                    
                    {/* Solo mostrar botones de editar y eliminar si NO es empleado */}
                    {!isEmpleado && (
                      <>
                        <button
                          onClick={() => onEdit(product._id)}
                          className="action-btn edit-btn"
                          title="Editar producto"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          onClick={() => onDelete(product._id)}
                          className="action-btn delete-btn"
                          title="Eliminar producto"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTableView;