import Product from '../models/products.model.js';
import Venta from '../models/venta.model.js';
import { productSchema, idProductSchema } from '../schema/products.schema.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';

let ticketCounter = 0; // Variable global para el contador de tickets

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

export const scanProducts = async (req, res) => {
  try {
    const { codigoBarras } = req.body;

    if (!codigoBarras) return handleErrorClient(res, 400, "Código de barras es requerido");

    // Buscar el producto con stock disponible y fecha de vencimiento más próxima
    const product = await Product.findOne({
      codigoBarras,
      Stock: { $gt: 0 } // Filtra solo productos con stock disponible
    }).sort({ fechaVencimiento: 1 }); // Ordena para obtener el más próximo a vencer

    if (!product) return handleErrorClient(res, 404, "Producto no encontrado o sin stock disponible");

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
    const { productosVendidos } = req.body;

    if (!productosVendidos || !Array.isArray(productosVendidos) || productosVendidos.length === 0) {
      return handleErrorClient(res, 400, "Lista de productos vendidos inválida");
    }

    for (const { codigoBarras, cantidad } of productosVendidos) {
      let cantidadRestante = cantidad;

      // Obtener todos los productos con el mismo código de barras, ordenados por fecha de vencimiento
      const productos = await Product.find({ 
        codigoBarras, 
        Stock: { $gt: 0 }
      }).sort({ fechaVencimiento: 1 });

      if (!productos.length) {
        return handleErrorClient(res, 400, `No hay stock disponible para el producto ${codigoBarras}`);
      }

      // Resta la cantidad vendida de cada lote hasta que se complete la venta
      for (const producto of productos) {
        if (cantidadRestante <= 0) break;

        if (producto.Stock >= cantidadRestante) {
          producto.Stock -= cantidadRestante;
          cantidadRestante = 0;
        } else {
          cantidadRestante -= producto.Stock;
          producto.Stock = 0;
        }

        await producto.save(); // Guardar cambios en la base de datos
      }

      if (cantidadRestante > 0) {
        return handleErrorClient(res, 400, `No hay suficiente stock para el producto ${codigoBarras}`);
      }
    }

    handleSuccess(res, 200, "Stock actualizado correctamente");
  } catch (err) {
    handleErrorServer(res, 500, "Error al actualizar stock", err.message);
  }
};

export const registrarVenta = async (req, res) => {
  try {
    const { productosVendidos } = req.body;

    if (!productosVendidos || !Array.isArray(productosVendidos) || productosVendidos.length === 0) {
      return handleErrorClient(res, 400, "Lista de productos vendidos inválida");
    }

    // Obtener el siguiente número de ticket
    ticketCounter += 1;
    const ticketId = ticketCounter;

    // Asignar el ticketId a cada producto vendido
    const ventas = productosVendidos.map((producto) => ({
      ticketId,
      ...producto,
      fecha: new Date(),
    }));

    // Guardar todas las ventas asociadas a un mismo ticket
    await Venta.insertMany(ventas);

    handleSuccess(res, 201, "Venta registrada correctamente", { ticketId, ventas });
  } catch (err) {
    console.error("❌ Error en registrarVenta:", err);
    handleErrorServer(res, 500, "Error al registrar la venta", err.message);
  }
};

export const obtenerVentasPorTicket = async (req, res) => {
  try {
    const ventasPorTicket = await Venta.aggregate([
      { $group: { _id: "$ticketId", ventas: { $push: "$$ROOT" }, fecha: { $first: "$fecha" } } },
      { $sort: { fecha: -1 } } // Ordenar por fecha descendente
    ]);

    handleSuccess(res, 200, "Historial de ventas por ticket obtenido correctamente", ventasPorTicket);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener las ventas por ticket", error.message);
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

export const getProductByBarcode = async (req, res) => {
  try {
    const codigoBarras = req.params.codigoBarras || req.query.codigoBarras;

    if (!codigoBarras) return handleErrorClient(res, 400, "Código de barras es requerido");

    // Buscar todos los productos con el código de barras, ordenados por fecha de vencimiento
    const productos = await Product.find({ codigoBarras: String(codigoBarras), Stock: { $gt: 0 } })
      .sort({ fechaVencimiento: 1 }); // Ordenar por fecha de vencimiento (el más antiguo primero)

    if (!productos.length) return handleErrorClient(res, 404, "No hay stock disponible para este producto");

    // Seleccionar el producto con el stock más antiguo disponible
    const producto = productos[0];

    handleSuccess(res, 200, "Producto escaneado exitosamente", {
      codigoBarras: producto.codigoBarras,
      nombre: producto.Nombre,
      marca: producto.Marca,
      stock: producto.Stock,
      categoria: producto.Categoria,
      precioVenta: producto.PrecioVenta,
      precioCompra: producto.PrecioCompra,
      fechaVencimiento: producto.fechaVencimiento
    });

  } catch (err) {
    handleErrorServer(res, 500, "Error al escanear producto", err.message);
  }
};

export const eliminarProductosSinStock = async () => {
  try {

    // Buscar todos los productos que tienen stock 0
    const productosSinStock = await Product.find({ Stock: 0 });

    for (const producto of productosSinStock) {
      // Buscar si existe otro producto con el mismo código de barras pero con stock disponible
      const existeOtroProducto = await Product.findOne({
        codigoBarras: producto.codigoBarras,
        Stock: { $gt: 0 }
      });

      if (existeOtroProducto) {
        // Si hay otro producto con el mismo código de barras, eliminar este producto
        await Product.findByIdAndDelete(producto._id);
      }
    }
  } catch (error) {
    console.error("❌ Error al eliminar productos sin stock:", error);
  }
};

cron.schedule('0 */5 * * *', async () => {
  await eliminarProductosSinStock();
});