import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateProduct, getProductById } from '../services/AddProducts.service';
import Navbar from '../components/Navbar';
import '../styles/EditProductStyles.css';
import Swal from 'sweetalert2';

const EditProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [Stock, setStock] = useState('');
  const productId = location.state?.productId;

  const [product, setProduct] = useState({
    Nombre: '',
    codigoBarras: '',
    Marca: '',
    Stock: 0,
    Categoria: '',
    PrecioVenta: 0,
    PrecioCompra: 0,
    fechaVencimiento: '',
    precioAntiguo: 0,
  });

  const [image, setImage] = useState(null); // Estado para la imagen
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      console.error('Product ID is not provided');
      navigate('/products');
      return;
    }

    const fetchProduct = async () => {
      try {
        const data = await getProductById(productId);

        const formattedDate = data.fechaVencimiento 
          ? new Date(data.fechaVencimiento).toISOString().split('T')[0] 
          : '';

        setProduct({
          Nombre: data.Nombre || '',
          codigoBarras: data.codigoBarras || '',
          Marca: data.Marca || '',
          Stock: Number(data.Stock) || 0,
          Categoria: data.Categoria || '',
          PrecioVenta: Number(data.PrecioVenta) || 0,
          PrecioCompra: Number(data.PrecioCompra) || 0,
          fechaVencimiento: formattedDate,
          precioAntiguo: Number(data.precioAntiguo) || 0,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: name === 'Stock' ? Number(value) : value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { _id, __v, FechaVencimiento, updatedAt, createdAt, ...productToUpdate } = product;

    const formData = new FormData();
    for (const key in productToUpdate) {
      formData.append(key, productToUpdate[key]);
    }
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await updateProduct(productId, formData);

      Swal.fire({
        icon: 'success',
        title: 'Producto editado con éxito',
        showConfirmButton: false,
        timer: 1500
      });
      navigate('/products');
    } catch (error) {
      console.error('Error updating product:', error);
      if (error.response && error.response.data) {
        console.error('Detalles del error:', error.response.data);
      }
      Swal.fire({
        icon: 'error',
        title: 'Error al editar el producto',
        text: 'Ocurrió un error al intentar editar el producto.',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-prod-container">
      <Navbar />
      <h2>Editar Producto</h2>
      <form onSubmit={handleSubmit} className="edit-prod-form">
        <div className="edit-prod-form-group edit-prod-form-group-full">
          <label htmlFor="Nombre">Nombre:</label>
          <input
            type="text"
            id="Nombre"
            name="Nombre"
            value={product.Nombre}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-prod-form-group">
          <label htmlFor="codigoBarras">Código de Barras:</label>
          <input
            type="text"
            id="codigoBarras"
            name="codigoBarras"
            value={product.codigoBarras}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-prod-form-group">
          <label htmlFor="Marca">Marca:</label>
          <input
            type="text"
            id="Marca"
            name="Marca"
            value={product.Marca}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-prod-form-group">
          <label htmlFor="Stock">Stock:</label>
          <input
            type="text"
            id="Stock"
            name="Stock"
            value={product.Stock}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-prod-form-group edit-prod-form-group-full">
          <label htmlFor="Categoria">Categoría:</label>
          <input
            type="text"
            id="Categoria"
            name="Categoria"
            value={product.Categoria}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-prod-form-group">
          <label htmlFor="PrecioCompra">Precio de Compra:</label>
          <input
            type="number"
            id="PrecioCompra"
            name="PrecioCompra"
            value={product.PrecioCompra}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-prod-form-group">
          <label htmlFor="fechaVencimiento">Fecha de Vencimiento:</label>
          <input
            type="date"
            id="fechaVencimiento"
            name="fechaVencimiento"
            value={product.fechaVencimiento}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-prod-form-group">
          <label htmlFor="PrecioVenta">Precio de Venta:</label>
          <input
            type="number"
            id="PrecioVenta"
            name="PrecioVenta"
            value={product.PrecioVenta}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-prod-form-group">
          <label htmlFor="precioAntiguo">Precio Antiguo:</label>
          <input
            type="number"
            id="precioAntiguo"
            name="precioAntiguo"
            value={product.precioAntiguo || ''}
            onChange={handleChange}
          />
        </div>
        <div className="edit-prod-form-group edit-prod-form-group-full">
          <label htmlFor="image">Imagen:</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        <div className="edit-prod-button-group">
          <button type="submit">Editar producto 🛒</button>
          <button type="button" className="edit-prod-cancel-button" onClick={() => navigate('/products')}>
            Cancelar ❌
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;