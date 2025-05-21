import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { addProducts, getProductByBarcodeForCreation } from '../services/AddProducts.service.js';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert } from '../helpers/swaHelper';
import '../styles/AddProductStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faSave, faTimes, faImage, faClipboardList } from '@fortawesome/free-solid-svg-icons';

const AddProducts = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Nombre: '',
    codigoBarras: '',
    Marca: '',
    Stock: '',
    Categoria: '',
    PrecioCompra: '',
    fechaVencimiento: '',
    PrecioVenta: '',
  });
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const barcode = params.get('barcode');
    
    if (barcode) {
      setFormData(prev => ({ ...prev, codigoBarras: barcode }));
      handleCodigoBarrasChange(barcode);
    }
  }, []);

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
    setFormData(prev => ({ ...prev, codigoBarras: value }));

    if (value.length === 13) {
      setLoading(true);
      setError(null);
      try {
        const product = await getProductByBarcodeForCreation(value);

        if (product) {
          setFormData(prev => ({
            ...prev,
            Nombre: product.nombre || '',
            Marca: product.marca || '',
            Categoria: product.categoria || ''
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

    if (formData.Categoria === '') {
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

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        <div className="product-form-container">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="product-form">
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}
                
                <div className="form-section">
                  <div className="section-header">
                    <FontAwesomeIcon icon={faClipboardList} className="section-icon" />
                    <h3 className="section-title">Información Básica</h3>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="codigoBarras" className="form-label">Código de Barras *</label>
                      <input
                        type="text"
                        id="codigoBarras"
                        name="codigoBarras"
                        value={formData.codigoBarras}
                        onChange={(e) => handleCodigoBarrasChange(e.target.value)}
                        className="form-control"
                        placeholder="Escanee o ingrese el código"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="Categoria" className="form-label">Categoría *</label>
                      <select
                        id="Categoria"
                        name="Categoria"
                        value={formData.Categoria}
                        onChange={handleChange}
                        className="form-select"
                        required
                      >
                        <option value="">Seleccione una categoría</option>
                        {categorias.map((categoria, index) => (
                          <option key={index} value={categoria}>{categoria}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="Nombre" className="form-label">Nombre del Producto *</label>
                      <input
                        type="text"
                        id="Nombre"
                        name="Nombre"
                        value={formData.Nombre}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="Marca" className="form-label">Marca *</label>
                      <input
                        type="text"
                        id="Marca"
                        name="Marca"
                        value={formData.Marca}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Marca del producto"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <div className="section-header">
                    <FontAwesomeIcon icon={faFile} className="section-icon" />
                    <h3 className="section-title">Inventario y Precios</h3>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="Stock" className="form-label">Stock Inicial *</label>
                      <input
                        type="number"
                        id="Stock"
                        name="Stock"
                        value={formData.Stock}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Cantidad"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="PrecioCompra" className="form-label">Precio de Compra *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          id="PrecioCompra"
                          name="PrecioCompra"
                          value={formData.PrecioCompra}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="PrecioVenta" className="form-label">Precio de Venta *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          id="PrecioVenta"
                          name="PrecioVenta"
                          value={formData.PrecioVenta}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group fecha-vencimiento">
                      <label htmlFor="fechaVencimiento" className="form-label">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        id="fechaVencimiento"
                        name="fechaVencimiento"
                        value={formData.fechaVencimiento}
                        onChange={handleChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <div className="section-header">
                    <FontAwesomeIcon icon={faImage} className="section-icon" />
                    <h3 className="section-title">Imagen del Producto</h3>
                  </div>
                  
                  <div className="form-row image-section">
                    <div className="form-group">
                      <label htmlFor="image" className="form-label">Imagen</label>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        onChange={handleImageChange}
                        className="form-control file-input"
                        accept="image/*"
                      />
                      <small className="form-text">Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB</small>
                    </div>
                    
                    <div className="form-group preview-container">
                      {(imagePreview || image) && (
                        <div className="image-preview">
                          <p>Vista previa:</p>
                          <img 
                            src={imagePreview || (image instanceof File ? URL.createObjectURL(image) : null)} 
                            alt="Vista previa del producto" 
                            className="img-preview" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faSave} /> {loading ? 'Guardando...' : 'Guardar Producto'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
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