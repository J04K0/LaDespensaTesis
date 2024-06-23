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
    const url = 'http://localhost:5000/src/uploads';

    const newProduct = new Product({
      Nombre: req.body.Nombre,
      Marca: req.body.Marca,
      Stock: req.body.Stock,
      Categoria: req.body.Categoria,
      precioVenta: req.body.precioVenta,
      precioCompra: req.body.precioCompra,
      fechaVencimiento: req.body.fechaVencimiento,
      imagenProducto: `${url}/${req.file.filename}`,
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
    const { Nombre, Marca, Stock, Categoria, precioVenta, precioCompra, fechaVencimiento, imagenProducto } = req.body;

    const productFields = {};
    if (Nombre) productFields.Nombre = Nombre;
    if (Marca) productFields.Marca = Marca;
    if (Stock) productFields.Stock = Stock;
    if (Categoria) productFields.Categoria = Categoria;
    if (precioVenta) productFields.precioVenta = precioVenta;
    if (precioCompra) productFields.precioCompra = precioCompra;
    if (fechaVencimiento) productFields.fechaVencimiento = fechaVencimiento;
    if (imagenProducto) productFields.imagenProducto = imagenProducto;

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
    res.status(500).send('Server Error');
  }
};

export {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};
