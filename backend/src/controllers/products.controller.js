import Product from '../models/products.model.js';

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
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

// Add a new product
const addProduct = async (req, res) => {
  try {
    const newProduct = new Product({
      nombre: req.body.nombre,
      valorVenta: req.body.valorVenta,
      valorCompra: req.body.valorCompra,
      stock: req.body.stock,
      fechaVencimiento: req.body.fechaVencimiento,
    });

    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update an existing product
const updateProduct = async (req, res) => {
  try {
    const { nombre, valorVenta, valorCompra, stock, fechaVencimiento } = req.body;

    const productFields = {};
    if (nombre) productFields.nombre = nombre;
    if (valorVenta) productFields.valorVenta = valorVenta;
    if (valorCompra) productFields.valorCompra = valorCompra;
    if (stock) productFields.stock = stock;
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

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    await Product.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
  }
};

export {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};
