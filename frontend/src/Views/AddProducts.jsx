import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/AddProductStyles.css';
import { addProducts, getProductByBarcodeForCreation } from '../services/AddProducts.service.js';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert, showEmpleadoAccessDeniedAlert } from '../helpers/swaHelper';
import { useRole } from '../hooks/useRole';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faSave, faTimes, faImage, faClipboardList } from '@fortawesome/free-solid-svg-icons';

const AddProducts = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    'addproducts-nombre': '',
    'addproducts-codigo-barras': '',
    'addproducts-marca': '',
    'addproducts-stock': '',
    'addproducts-categoria': '',
    'addproducts-precio-compra': '',
    'addproducts-fecha-vencimiento': '',
    'addproducts-precio-venta': '',
  });
  const [precioRecomendado, setPrecioRecomendado] = useState(0);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categorias = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y Refrigerados',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros', 'Cuidado Personal',
    'Limpieza y Hogar', 'Mascotas', 'Remedios', 'Otros'
  ];

  // Definir márgenes por categoría (mismos valores que en el backend)
  const margenesPorCategoria = {
    'Congelados': 0.25, // 25% (promedio de 20-30%)
    'Carnes': 0.20, // 20% (promedio de 15-25%)
    'Despensa': 0.20, // 20% (promedio de 15-25%)
    'Panaderia y Pasteleria': 0.25, // 25% (promedio de 20-30%)
    'Quesos y Fiambres': 0.25, // 25% (promedio de 20-30%)
    'Bebidas y Licores': 0.33, // 33% (promedio de 25-40%)
    'Lacteos, Huevos y Refrigerados': 0.20, // 20% (promedio de 15-25%)
    'Desayuno y Dulces': 0.30, // 30% (promedio de 25-35%)
    'Bebes y Niños': 0.28, // 28% (promedio de 20-35%)
    'Cigarros': 0.40, // 40% (promedio de 30-50%)
    'Cuidado Personal': 0.28, // 28% (promedio de 20-35%)
    'Limpieza y Hogar': 0.28, // 28% (promedio de 20-35%)
    'Mascotas': 0.28, // 28% (promedio de 20-35%)
    'Remedios': 0.15, // 15% (promedio de 10-20%)
    'Otros': 0.23  // 23% (promedio de 15-30%)
  };

  // 🔧 Obtener el rol del usuario para restricciones
  const { userRole } = useRole();
  const isEmpleado = userRole === 'empleado';

  // 🔧 Verificar permisos al cargar el componente
  useEffect(() => {
    if (isEmpleado) {
      showEmpleadoAccessDeniedAlert("la creación de productos nuevos", "Solo administradores y jefes pueden agregar productos al inventario.");
      navigate('/products');
      return;
    }
  }, [isEmpleado, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const barcode = params.get('barcode');
    
    if (barcode) {
      setFormData(prev => ({ ...prev, 'addproducts-codigo-barras': barcode }));
      handleCodigoBarrasChange(barcode);
    }
  }, []);

  // Calcular precio recomendado cuando cambia el precio de compra o la categoría
  useEffect(() => {
    const precioCompra = parseFloat(formData['addproducts-precio-compra']) || 0;
    const categoria = formData['addproducts-categoria'] || 'Otros';
    const margen = margenesPorCategoria[categoria] || 0.23;
    const nuevoPrecioRecomendado = precioCompra * (1 + margen);
    setPrecioRecomendado(nuevoPrecioRecomendado);
  }, [formData['addproducts-precio-compra'], formData['addproducts-categoria']]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleCodigoBarrasChange = async (value) => {
    setFormData(prev => ({ ...prev, 'addproducts-codigo-barras': value }));

    if (value.length === 13) {
      setLoading(true);
      setError(null);
      try {
        const product = await getProductByBarcodeForCreation(value);

        if (product) {
          setFormData(prev => ({
            ...prev,
            'addproducts-nombre': product.nombre || '',
            'addproducts-marca': product.marca || '',
            'addproducts-categoria': product.categoria || ''
          }));

          if (product.image) {
            setImagePreview(product.image);
          }
        }
      } catch (error) {
        setError('No se pudo verificar el código de barras');
        console.error('Error al verificar código de barras:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const usarPrecioRecomendado = () => {
    setFormData(prev => ({ 
      ...prev, 
      'addproducts-precio-venta': precioRecomendado.toFixed(0) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mostrar confirmación antes de añadir el producto
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas añadir este producto al inventario?",
      "Sí, añadir",
      "No, cancelar"
    );

    if (!result.isConfirmed) return;

    if (formData['addproducts-categoria'] === '') {
      showErrorAlert('Error', 'Por favor, seleccione una categoría válida.');
      return;
    }

    setLoading(true);
    setError(null);

    const productFormData = new FormData();
    for (const key in formData) {
      productFormData.append(key, formData[key]);
    }

    if (image instanceof File) {
      productFormData.append('image', image);
    } else if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('http')) {
      productFormData.append('imageUrl', imagePreview);
    }

    try {
      await addProducts(productFormData);
      showSuccessAlert('Éxito', 'Producto agregado correctamente al inventario');
      navigate('/products');
    } catch (error) {
      console.error('Error al añadir el producto', error);
      setError('Ocurrió un error al intentar crear el producto.');
      showErrorAlert('Error', 'No se pudo registrar el producto. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas cancelar el registro? Los cambios no se guardarán.",
      "Sí, cancelar",
      "No, volver"
    );

    if (result.isConfirmed) {
      navigate('/products');
    }
  };

  // Si es empleado, no renderizar nada (ya fue redirigido)
  if (isEmpleado) {
    return null;
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        <div className="addproducts-page-header">
          <h1 className="addproducts-page-title">Agregar Producto</h1>
          <p className="addproducts-page-subtitle">Registra nuevos productos o añade stock a tu inventario</p>
        </div>
        <div className="addproducts-form-container">
          <div className="addproducts-card">
            <div className="addproducts-card-body">
              <form onSubmit={handleSubmit} className="addproducts-form">
                {error && (
                  <div className="addproducts-alert addproducts-alert-danger">{error}</div>
                )}
                
                <div className="addproducts-form-section">
                  <div className="addproducts-section-header">
                    <FontAwesomeIcon icon={faClipboardList} className="addproducts-section-icon" />
                    <h3 className="addproducts-section-title">Información Básica</h3>
                  </div>
                  
                  <div className="addproducts-form-row">
                    <div className="addproducts-form-group">
                      <label htmlFor="addproducts-codigo-barras" className="addproducts-form-label">Código de Barras *</label>
                      <input
                        type="text"
                        id="addproducts-codigo-barras"
                        name="addproducts-codigo-barras"
                        value={formData['addproducts-codigo-barras']}
                        onChange={(e) => handleCodigoBarrasChange(e.target.value)}
                        className="addproducts-form-control"
                        placeholder="Escanee o ingrese el código"
                        required
                      />
                    </div>
                    
                    <div className="addproducts-form-group">
                      <label htmlFor="addproducts-categoria" className="addproducts-form-label">Categoría *</label>
                      <select
                        id="addproducts-categoria"
                        name="addproducts-categoria"
                        value={formData['addproducts-categoria']}
                        onChange={handleChange}
                        className="addproducts-form-select"
                        required
                      >
                        <option value="">Seleccione una categoría</option>
                        {categorias.map((categoria, index) => (
                          <option key={index} value={categoria}>{categoria}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="addproducts-form-row">
                    <div className="addproducts-form-group">
                      <label htmlFor="addproducts-nombre" className="addproducts-form-label">Nombre del Producto *</label>
                      <input
                        type="text"
                        id="addproducts-nombre"
                        name="addproducts-nombre"
                        value={formData['addproducts-nombre']}
                        onChange={handleChange}
                        className="addproducts-form-control"
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>
                    
                    <div className="addproducts-form-group">
                      <label htmlFor="addproducts-marca" className="addproducts-form-label">Marca *</label>
                      <input
                        type="text"
                        id="addproducts-marca"
                        name="addproducts-marca"
                        value={formData['addproducts-marca']}
                        onChange={handleChange}
                        className="addproducts-form-control"
                        placeholder="Marca del producto"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="addproducts-form-section">
                  <div className="addproducts-section-header">
                    <FontAwesomeIcon icon={faFile} className="addproducts-section-icon" />
                    <h3 className="addproducts-section-title">Inventario y Precios</h3>
                  </div>
                  
                  <div className="addproducts-form-row">
                    <div className="addproducts-form-group">
                      <label htmlFor="addproducts-stock" className="addproducts-form-label">Stock Inicial *</label>
                      <input
                        type="number"
                        id="addproducts-stock"
                        name="addproducts-stock"
                        value={formData['addproducts-stock']}
                        onChange={handleChange}
                        className="addproducts-form-control"
                        placeholder="Cantidad"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div className="addproducts-form-group">
                      <label htmlFor="addproducts-precio-compra" className="addproducts-form-label">Precio de Compra *</label>
                      <div className="addproducts-input-group">
                        <span className="addproducts-input-group-text">$</span>
                        <input
                          type="number"
                          id="addproducts-precio-compra"
                          name="addproducts-precio-compra"
                          value={formData['addproducts-precio-compra']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="addproducts-form-row">
                    <div className="addproducts-form-group">
                      <label className="addproducts-form-label">Precio Recomendado (Según categoria)</label>
                      <div className="addproducts-recomendado-container">
                        <div className="addproducts-input-group">
                          <span className="addproducts-input-group-text">$</span>
                          <input
                            type="text"
                            value={precioRecomendado.toFixed(0)}
                            className="addproducts-form-control"
                            disabled
                          />
                        </div>
                        <button 
                          type="button"
                          className="addproducts-btn addproducts-btn-usar-recomendado"
                          onClick={usarPrecioRecomendado}
                          disabled={!precioRecomendado}
                        >
                          Usar este precio
                        </button>
                      </div>
                    </div>
                    
                    <div className="addproducts-form-group">
                      <label htmlFor="addproducts-precio-venta" className="addproducts-form-label">Precio de Venta Final *</label>
                      <div className="addproducts-input-group">
                        <span className="addproducts-input-group-text">$</span>
                        <input
                          type="number"
                          id="addproducts-precio-venta"
                          name="addproducts-precio-venta"
                          value={formData['addproducts-precio-venta']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="addproducts-form-row">
                    <div className="addproducts-form-group addproducts-fecha-vencimiento">
                      <label htmlFor="addproducts-fecha-vencimiento" className="addproducts-form-label">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        id="addproducts-fecha-vencimiento"
                        name="addproducts-fecha-vencimiento"
                        value={formData['addproducts-fecha-vencimiento']}
                        onChange={handleChange}
                        className="addproducts-form-control"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="addproducts-form-section">
                  <div className="addproducts-section-header">
                    <FontAwesomeIcon icon={faImage} className="addproducts-section-icon" />
                    <h3 className="addproducts-section-title">Imagen del Producto</h3>
                  </div>
                  
                  <div className="addproducts-form-row addproducts-image-section">
                    <div className="addproducts-form-group" style={{flexBasis: '100%'}}>
                      <label htmlFor="addproducts-image" className="addproducts-form-label">Imagen</label>
                      <div className="addproducts-file-input-container">
                        <input
                          type="file"
                          id="addproducts-image"
                          name="addproducts-image"
                          onChange={handleImageChange}
                          className="addproducts-form-control addproducts-file-input"
                          accept="image/*"
                        />
                        <small className="addproducts-form-text">Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB</small>
                        {!image && !imagePreview && (
                          <div className="addproducts-no-file-selected">
                            Sin archivos seleccionados
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(imagePreview || image) && (
                      <div className="addproducts-form-group addproducts-preview-container">
                        <div className="addproducts-image-preview">
                          <p>Vista previa:</p>
                          <img 
                            src={imagePreview || (image instanceof File ? URL.createObjectURL(image) : null)} 
                            alt="Vista previa del producto" 
                            className="addproducts-img-preview" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="addproducts-form-actions">
                  <button 
                    type="submit" 
                    className="addproducts-btn addproducts-btn-primary"
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faSave} /> {loading ? 'Guardando...' : 'Guardar Producto'}
                  </button>
                  <button 
                    type="button" 
                    className="addproducts-btn addproducts-btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProducts;