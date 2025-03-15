import Product from '../models/products.model.js';
import Venta from '../models/venta.model.js';
import { productSchema, idProductSchema } from '../schema/products.schema.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';
import { HOST, PORT } from '../config/configEnv.js';

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
    const { value, error } = productSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    console.log("Archivo recibido:", req.file); // Depuración

    let imageUrl = null;

    // Verifica si hay un archivo subido
    if (req.file) {
        imageUrl = `http://${process.env.HOST}:${process.env.PORT}/api/src/upload/${req.file.filename}`;
    }

    // Crear el producto con la imagen incluida
    const newProduct = new Product({ ...value, image: imageUrl });
    console.log("Nuevo producto:", newProduct);

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

export const scanProducts = async (req, res) => {
  try {
    const { codigoBarras } = req.body;

    if (!codigoBarras) return handleErrorClient(res, 400, "Código de barras es requerido");

    // Buscar en la base de datos el producto con el código de barras
    const product = await Product.findOne({ codigoBarras });

    if (!product) return handleErrorClient(res, 404, "Producto no encontrado");

    // Responder con los datos del producto encontrado
    handleSuccess(res, 200, "Producto escaneado exitosamente", {
      codigoBarras: product.codigoBarras,
      nombre: product.Nombre,
      marca: product.Marca,
      stock: product.Stock,
      categoria: product.Categoria,
      precioVenta: product.PrecioVenta,
      precioCompra: product.PrecioCompra,
      fechaVencimiento: product.fechaVencimiento
    });

  } catch (err) {
    handleErrorServer(res, 500, "Error al escanear producto", err.message);
  }
};

export const actualizarStockVenta = async (req, res) => {
  try {
    const { productosVendidos } = req.body; // Recibimos los productos vendidos con código y cantidad

    if (!productosVendidos || !Array.isArray(productosVendidos) || productosVendidos.length === 0) {
      return handleErrorClient(res, 400, "Lista de productos vendidos inválida");
    }

    // Usamos `bulkWrite` para hacer múltiples actualizaciones de stock en una sola operación
    const operaciones = productosVendidos.map(({ codigoBarras, cantidad }) => ({
      updateOne: {
        filter: { codigoBarras },
        update: { $inc: { Stock: -cantidad } }, // 🔹 Resta la cantidad vendida del stock
      }
    }));

    const resultado = await Product.bulkWrite(operaciones);

    if (resultado.modifiedCount === 0) {
      return handleErrorClient(res, 400, "No se pudo actualizar el stock de los productos");
    }

    handleSuccess(res, 200, "Stock actualizado después de la venta", resultado);
  } catch (err) {
    handleErrorServer(res, 500, "Error al actualizar stock", err.message);
  }
};

export const registrarVenta = async (req, res) => {
  try {
    const { productosVendidos } = req.body;

    if (!productosVendidos || !Array.isArray(productosVendidos) || productosVendidos.length === 0) {
      console.error("❌ Error: Lista de productos vendidos es inválida o vacía.");
      return handleErrorClient(res, 400, "Lista de productos vendidos inválida");
    }

    console.log("🛒 Recibiendo productos vendidos:", productosVendidos);

    // ✅ Crear un registro de ventas en la base de datos
    const ventas = productosVendidos.map(({ codigoBarras, nombre, cantidad, categoria, precioVenta, precioCompra }) => ({
      codigoBarras,
      nombre,
      cantidad,
      categoria,
      precioVenta,
      precioCompra,
      fecha: new Date(),
    }));

    console.log("📦 Registrando ventas en la base de datos:", ventas);

    // ✅ Guardar las ventas en la base de datos
    await Venta.insertMany(ventas); // ✅ Aquí cambiamos `Ventas` por `Venta`

    handleSuccess(res, 201, "Venta registrada correctamente", ventas);
  } catch (err) {
    console.error("❌ Error en registrarVenta:", err);
    handleErrorServer(res, 500, "Error al registrar la venta", err.message);
  }
};

// ✅ Obtener todas las ventas para estadísticas
export const obtenerVentas = async (req, res) => {
  try {
      const ventas = await Venta.find();
      handleSuccess(res, 200, "Historial de ventas obtenido correctamente", ventas);
  } catch (error) {
      handleErrorServer(res, 500, "Error al obtener las ventas", error.message);
  }
};

