import Product from '../models/products.model.js';
import { productSchema, idProductSchema } from '../schema/products.schema.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';

export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const products = await Product.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Product.countDocuments();

    if (products.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    handleSuccess(res, 200, 'Productos encontrados', {
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer los productos', err.message);
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id); // ! validar id con joi

    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    handleSuccess(res, 200, 'Producto encontrado', product);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer un producto', err.message);
  }
};

export const addProduct = async (req, res) => {
  try {
    const { value, error } = productSchema.validate(req.body)
    if (error) return handleErrorClient(res, 400, error.message);

    const newProduct = new Product(value);

    const product = await newProduct.save();

    handleSuccess(res, 201, 'Producto creado', product);

  } catch (err) {
    handleErrorServer(res, 500, 'Error al crear un producto', err.message);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { value: validatedId, error: errorId } = idProductSchema.validate({ id });
    if (errorId) return handleErrorClient(res, 400, errorId.message);

    const { value, error } = productSchema.validate(req.body, { abortEarly: false });
    if (error) return handleErrorClient(res, 400, error.message);

    const product = await Product.findByIdAndUpdate(validatedId.id, value, { new: true });
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    handleSuccess(res, 200, 'Producto modificado', product);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al modificar el producto', err.message);
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { value, error } = idProductSchema.validate({ id }, { convert: false });

    if (error) return handleErrorClient(res, 400, error.message);

    const product = await Product.findByIdAndDelete(value.id);

    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    handleSuccess(res, 200, 'Producto eliminado', product);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al eliminar un producto', err.message);
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoria } = req.params; // ! validar categoria con joi

    if (!categoria) return handleErrorClient(res, 400, 'Categoría es requerida');

    const products = await Product.find({ Categoria: categoria });

    if (products.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    handleSuccess(res, 200, 'Productos encontrados', products);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer los productos', err.message);
  }
};

const stockMinimoPorCategoria = {
  'Congelados': 10,
  'Carnes': 5,
  'Despensa': 8,
  'Panaderia y Pasteleria': 10,
  'Quesos y Fiambres': 5,
  'Bebidas y Licores': 5,
  'Lacteos, Huevos y Refrigerados': 10,
  'Desayuno y Dulces': 10,
  'Bebes y Niños': 10,
  'Cigarros': 5
};

export const verificarStock = async (req, res) => {
  try {
    const productosConPocoStock = await Product.find();

    if (productosConPocoStock.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    const productosFiltrados = productosConPocoStock.filter(producto => {
      const categoria = producto.Categoria;
      if (!categoria) {
        console.warn(`Producto sin categoría definida: ${JSON.stringify(producto)}`);
        return false;
      }

      const stockMinimo = stockMinimoPorCategoria[categoria];
      if (stockMinimo === undefined) {
        console.warn(`Categoría no definida en stockMinimoPorCategoria: ${categoria}`);
        return false;
      }
      return producto.Stock < stockMinimo;
    });

    if (productosFiltrados.length > 0) return handleSuccess(res, 200, 'Productos con poco stock', productosFiltrados);

    handleErrorClient(res, 404, 'No hay productos con poco stock');
  } catch (error) {
    handleErrorServer(res, 500, 'Error al verificar el stock', error.message);
  }
};

export const getProductsExpiringSoon = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 5);

    const productsExpiringSoon = await Product.find({
      fechaVencimiento: {
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    });

    if (productsExpiringSoon.length === 0) {
      return handleErrorClient(res, 404, 'No hay productos próximos a caducar');
    }

    handleSuccess(res, 200, 'Productos próximos a caducar', productsExpiringSoon);
  } catch (error) {
    handleErrorServer(res, 500, 'Error al obtener los productos próximos a caducar', error.message);
  }
};

export const getExpiredProducts = async (req, res) => {
  try {
    const today = new Date();

    const expiredProducts = await Product.find({
      fechaVencimiento: {
        $lt: today
      }
    });

    if (expiredProducts.length === 0) {
      return handleErrorClient(res, 404, 'No hay productos vencidos');
    }

    handleSuccess(res, 200, 'Productos vencidos', expiredProducts);
  } catch (error) {
    handleErrorServer(res, 500, 'Error al obtener los productos vencidos', error.message);
  }
};