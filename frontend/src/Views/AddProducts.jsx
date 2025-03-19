import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/AddProductStyles.css';
import { addProducts } from '../services/AddProducts.service.js';
import Swal from 'sweetalert2';

const categories = [
  { label: 'Seleccione una categoría', value: '' },
  { label: 'Congelados', value: 'Congelados' },
  { label: 'Carnes', value: 'Carnes' },
  { label: 'Despensa', value: 'Despensa' },
  { label: 'Panaderia y Pasteleria', value: 'Panaderia y Pasteleria' },
  { label: 'Quesos y Fiambres', value: 'Quesos y Fiambres' },
  { label: 'Bebidas y Licores', value: 'Bebidas y Licores' },
  { label: 'Lacteos, Huevos y Refrigerados', value: 'Lacteos, Huevos y Refrigerados' },
  { label: 'Desayuno y Dulces', value: 'Desayuno y Dulces' },
  { label: 'Bebes y Niños', value: 'Bebes y Niños' },
  { label: 'Cigarros', value: 'Cigarros' },
  { label: 'Cuidado Personal', value: 'Cuidado Personal' },
  { label: 'Limpieza y Hogar', value: 'Limpieza y Hogar' },
  { label: 'Mascotas', value: 'Mascotas' },
  { label: 'Remedios', value: 'Remedios' },
  { label: 'Otros', value: 'Otros' },

];

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
  const [image, setImage] = useState(null); // Estado para la imagen

  const [categoriaColor, setCategoriaColor] = useState('#b5b5b5');
  const [fechaColor, setFechaColor] = useState('#b5b5b5');
  const handleImageChange = (e) => setImage(e.target.files[0]); // Guardar archivo
  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    setCategoria(value);
    setCategoriaColor(value === '' ? '#b5b5b5' : '#000000');
  };

  const handleFechaChange = (e) => {
    const value = e.target.value;
    setFechaVencimiento(value);
    setFechaColor(value === '' ? '#b5b5b5' : '#000000');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Categoria === '') {
      alert('Por favor, seleccione una categoría válida.');
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
    if (image) formData.append('image', image); // Agregar la imagen solo si existe

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
            <input type="text" placeholder="Código de Barras" value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} required />
          </div>
          <div className="add-prod-form-group add-prod-form-group-full">
            <input type="text" placeholder="Marca del producto" value={Marca} onChange={(e) => setMarca(e.target.value)} required />
          </div>
          <div className="add-prod-form-group add-prod-form-group-full">
            <input type="text" placeholder="Stock" value={Stock} onChange={(e) => setStock(e.target.value)} required />
          </div>
          <div className="add-prod-form-group add-prod-form-group-full">
            <select value={Categoria} onChange={handleCategoriaChange} required>
              {categories.map((category, index) => (
                <option key={index} value={category.value}>
                  {category.label}
                </option>
              ))}
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
  onChange={(e) => setImage(e.target.files[0])}
  required
/>

          </div>
          <div className="add-prod-buttons">
            <button type="submit" className="add-button">Añadir producto 🛒</button>
            <button type="button" className="cancel-button" onClick={() => navigate('/products')}>Cancelar ❌</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProducts;
