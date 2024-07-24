import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateProduct, getProductById } from '../services/AddProducts.service';
import '../styles/EditProductStyles.css';

const EditProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const productId = location.state?.productId;

  const [product, setProduct] = useState({
    Nombre: '',
    Marca: '',
    Stock: 0,
    Categoria: '',
    PrecioVenta: 0,
    PrecioCompra: 0,
    fechaVencimiento: '',
    precioAntiguo: 0,
  });

  useEffect(() => {
    if (!productId) {
      console.error('Product ID is not provided');
      navigate('/products');
      return;
    }

    const fetchProduct = async () => {
      try {
        const data = await getProductById(productId);

        // Asegúrate de que la fecha esté en el formato correcto y que Stock sea un número
        const formattedDate = data.fechaVencimiento 
          ? new Date(data.fechaVencimiento).toISOString().split('T')[0] 
          : '';

        setProduct({
          ...data,
          fechaVencimiento: formattedDate,
          Stock: Number(data.Stock),
        });
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, [productId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: name === 'Stock' ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Remover los campos _id y __v antes de enviar
    const { _id, __v,FechaVencimiento, updatedAt,  ...productToUpdate } = product;
    console.log('Datos enviados:', productToUpdate); // Verifica que los datos sean correctos
    try {
      await updateProduct(productId, productToUpdate);
      navigate('/products');
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  return (
    <div className="edit-product-container">
      <h2>Editar Producto</h2>
      <form onSubmit={handleSubmit} className="edit-product-form">
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
          <label htmlFor="Stock">Stock:</label>
          <input
            type="number"
            id="Stock"
            name="Stock"
            value={product.Stock}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
          <label htmlFor="precioAntiguo">Precio Antiguo:</label>
          <input
            type="number"
            id="precioAntiguo"
            name="precioAntiguo"
            value={product.precioAntiguo}
            onChange={handleChange}
          />
        </div>
        <div className="button-group">
          <button type="submit">Guardar</button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
