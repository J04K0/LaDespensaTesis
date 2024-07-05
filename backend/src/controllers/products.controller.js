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
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
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
      console.log('Validation error details:', error.details);
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
    const { Nombre, Marca, Stock, Categoria, precioVenta, precioCompra, fechaVencimiento, imagenProducto } = req.body;

    const productFields = {};
    if (Nombre) productFields.Nombre = Nombre;
    if (Marca) productFields.Marca = Marca;
    if (Stock) productFields.Stock = Stock;
    if (Categoria) productFields.Categoria = Categoria;
    if (precioVenta) productFields.precioVenta = precioVenta;
    if (precioCompra) productFields.precioCompra = precioCompra;
    if (fechaVencimiento) productFields.fechaVencimiento = fechaVencimiento;

    let product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ msg: 'Product not found' });

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productFields },
      { new: true }
    );

    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Elinminar un producto
export const deleteProduct = async (req, res) => {
  try {
    const { value, error } = idProductSchema.validate(req.params, { convert: false });
    if (error) {
      console.log('Validation error details:', error.details);
      return res.status(400).json(error.message);
    }
    const product = await Product.findByIdAndDelete(value.id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
};
