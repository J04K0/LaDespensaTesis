import Product from '../models/products.model.js';
import Venta from '../models/venta.model.js';
import { productSchema, idProductSchema } from '../schema/products.schema.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';
import cron from 'node-cron';
let ticketCounter = 0; // Variable global para el contador de tickets
import { HOST, PORT } from '../config/configEnv.js';
import { sendLowStockAlert, sendExpirationAlert } from '../services/email.service.js';
import { 
  emitStockBajoAlert, 
  emitProductoVencidoAlert, 
  emitProductoPorVencerAlert 
} from '../services/alert.service.js';

export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const products = await Product.find()
      .collation({ locale: 'es', strength: 2 }) // Ordenación insensible a mayúsculas/minúsculas
      .sort({ Nombre: 1 }) 
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
    
    let imageUrl = null;

    if (req.file) {
        imageUrl = `http://${process.env.HOST}:${process.env.PORT}/api/src/upload/${req.file.filename}`;
    }

    // Obtener los márgenes por categoría (mismos valores que en el modelo)
    const margenesPorCategoria = {
      'Congelados': 0.25,
      'Carnes': 0.20,
      'Despensa': 0.20,
      'Panaderia y Pasteleria': 0.25,
      'Quesos y Fiambres': 0.25,
      'Bebidas y Licores': 0.33,
      'Lacteos, Huevos y otros': 0.20,
      'Desayuno y Dulces': 0.30,
      'Bebes y Niños': 0.28,
      'Cigarros y Tabacos': 0.40,
      'Cuidado Personal': 0.28,
      'Limpieza y Hogar': 0.28,
      'Mascotas': 0.28,
      'Remedios': 0.15,
      'Otros': 0.23
    };

    // Calcular el precio recomendado según la categoría
    const margen = margenesPorCategoria[value.Categoria] || 0.23;
    const precioRecomendado = value.PrecioCompra * (1 + margen);

    // Crear el producto con la imagen incluida y el precio recomendado
    const newProduct = new Product({ 
      ...value, 
      image: imageUrl,
      PrecioRecomendado: precioRecomendado 
    });

    const product = await newProduct.save();

    handleSuccess(res, 201, 'Producto creado', product);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al crear un producto', err.message);
  }
};

export const updateProduct = async (req, res) => { 
  try {
    const { value, error } = productSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    let imageUrl = product.image; // Mantiene la imagen anterior por defecto

    // Verifica si hay un archivo subido y actualiza la imagen
    if (req.file) {
      imageUrl = `http://${HOST}:${PORT}/api/src/upload/${req.file.filename}`;
    }

    // Verifica si los precios han cambiado
    if (value.PrecioVenta !== product.PrecioVenta || value.PrecioCompra !== product.PrecioCompra) {
      // Guarda el precio anterior en el historial
      product.historialPrecios.push({
        precioVenta: product.PrecioVenta,
        precioCompra: product.PrecioCompra,
        fecha: new Date()
      });
    }

    // Obtener los márgenes por categoría (mismos valores que en el modelo)
    const margenesPorCategoria = {
      'Congelados': 0.25,
      'Carnes': 0.20,
      'Despensa': 0.20,
      'Panaderia y Pasteleria': 0.25,
      'Quesos y Fiambres': 0.25,
      'Bebidas y Licores': 0.33,
      'Lacteos, Huevos y otros': 0.20,
      'Desayuno y Dulces': 0.30,
      'Bebes y Niños': 0.28,
      'Cigarros y Tabacos': 0.40,
      'Cuidado Personal': 0.28,
      'Limpieza y Hogar': 0.28,
      'Mascotas': 0.28,
      'Remedios': 0.15,
      'Otros': 0.23
    };

    // Calcular el precio recomendado según la categoría
    const margen = margenesPorCategoria[value.Categoria] || 0.23;
    const precioRecomendado = value.PrecioCompra * (1 + margen);

    // Actualizar los datos del producto
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      { 
        ...value, 
        image: imageUrl,
        historialPrecios: product.historialPrecios,
        PrecioRecomendado: precioRecomendado
      }, 
      { new: true, runValidators: true }
    );

    handleSuccess(res, 200, 'Producto actualizado', updatedProduct);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al actualizar el producto', err.message);
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
  'Cigarros': 5,
  'Cuidado Personal': 8,
  'Remedios': 3,
  'Limpieza y Hogar': 5,
  'Mascotas': 5,
  'Otros': 5
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
      return producto.Stock <= stockMinimo;
    });

    if (productosFiltrados.length > 0) {
      try {
        // Usar el nuevo servicio de email en lugar de WhatsApp
        await sendLowStockAlert(productosFiltrados);
        // Emitir alerta por WebSocket
        emitStockBajoAlert(productosFiltrados);
      } catch (emailError) {
        console.error("Error al enviar alerta por correo electrónico:", emailError);
        // Continuar con la ejecución aunque falle el envío de correo
      }
      
      return handleSuccess(res, 200, 'Productos con poco stock', productosFiltrados);
    }

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

    if (productsExpiringSoon.length > 0) {
      try {
        await sendExpirationAlert(productsExpiringSoon, 'porVencer');
        // Emitir alerta por WebSocket
        emitProductoPorVencerAlert(productsExpiringSoon);
      } catch (emailError) {
        console.error("Error al enviar alerta de productos por vencer:", emailError);
      }
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

    // Enviar alerta por correo de productos vencidos
    try {
      await sendExpirationAlert(expiredProducts, 'vencidos');
      // Emitir alerta por WebSocket
      emitProductoVencidoAlert(expiredProducts);
    } catch (emailError) {
      console.error("Error al enviar alerta de productos vencidos:", emailError);
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

    // Verificar si el producto está vencido pero permitir continuar
    const today = new Date();
    const isExpired = new Date(product.fechaVencimiento) < today;

    handleSuccess(res, 200, isExpired ? "Producto vencido, verifique antes de vender" : "Producto escaneado exitosamente", {
      image: product.image,
      codigoBarras: product.codigoBarras,
      nombre: product.Nombre,
      marca: product.Marca,
      stock: product.Stock,
      categoria: product.Categoria,
      precioVenta: product.PrecioVenta,
      precioCompra: product.PrecioCompra,
      precioRecomendado: product.PrecioRecomendado,
      fechaVencimiento: product.fechaVencimiento,
      isExpired: isExpired // Agregar un flag para indicar si está vencido
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

    // Array para almacenar productos que llegaron a stock mínimo en esta venta
    const productosAfectadosEnVenta = [];
    // Array para almacenar productos que se agotaron en esta venta
    const productosAgotados = [];
    // Array para almacenar productos vencidos que se vendieron
    const productosVencidosVendidos = [];
    const codigosBarrasVendidos = new Set();
    const today = new Date();

    for (const { codigoBarras, cantidad } of productosVendidos) {
      let cantidadRestante = cantidad;
      codigosBarrasVendidos.add(codigoBarras);

      // Obtener todos los productos con el mismo código de barras, ordenados por fecha de vencimiento
      const productos = await Product.find({ 
        codigoBarras, 
        Stock: { $gt: 0 }
      }).sort({ fechaVencimiento: 1 });

      if (!productos.length) {
        return handleErrorClient(res, 400, `No hay stock disponible para el producto ${codigoBarras}`);
      }

      // Verificar si hay productos vencidos y guardarlos para notificar pero permitir la venta
      const productoVencido = productos.find(p => new Date(p.fechaVencimiento) < today);
      if (productoVencido) {
        productosVencidosVendidos.push({
          ...productoVencido.toObject(),
          cantidadVendida: cantidad
        });
      }

      // Resta la cantidad vendida de cada lote hasta que se complete la venta
      for (const producto of productos) {
        if (cantidadRestante <= 0) break;

        // Guardar el stock anterior para comparar después
        const stockAnterior = producto.Stock;

        if (producto.Stock >= cantidadRestante) {
          producto.Stock -= cantidadRestante;
          cantidadRestante = 0;
        } else {
          cantidadRestante -= producto.Stock;
          producto.Stock = 0;
        }

        await producto.save(); // Guardar cambios en la base de datos
        
        // Si el stock anterior estaba bien pero ahora es bajo, añadir a productos afectados
        const stockMinimo = stockMinimoPorCategoria[producto.Categoria];
        if (stockMinimo && stockAnterior > stockMinimo && producto.Stock <= stockMinimo && producto.Stock > 0) {
          productosAfectadosEnVenta.push(producto);
        }
        
        // Si el producto se agotó completamente en esta venta
        if (stockAnterior > 0 && producto.Stock === 0) {
          productosAgotados.push(producto);
        }
      }

      if (cantidadRestante > 0) {
        return handleErrorClient(res, 400, `No hay suficiente stock para el producto ${codigoBarras}`);
      }
    }

    // Buscar TODOS los productos, incluyendo los que tienen stock = 0
    const todosProductos = await Product.find();
    
    // Filtrar los que tienen stock bajo pero no están agotados
    const todosProductosBajoStock = todosProductos.filter(producto => {
      const stockMinimo = stockMinimoPorCategoria[producto.Categoria];
      if (!stockMinimo) return false;
      return producto.Stock <= stockMinimo && producto.Stock > 0;
    });

    // Productos que YA estaban agotados (stock = 0) ANTES de esta venta
    const productosYaAgotados = todosProductos.filter(producto => {
      return producto.Stock === 0 && 
        !productosAgotados.some(p => p._id.toString() === producto._id.toString());
    });

    // Resaltar los productos recién afectados y los agotados
    const productosEmailInfo = [
      ...todosProductosBajoStock.map(producto => ({
        ...producto.toObject(),
        esRecienAfectado: productosAfectadosEnVenta.some(p => p._id.toString() === producto._id.toString()),
        esAgotado: false,
        esYaAgotado: false
      })),
      ...productosAgotados.map(producto => ({
        ...producto.toObject(),
        esRecienAfectado: false,
        esAgotado: true,
        esYaAgotado: false
      })),
      ...productosYaAgotados.map(producto => ({
        ...producto.toObject(),
        esRecienAfectado: false,
        esAgotado: false,
        esYaAgotado: true
      }))
    ];

    // Buscar productos vencidos
    const productosVencidos = await Product.find({
      fechaVencimiento: { $lt: today }
    });
    
    // Cuando se detecten productos con stock bajo:
    if (productosEmailInfo.length > 0 || productosVencidos.length > 0) {
      try {
        // Enviar correo automático directo (como antes)
        await sendLowStockAlert(
          productosEmailInfo,
          productosAfectadosEnVenta.length > 0,
          productosAgotados.length > 0,
          productosYaAgotados.length > 0,
          productosVencidos
        );

        // Emitir alertas por WebSocket si es necesario
        if (productosAfectadosEnVenta.length > 0) {
          emitStockBajoAlert(productosAfectadosEnVenta);
        }
        if (productosAgotados.length > 0) {
          emitStockBajoAlert(productosAgotados);
        }
        if (productosYaAgotados.length > 0) {
          emitStockBajoAlert(productosYaAgotados);
        }
        if (productosVencidos.length > 0) {
          emitProductoVencidoAlert(productosVencidos);
        }
      } catch (emailError) {
        console.error("Error al enviar alerta:", emailError);
      }
    }

    // Añadir mensaje de advertencia si se vendieron productos vencidos
    let mensaje = "Stock actualizado correctamente";
    if (productosVencidosVendidos.length > 0) {
      mensaje += ". ADVERTENCIA: Se han vendido productos vencidos";
    }

    handleSuccess(res, 200, mensaje, { productosVencidosVendidos: productosVencidosVendidos.length > 0 ? productosVencidosVendidos : null });
  } catch (err) {
    handleErrorServer(res, 500, "Error al actualizar stock", err.message);
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

    // Verificar si el producto está vencido pero permitir continuar
    const today = new Date();
    const isExpired = new Date(producto.fechaVencimiento) < today;

    handleSuccess(res, 200, isExpired ? "Producto vencido, verifique antes de vender" : "Producto escaneado exitosamente", {
      image: producto.image,
      codigoBarras: producto.codigoBarras,
      nombre: producto.Nombre,
      marca: producto.Marca,
      stock: producto.Stock,
      categoria: producto.Categoria,
      precioVenta: producto.PrecioVenta,
      precioCompra: producto.PrecioCompra,
      precioRecomendado: producto.PrecioRecomendado,
      fechaVencimiento: producto.fechaVencimiento,
      isExpired: isExpired // Agregar un flag para indicar si está vencido
    });

  } catch (err) {
    handleErrorServer(res, 500, "Error al escanear producto", err.message);
  }
};

export const getProductForCreation = async (req, res) => {
  try {
    const codigoBarras = req.params.codigoBarras || req.query.codigoBarras;

    if (!codigoBarras) return handleErrorClient(res, 400, "Código de barras es requerido");

    const producto = await Product.findOne({ codigoBarras: String(codigoBarras) });

    if (!producto) return handleErrorClient(res, 404, "Producto no encontrado");

    handleSuccess(res, 200, "Producto encontrado", {
      image: producto.image,
      codigoBarras: producto.codigoBarras,
      nombre: producto.Nombre,
      marca: producto.Marca,
      stock: producto.Stock,
      categoria: producto.Categoria,
      precioVenta: producto.PrecioVenta,
      precioCompra: producto.PrecioCompra,
      precioRecomendado: producto.PrecioRecomendado,
      fechaVencimiento: producto.fechaVencimiento
    });
  } catch (err) {
    handleErrorServer(res, 500, "Error al obtener producto", err.message);
  }
};

export const eliminarProductosSinStock = async () => {
  try {
    // Add a timeout to prevent deleting products that were just sold
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    // Only delete products that have been at 0 stock for at least 5 minutes
    const productosSinStock = await Product.find({ 
      Stock: 0,
      updatedAt: { $lt: fiveMinutesAgo }
    });

    for (const producto of productosSinStock) {
      // Check if another product with the same barcode exists with stock
      const existeOtroProducto = await Product.findOne({
        codigoBarras: producto.codigoBarras,
        Stock: { $gt: 0 }
      });

      if (existeOtroProducto) {
        // If another product with the same barcode has stock, delete this one
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

export const getProductPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    // Ordenar el historial por fecha, del más reciente al más antiguo
    const historialOrdenado = product.historialPrecios.sort((a, b) => b.fecha - a.fecha);

    // Crear respuesta con información actual e historial
    const respuesta = {
      productoActual: {
        nombre: product.Nombre,
        precioVentaActual: product.PrecioVenta,
        precioCompraActual: product.PrecioCompra,
        precioRecomendadoActual: product.PrecioRecomendado,
        ultimaActualizacion: product.updatedAt
      },
      historialPrecios: historialOrdenado
    };

    handleSuccess(res, 200, 'Historial de precios encontrado', respuesta);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener el historial de precios', err.message);
  }
};

