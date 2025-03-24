import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Swal from 'sweetalert2';
import { addProducts, getProductByBarcodeForCreation } from '../services/AddProducts.service.js';
import '../styles/AddProductStyles.css';

const AddProducts = () => {
  const navigate = useNavigate();
  const [Nombre, setNombre] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [Marca, setMarca] = useState('');
  const [Stock, setStock] = useState('');
  const [Categoria, setCategoria] = useState('');
  const [PrecioCompra, setPrecioCompra] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [PrecioVenta, setPrecioVenta] = useState('');
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => setImage(e.target.files[0]);
  const handleCategoriaChange = (e) => setCategoria(e.target.value);
  const handleFechaChange = (e) => setFechaVencimiento(e.target.value);

  const handleCodigoBarrasChange = async (e) => {
    const value = e.target.value;
    setCodigoBarras(value);
  
    if (value.length === 13) {
      try {
        const product = await getProductByBarcodeForCreation(value);
  
        if (product) {
          setNombre(product.nombre);
          setMarca(product.marca);
          setCategoria(product.categoria);
  
          if (product.image) {
            setImage(product.image);
          } else {
            setImage(null);
          }
        } else {
          Swal.fire('Error', 'Producto no encontrado', 'error');
        }
      } catch (error) {
        console.error('Error fetching product by barcode:', error);
        Swal.fire('Error', 'Ocurrió un error al buscar el producto.', 'error');
      }
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (Categoria === '') {
      Swal.fire('Error', 'Por favor, seleccione una categoría válida.', 'error');
      return;
    }
  
    const formData = new FormData();
    formData.append('Nombre', Nombre);
    formData.append('codigoBarras', codigoBarras);
    formData.append('Marca', Marca);
    formData.append('Categoria', Categoria);
    formData.append('Stock', Stock);
    formData.append('PrecioCompra', PrecioCompra);
    formData.append('fechaVencimiento', fechaVencimiento);
    formData.append('PrecioVenta', PrecioVenta);
  
    if (image instanceof File) {
      formData.append('image', image);
    } else if (typeof image === 'string' && image.startsWith('http')) {
      formData.append('imageUrl', image);
    }
  
    try {
      await addProducts(formData);
      Swal.fire('Éxito', 'Producto creado con éxito', 'success');
      navigate('/products');
    } catch (error) {
      console.error('Error al añadir el producto', error);
      Swal.fire('Error', 'Ocurrió un error al intentar crear el producto.', 'error');
    }
  };
  
  
  

  return (
    <div className="add-prod-page">
      <Navbar />
      <div className="add-prod-container">
        <h2>Añadir producto</h2>
        <form onSubmit={handleSubmit} className="add-prod-form">
          <div className="add-prod-form-group add-prod-form-group-full">
            <input type="text" placeholder="Nombre del producto" value={Nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="add-prod-form-group add-prod-form-group-full">
            <input type="text" placeholder="Código de Barras" value={codigoBarras} onChange={handleCodigoBarrasChange} required />
          </div>
          <div className="add-prod-form-group add-prod-form-group-full">
            <input type="text" placeholder="Marca del producto" value={Marca} onChange={(e) => setMarca(e.target.value)} required />
          </div>
          <div className="add-prod-form-group add-prod-form-group-full">
            <input type="text" placeholder="Stock" value={Stock} onChange={(e) => setStock(e.target.value)} required />
          </div>
          <div className="add-prod-form-group add-prod-form-group-full">
            <select value={Categoria} onChange={handleCategoriaChange} required>
              <option value="">Seleccione una categoría</option>
              <option value="Congelados">Congelados</option>
              <option value="Carnes">Carnes</option>
              <option value="Despensa">Despensa</option>
              <option value="Panaderia y Pasteleria">Panaderia y Pasteleria</option>
              <option value="Quesos y Fiambres">Quesos y Fiambres</option>
              <option value="Bebidas y Licores">Bebidas y Licores</option>
              <option value="Lacteos, Huevos y Refrigerados">Lacteos, Huevos y Refrigerados</option>
              <option value="Desayuno y Dulces">Desayuno y Dulces</option>
              <option value="Bebes y Niños">Bebes y Niños</option>
              <option value="Cigarros">Cigarros</option>
              <option value="Cuidado Personal">Cuidado Personal</option>
              <option value="Limpieza y Hogar">Limpieza y Hogar</option>
              <option value="Mascotas">Mascotas</option>
              <option value="Remedios">Remedios</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div className="add-prod-form-group">
            <input type="number" placeholder="Precio de compra" value={PrecioCompra} onChange={(e) => setPrecioCompra(e.target.value)} required />
          </div>
          <div className="add-prod-form-group">
            <input type="date" placeholder="Fecha de vencimiento" value={fechaVencimiento} onChange={handleFechaChange} required />
          </div>
          <div className="add-prod-form-group">
            <input type="number" placeholder="Precio de venta" value={PrecioVenta} onChange={(e) => setPrecioVenta(e.target.value)} required />
          </div>
          <div className="add-prod-form-group">
            <label className="label">Imagen:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required={!image}
            />
            {image && typeof image === 'string' && (
              <div className="image-preview-container">
                <p>Vista previa de la imagen:</p>
                <img src={image} alt="Vista previa del producto" className="product-preview" />
              </div>
            )}
          </div>
          <div className="add-prod-buttons">
            <button type="submit" className="add-button">Añadir producto 🛒</button>
            <button type="button" className="cancel-button" onClick={() => navigate('/products')}>Cancelar ❌</button>
          </div>
        </form>
      </div>
    </div>
  );
}  
export default AddProducts;