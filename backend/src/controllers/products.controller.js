import Product from '../models/products.model.js';
import { productSchema, idProductSchema } from '../schema/products.schema.js';

// Traer todos los productos
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Traer un solo producto por su ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.status(500).send('Server Error');
  }
};

// Crear un nuevo producto
export const addProduct = async (req, res) => {
  try {
    // Validar el cuerpo de la solicitud utilizando el esquema de validación
    const { value, error } = productSchema.validate(req.body)
    if (error) {
      console.log('Error detalles de validación:', error.details);
      return res.status(400).json(error.message);
    }

    // Crear un nuevo producto con los valores validados
    const newProduct = new Product(value);
    const product = await newProduct.save();

    // Responder con un código de estado 201 y el producto creado
    res.status(201).json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Actualizar un producto
export const updateProduct = async (req, res) => {
  try {
      const { id } = req.params;
      const { value: validatedId, error: errorId } = idProductSchema.validate({id});
      if (errorId) return res.status(400).json({ message: errorId.message });
      const product = await Product.findById(validatedId.id);
      if (product.length === 0) return res.status(404).json({ msg: 'Producto no encontrado' });
      const { body } = req;
      const { value, error } = productSchema.validate(body);
      if (error) return res.status(400).json({ message: error.message });

      const updatedProduct = await Product.findByIdAndUpdate(
          validatedId.id,
          { 
              Nombre: value.Nombre,
              Marca: value.Marca,
              Stock: value.Stock,
              Categoria: value.Categoria,
              precioVenta: value.precioVenta,
              precioCompra: value.precioCompra,
              fechaVencimiento: value.fechaVencimiento,
              precioAntiguo: product.precioVenta
          },
          { new: true }
      );

      res.status(200).json({
          msg: "Producto modificado exitosamente",
          data: updatedProduct
      })
  } catch (err) {
      res.status(500).json({ message: 'Error al modificar un producto', err });
  }
};

// Elinminar un producto
export const deleteProduct = async (req, res) => {
  try {
    const { value, error } = idProductSchema.validate(req.params, { convert: false });
    if (error) {
      console.log('Error detalles de validación:', error.details);
      return res.status(400).json(error.message);
    }
    const product = await Product.findByIdAndDelete(value.id);

    if (!product) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json({ msg: 'Producto eliminado' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.status(500).send('Server Error');
  }
};
