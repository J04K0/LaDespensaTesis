import Product from '../models/products.model.js';
import Venta from '../models/venta.model.js';
import { productSchema, idProductSchema } from '../schema/products.schema.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';
import cron from 'node-cron';
import { HOST, PORT } from '../config/configEnv.js';
import { sendLowStockAlert, sendExpirationAlert } from '../services/email.service.js';
import { 
  emitStockBajoAlert, 
  emitProductoVencidoAlert, 
  emitProductoPorVencerAlert 
} from '../services/alert.service.js';
import { STOCK_MINIMO_POR_CATEGORIA, MARGENES_POR_CATEGORIA } from '../constants/products.constants.js';

// Funcion para traer todos los productos con paginación
// y ordenados por nombre, y opcionalmente incluir productos eliminados
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 5, incluirEliminados = false } = req.query;
    
    // Filtrar productos eliminados por defecto
    const filter = incluirEliminados === 'true' ? {} : { eliminado: { $ne: true } };
    
    const products = await Product.find(filter)
      .collation({ locale: 'es', strength: 2 }) 
      .sort({ Nombre: 1 }) 
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Product.countDocuments(filter);

    if (products.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    handleSuccess(res, 200, 'Productos encontrados', {
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count, // 🆕 AGREGADO: Total exacto de productos
      limit: parseInt(limit)
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer los productos', err.message);
  }
};

// Funcion para traer un producto por ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id); // ! validar id con joi

    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    handleSuccess(res, 200, 'Producto encontrado', product);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer un producto', err.message);
  }
};

// Función para agregar un producto
export const addProduct = async (req, res) => {
  try {
    console.log('🔍 DEBUGGING - Datos recibidos en addProduct:');
    console.log('📋 req.body:', JSON.stringify(req.body, null, 2));
    console.log('📁 req.file:', req.file ? { 
      fieldname: req.file.fieldname, 
      originalname: req.file.originalname, 
      size: req.file.size 
    } : 'No file');

    const productData = req.body;
    
    const { error, value } = productSchema.validate(productData);
    
    if (error) {
      console.error('❌ ERROR DE VALIDACIÓN:', error.details);
      console.error('❌ Mensaje de error:', error.details[0].message);
      console.error('❌ Campo que falló:', error.details[0].path);
      console.error('❌ Valor recibido:', error.details[0].context?.value);
      return handleErrorClient(res, 400, `Error de validación: ${error.details[0].message}`);
    }
        
    let imageUrl = null;

    if (req.file) {
      imageUrl = `http://${process.env.HOST}:${process.env.PORT}/api/src/upload/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }
    const margen = MARGENES_POR_CATEGORIA[value.Categoria] || 0.23;
    const precioRecomendado = value.PrecioCompra * (1 + margen);

    const loteInicial = {
      numeroLote: '#001', // Primer lote siempre será #001
      cantidad: parseInt(value.Stock),
      precioCompra: parseFloat(value.PrecioCompra),
      precioVenta: parseFloat(value.PrecioVenta),
      fechaVencimiento: new Date(value.fechaVencimiento),
      usuarioCreacion: req.userId,
      fechaCreacion: new Date(),
      activo: true
    };

    const newProduct = new Product({ 
      ...value, 
      image: imageUrl,
      PrecioRecomendado: precioRecomendado,
      lotes: [loteInicial]
    });

    const product = await newProduct.save();

    product.historialStock.push({
      stockAnterior: 0,
      stockNuevo: product.Stock,
      tipoMovimiento: 'entrada_inicial',
      motivo: `Producto creado con lote inicial: #001 (${value.Stock} unidades)`,
      usuario: req.userId,
      fecha: new Date()
    });

    await product.save();

    console.log('✅ Producto creado exitosamente con lote inicial:', {
      producto: product.Nombre,
      stock: product.Stock,
      lotes: product.lotes.length,
      primerLote: product.lotes[0].numeroLote
    });
    
    handleSuccess(res, 201, 'Producto creado', product);
  } catch (err) {
    console.error('❌ ERROR EN SERVIDOR:', err);
    handleErrorServer(res, 500, 'Error al crear un producto', err.message);
  }
};

// Funcion para actualizar un producto
export const updateProduct = async (req, res) => { 
  try {
    const { value, error } = productSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    // 🆕 NUEVO: Limpiar historial de stock corrupto antes de proceder
    if (product.historialStock && product.historialStock.length > 0) {
      const tiposValidos = ['ajuste_manual', 'venta', 'devolucion', 'perdida', 'entrada_inicial', 'correccion'];
      let hasCorruptedData = false;

      product.historialStock.forEach((entry, index) => {
        if (!tiposValidos.includes(entry.tipoMovimiento)) {
          console.log(`🔧 Corrigiendo tipoMovimiento inválido: "${entry.tipoMovimiento}" -> "entrada_inicial"`);
          entry.tipoMovimiento = 'entrada_inicial';
          hasCorruptedData = true;
        }
      });

      // Si encontramos datos corruptos, guardar las correcciones
      if (hasCorruptedData) {
        await product.save();
        console.log(`✅ Historial de stock corregido para producto: ${product.Nombre}`);
      }
    }

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

    // Verificar si hay cambios en el stock y registrarlos
    if (value.Stock !== product.Stock) {
      const { motivo, tipoMovimiento } = req.body;
      
      // Validar y establecer un tipoMovimiento válido
      const tiposValidos = ['ajuste_manual', 'venta', 'devolucion', 'perdida', 'entrada_inicial', 'correccion'];
      let tipoMovimientoFinal = 'ajuste_manual'; // Valor por defecto
      
      if (tipoMovimiento && tiposValidos.includes(tipoMovimiento)) {
        tipoMovimientoFinal = tipoMovimiento;
      } else {
        // Si no se proporciona un tipo válido, determinar automáticamente
        if (value.Stock > product.Stock) {
          tipoMovimientoFinal = 'entrada_inicial'; // Aumento de stock
        } else {
          tipoMovimientoFinal = 'ajuste_manual'; // Disminución o ajuste
        }
      }
      
      // Solo requerir motivo para ajustes manuales, no para entrada inicial
      if (!motivo && tipoMovimientoFinal === 'ajuste_manual') {
        return handleErrorClient(res, 400, 'Se requiere un motivo para cambiar el stock manualmente');
      }

      // Definir un motivo automático para entrada inicial si no se proporciona
      const motivoFinal = motivo || (tipoMovimientoFinal === 'entrada_inicial' ? 'Agregado de stock desde sistema de inventario' : 'Ajuste manual');

      // Registrar el cambio en el historial de stock
      product.historialStock.push({
        stockAnterior: product.Stock,
        stockNuevo: value.Stock,
        tipoMovimiento: tipoMovimientoFinal,
        motivo: motivoFinal,
        usuario: req.userId,
        fecha: new Date()
      });
    }

    // Calcular el precio recomendado según la categoría usando constantes centralizadas
    const margen = MARGENES_POR_CATEGORIA[value.Categoria] || 0.23;
    const precioRecomendado = value.PrecioCompra * (1 + margen);

    // Actualizar los datos del producto
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      { 
        ...value, 
        image: imageUrl,
        historialPrecios: product.historialPrecios,
        historialStock: product.historialStock,
        PrecioRecomendado: precioRecomendado
      }, 
      { new: true, runValidators: true }
    );

    handleSuccess(res, 200, 'Producto actualizado', updatedProduct);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al actualizar el producto', err.message);
  }
};

// Funcion para desactivar un producto
export const disableProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoEliminacion, comentarioEliminacion } = req.body;

    const { value, error } = idProductSchema.validate({ id }, { convert: false });
    if (error) return handleErrorClient(res, 400, error.message);

    // Validar que se proporcionen motivo y comentario
    if (!motivoEliminacion || !comentarioEliminacion) {
      return handleErrorClient(res, 400, 'Se requiere motivo y comentario para desactivar el producto');
    }

    // Validar que el motivo sea válido
    const motivosValidos = ['sin_stock_permanente', 'producto_dañado', 'vencido', 'descontinuado', 'error_registro', 'otro'];
    if (!motivosValidos.includes(motivoEliminacion)) {
      return handleErrorClient(res, 400, 'Motivo de desactivación no válido');
    }

    const product = await Product.findById(value.id);
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    // En lugar de eliminar físicamente, marcar como desactivado con auditoría
    const updatedProduct = await Product.findByIdAndUpdate(
      value.id,
      {
        eliminado: true,
        fechaEliminacion: new Date(),
        motivoEliminacion,
        comentarioEliminacion: comentarioEliminacion.trim(),
        usuarioEliminacion: req.userId
      },
      { new: true, runValidators: true }
    );

    handleSuccess(res, 200, 'Producto desactivado con auditoría', {
      producto: updatedProduct,
      mensaje: 'El producto ha sido marcado como desactivado y se conserva el registro para auditoría'
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al desactivar un producto', err.message);
  }
};

// Función para obtener historial de stock de un producto
export const getStockHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('historialStock.usuario', 'username email')
      .populate('usuarioEliminacion', 'username email');

    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    handleSuccess(res, 200, 'Historial de stock obtenido', {
      producto: {
        _id: product._id,
        Nombre: product.Nombre,
        Marca: product.Marca,
        stockActual: product.Stock
      },
      historialStock: product.historialStock,
      eliminado: product.eliminado,
      infoEliminacion: product.eliminado ? {
        fechaEliminacion: product.fechaEliminacion,
        motivoEliminacion: product.motivoEliminacion,
        comentarioEliminacion: product.comentarioEliminacion,
        usuarioEliminacion: product.usuarioEliminacion
      } : null
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener el historial de stock', err.message);
  }
};

// Función para restaurar un producto eliminado (solo para administradores)
export const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarioRestauracion } = req.body;

    if (!comentarioRestauracion) {
      return handleErrorClient(res, 400, 'Se requiere un comentario para restaurar el producto');
    }

    const product = await Product.findById(id);
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    if (!product.eliminado) {
      return handleErrorClient(res, 400, 'El producto no está eliminado');
    }

    // 🔧 CRÍTICO: Marcar para evitar recálculo automático de stock
    // Esto previene que el pre-save hook sobrescriba el stock actual
    product._skipStockRecalculation = true;

    // Registrar la restauración en el historial de stock
    product.historialStock.push({
      stockAnterior: product.Stock,
      stockNuevo: product.Stock,
      tipoMovimiento: 'correccion',
      motivo: `Producto restaurado: ${comentarioRestauracion}`,
      usuario: req.userId,
      fecha: new Date()
    });

    // Restaurar el producto manteniendo el stock actual
    product.eliminado = false;
    product.fechaEliminacion = null;
    product.motivoEliminacion = null;
    product.comentarioEliminacion = null;
    product.usuarioEliminacion = null;

    // Guardar sin recalcular stock automáticamente
    const restoredProduct = await product.save();

    handleSuccess(res, 200, 'Producto restaurado correctamente', restoredProduct);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al restaurar el producto', err.message);
  }
};

// Funcion para obtener productos por categoría
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoria } = req.params; // ! validar categoria con joi

    if (!categoria) return handleErrorClient(res, 400, 'Categoría es requerida');

    // 🔧 CORREGIDO: Excluir productos eliminados
    const products = await Product.find({ 
      Categoria: categoria,
      eliminado: { $ne: true }
    });

    if (products.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    handleSuccess(res, 200, 'Productos encontrados', products);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer los productos', err.message);
  }
};

// Funcion para verificar stock de productos y enviar alertas si es necesario
export const verificarStock = async (req, res) => {
  try {
    // 🔧 CORREGIDO: Excluir productos eliminados
    const productosConPocoStock = await Product.find({ eliminado: { $ne: true } });

    if (productosConPocoStock.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    const productosFiltrados = productosConPocoStock.filter(producto => {
      const categoria = producto.Categoria;
      if (!categoria) {
        console.warn(`Producto sin categoría definida: ${JSON.stringify(producto)}`);
        return false;
      }

      const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[categoria];
      if (stockMinimo === undefined) {
        console.warn(`Categoría no definida en STOCK_MINIMO_POR_CATEGORIA: ${categoria}`);
        return false;
      }
      return producto.Stock <= stockMinimo;
    });

    // ❌ ELIMINAR: Ya no enviar alertas automáticas desde aquí
    // Esta función ahora solo devuelve los datos sin enviar alertas

    // REVISAR ESTO//
    
    if (productosFiltrados.length > 0) {
      return handleSuccess(res, 200, 'Productos con poco stock', productosFiltrados);
    }

    return handleErrorClient(res, 404, 'No hay productos con poco stock');
  } catch (error) {
    handleErrorServer(res, 500, 'Error al verificar el stock', error.message);
  }
};

// Funcion para obtener productos próximos a caducar (5 días)
export const getProductsExpiringSoon = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 5);

    // 🔧 CORREGIDO: Excluir productos eliminados
    const productsExpiringSoon = await Product.find({
      fechaVencimiento: {
        $gte: today,
        $lte: thirtyDaysFromNow
      },
      eliminado: { $ne: true }
    });

    if (productsExpiringSoon.length === 0) {
      return handleErrorClient(res, 404, 'No hay productos próximos a caducar');
    }

    // ❌ ELIMINAR: Las alertas ahora las maneja el cron job diario
    // Esta función solo devuelve datos para consultas manuales

    handleSuccess(res, 200, 'Productos próximos a caducar', productsExpiringSoon);
  } catch (error) {
    handleErrorServer(res, 500, 'Error al obtener los productos próximos a caducar', error.message);
  }
};

// Funcion para obtener productos vencidos
export const getExpiredProducts = async (req, res) => {
  try {
    const today = new Date();

    // 🔧 CORREGIDO: Excluir productos eliminados
    const expiredProducts = await Product.find({
      fechaVencimiento: {
        $lt: today
      },
      eliminado: { $ne: true }
    });

    if (expiredProducts.length === 0) {
      return handleErrorClient(res, 404, 'No hay productos vencidos');
    }

    // ❌ ELIMINAR: Las alertas ahora las maneja el cron job diario
    // Esta función solo devuelve datos para consultas manuales

    handleSuccess(res, 200, 'Productos vencidos', expiredProducts);
  } catch (error) {
    handleErrorServer(res, 500, 'Error al obtener los productos vencidos', error.message);
  }
};

export const scanProducts = async (req, res) => {
  try {
    const { codigoBarras } = req.body;

    if (!codigoBarras) return handleErrorClient(res, 400, "Código de barras es requerido");

    // Primero buscar si el producto existe en la base de datos (independientemente del stock)
    const productExists = await Product.findOne({ codigoBarras });
    
    if (!productExists) {
      return handleErrorClient(res, 404, "Producto no encontrado");
    }

    // Si el producto existe pero no tiene stock, devolver un error específico
    if (productExists.Stock <= 0) {
      return handleErrorClient(res, 400, "Este producto se ha quedado sin stock");
    }

    // Buscar el producto con stock disponible y fecha de vencimiento más próxima
    const product = await Product.findOne({
      codigoBarras,
      Stock: { $gt: 0 }
    }).sort({ fechaVencimiento: 1 });

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
      isExpired: isExpired
    });

  } catch (err) {
    handleErrorServer(res, 500, "Error al escanear producto", err.message);
  }
};

// Funcion para actualizar el stock de productos vendidos
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

        await producto.save();
        
        const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[producto.Categoria];
        if (stockMinimo && stockAnterior > stockMinimo && producto.Stock <= stockMinimo && producto.Stock > 0) {
          productosAfectadosEnVenta.push(producto);
        }

        if (stockAnterior > 0 && producto.Stock === 0) {
          productosAgotados.push(producto);
        }
      }

      if (cantidadRestante > 0) {
        return handleErrorClient(res, 400, `No hay suficiente stock para el producto ${codigoBarras}`);
      }
    }

    if (productosAfectadosEnVenta.length > 0 || productosAgotados.length > 0) {
      try {
        // Combinar todos los productos afectados para el email
        const todosLosProductosAfectados = [...productosAfectadosEnVenta, ...productosAgotados];
        
        // Enviar email solo una vez con toda la información
        await sendLowStockAlert(
          todosLosProductosAfectados.map(producto => ({
            ...producto.toObject(),
            esRecienAfectado: productosAfectadosEnVenta.some(p => p._id.toString() === producto._id.toString()),
            esAgotado: productosAgotados.some(p => p._id.toString() === producto._id.toString())
          })),
          productosAfectadosEnVenta.length > 0,
          productosAgotados.length > 0
        );

        // Emitir alertas WebSocket individuales
        if (productosAfectadosEnVenta.length > 0) {
          emitStockBajoAlert(productosAfectadosEnVenta);
        }
        if (productosAgotados.length > 0) {
          emitStockBajoAlert(productosAgotados);
        }
      } catch (alertError) {
        console.error("❌ Error al enviar alertas de stock:", alertError);
        // No fallar la venta por errores de alertas
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

// Gestión administrativa y consultas generales
// Búsqueda directa de productos con stock > 0, ordenados por fecha de vencimiento
// Verificación de existencia en módulos de gestión
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

// Función para desactivar productos sin stock después de 30 días
export const desactivarProductosSinStock = async () => {
  try {
    // Configurar para 30 días de espera antes de desactivar
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    console.log('🔍 Verificando productos sin stock para desactivar...');
    
    // Buscar productos que tienen stock 0, están activos y han estado sin stock por más de 30 días
    const productosSinStock = await Product.find({ 
      Stock: 0,
      eliminado: false,
      updatedAt: { $lt: treintaDiasAtras }
    });

    for (const producto of productosSinStock) {
      try {
        // Desactivar el producto con información automática
        const productoDesactivado = await Product.findByIdAndUpdate(
          producto._id,
          {
            eliminado: true,
            fechaEliminacion: new Date(),
            motivoEliminacion: 'sin_stock_permanente',
            comentarioEliminacion: `Producto desactivado automáticamente por estar sin stock por más de 30 días. Última actualización: ${producto.updatedAt.toLocaleDateString('es-ES')}`,
            usuarioEliminacion: null // Sistema automático
          },
          { new: true }
        );

        // Registrar en el historial de stock
        if (productoDesactivado.historialStock) {
          productoDesactivado.historialStock.push({
            stockAnterior: 0,
            stockNuevo: 0,
            tipoMovimiento: 'correccion',
            motivo: 'Producto desactivado automáticamente por falta de stock durante más de 30 días',
            usuario: null, // Sistema automático
            fecha: new Date()
          });
          await productoDesactivado.save();
        }

        console.log(`✅ Producto desactivado: ${producto.Nombre} (ID: ${producto._id})`);
      } catch (error) {
        console.error(`❌ Error al desactivar producto ${producto.Nombre}:`, error.message);
      }
    }

    if (productosSinStock.length > 0) {
      console.log(`🎯 Proceso completado: ${productosSinStock.length} productos desactivados automáticamente`);
    } else {
      console.log('✨ No hay productos que requieran desactivación por falta de stock');
    }

  } catch (error) {
    console.error("❌ Error en el proceso de desactivación automática:", error);
  }
};

// Actualizar el cron job para usar la nueva función
cron.schedule('0 9 * * *', async () => { // 9am todos los días 
  console.log('🤖 Ejecutando proceso automático de desactivación de productos sin stock...');
  await desactivarProductosSinStock();
}, {
  timezone: "America/Santiago"
});

// Función para obtener el historial de precios de un producto
// Incluye el precio actual y el historial ordenado por fecha
export const getProductPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');
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

// Función para obtener productos desactivados (solo para administradores y admin)
export const getDisabledProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const disabledProducts = await Product.find({ eliminado: true })
      .populate('usuarioEliminacion', 'username email')
      .collation({ locale: 'es', strength: 2 })
      .sort({ fechaEliminacion: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
      
    const count = await Product.countDocuments({ eliminado: true });

    handleSuccess(res, 200, disabledProducts.length > 0 ? 'Productos desactivados encontrados' : 'No hay productos desactivados', {
      products: disabledProducts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener productos desactivados', err.message);
  }
};

// Función para pruebas manuales del reporte diario
export const sendManualDailyReport = async (req, res) => {
  try {
    console.log('🧪 Ejecutando reporte diario manual...');
    
    // Importar la función del servicio de email
    const { sendDailyCompleteReport } = await import('../services/email.service.js');
    
    // Ejecutar el reporte
    await sendDailyCompleteReport();
    
    handleSuccess(res, 200, 'Reporte diario enviado exitosamente', {
      mensaje: 'El reporte diario ha sido enviado por email',
      timestamp: new Date().toLocaleString('es-ES'),
      tipo: 'prueba_manual'
    });
    
  } catch (error) {
    console.error('❌ Error al enviar reporte diario manual:', error);
    handleErrorServer(res, 500, 'Error al enviar el reporte diario', error.message);
  }
};

// 🆕 NUEVO: Función para agregar un nuevo lote a un producto existente
export const agregarLoteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, precioCompra, precioVenta, fechaVencimiento } = req.body;

    if (!cantidad || !precioCompra || !precioVenta || !fechaVencimiento) {
      return handleErrorClient(res, 400, 'Todos los campos del lote son requeridos');
    }

    if (cantidad <= 0) {
      return handleErrorClient(res, 400, 'La cantidad debe ser mayor a 0');
    }

    const product = await Product.findById(id);
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    // Generar número de lote automático
    const numeroLote = product.generarNumeroLote();

    // Crear el nuevo lote
    const nuevoLote = {
      numeroLote,
      cantidad: parseInt(cantidad),
      precioCompra: parseFloat(precioCompra),
      precioVenta: parseFloat(precioVenta),
      fechaVencimiento: new Date(fechaVencimiento),
      usuarioCreacion: req.userId,
      fechaCreacion: new Date(),
      activo: true
    };

    // Agregar el lote al producto
    product.lotes.push(nuevoLote);

    // El pre-save hook se encargará de recalcular el stock total y la fecha de vencimiento
    await product.save();

    // Registrar en el historial de stock
    product.historialStock.push({
      stockAnterior: product.Stock - parseInt(cantidad),
      stockNuevo: product.Stock,
      tipoMovimiento: 'entrada_inicial',
      motivo: `Nuevo lote agregado: ${numeroLote} (${cantidad} unidades)`,
      usuario: req.userId,
      fecha: new Date()
    });

    await product.save();

    handleSuccess(res, 200, 'Nuevo lote agregado exitosamente', {
      producto: product,
      nuevoLote: nuevoLote,
      stockTotal: product.Stock,
      totalLotes: product.lotes.length
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al agregar el nuevo lote', err.message);
  }
};

// 🆕 NUEVO: Función para obtener los lotes de un producto
export const getLotesProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('lotes.usuarioCreacion', 'username email');

    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    // Ordenar lotes por fecha de vencimiento (FIFO)
    const lotesOrdenados = product.lotes
      .filter(lote => lote.activo)
      .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

    const today = new Date();

    // Agregar información adicional a cada lote
    const lotesConInfo = lotesOrdenados.map(lote => {
      const diasParaVencer = Math.ceil((new Date(lote.fechaVencimiento) - today) / (1000 * 60 * 60 * 24));
      const margen = lote.precioVenta && lote.precioCompra 
        ? ((lote.precioVenta - lote.precioCompra) / lote.precioCompra * 100).toFixed(1)
        : 0;

      return {
        ...lote.toObject(),
        diasParaVencer,
        estaVencido: diasParaVencer < 0,
        estaPorVencer: diasParaVencer >= 0 && diasParaVencer <= 30,
        margen: parseFloat(margen)
      };
    });

    handleSuccess(res, 200, 'Lotes del producto obtenidos', {
      producto: {
        _id: product._id,
        Nombre: product.Nombre,
        Marca: product.Marca,
        stockTotal: product.Stock
      },
      lotes: lotesConInfo,
      resumen: {
        totalLotes: lotesConInfo.length,
        stockTotal: product.Stock,
        lotesVencidos: lotesConInfo.filter(l => l.estaVencido).length,
        lotesPorVencer: lotesConInfo.filter(l => l.estaPorVencer).length
      }
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener los lotes del producto', err.message);
  }
};

// 🆕 NUEVO: Función para eliminar producto de manera definitiva
export const deleteProductPermanently = async (req, res) => {
  try {
    const { id } = req.params;

    const { value, error } = idProductSchema.validate({ id }, { convert: false });
    if (error) return handleErrorClient(res, 400, error.message);

    const product = await Product.findById(value.id);
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    // Eliminar físicamente el producto de la base de datos
    // Las ventas asociadas se conservan independientemente
    await Product.findByIdAndDelete(value.id);

    handleSuccess(res, 200, 'Producto eliminado permanentemente', {
      mensaje: 'El producto ha sido eliminado definitivamente de la base de datos',
      productName: product.Nombre,
      productCode: product.codigoBarras
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al eliminar el producto permanentemente', err.message);
  }
};

// 🆕 NUEVO: Función para editar un lote específico de un producto
export const editarLoteProducto = async (req, res) => {
  try {
    const { id, loteId } = req.params;
    const { cantidad, precioCompra, precioVenta, fechaVencimiento } = req.body;

    if (!cantidad || !precioCompra || !precioVenta || !fechaVencimiento) {
      return handleErrorClient(res, 400, 'Todos los campos del lote son requeridos');
    }

    if (cantidad < 0) {
      return handleErrorClient(res, 400, 'La cantidad no puede ser negativa');
    }

    const product = await Product.findById(id);
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    // Buscar el lote específico
    const loteIndex = product.lotes.findIndex(lote => lote._id.toString() === loteId);
    if (loteIndex === -1) {
      return handleErrorClient(res, 404, 'Lote no encontrado');
    }

    const loteOriginal = product.lotes[loteIndex];
    const cantidadAnterior = loteOriginal.cantidad;

    // Actualizar los datos del lote
    product.lotes[loteIndex] = {
      ...loteOriginal.toObject(),
      cantidad: parseInt(cantidad),
      precioCompra: parseFloat(precioCompra),
      precioVenta: parseFloat(precioVenta),
      fechaVencimiento: new Date(fechaVencimiento),
      fechaModificacion: new Date(),
      usuarioModificacion: req.userId
    };

    // Guardar el producto (el pre-save hook recalculará el stock total)
    await product.save();

    // Registrar en el historial de stock si cambió la cantidad
    if (cantidadAnterior !== parseInt(cantidad)) {
      const diferencia = parseInt(cantidad) - cantidadAnterior;
      product.historialStock.push({
        stockAnterior: product.Stock - diferencia,
        stockNuevo: product.Stock,
        tipoMovimiento: diferencia > 0 ? 'entrada_inicial' : 'ajuste_manual',
        motivo: `Lote ${loteOriginal.numeroLote} editado: cantidad ${cantidadAnterior} → ${cantidad} (${diferencia > 0 ? '+' : ''}${diferencia})`,
        usuario: req.userId,
        fecha: new Date()
      });
      await product.save();
    }

    handleSuccess(res, 200, 'Lote editado exitosamente', {
      producto: product,
      loteEditado: product.lotes[loteIndex],
      stockTotal: product.Stock,
      cambioStock: parseInt(cantidad) - cantidadAnterior
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al editar el lote', err.message);
  }
};

// 🆕 NUEVO: Función para obtener información del próximo lote a usar (FIFO)
export const getProximoLoteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    // Si no tiene lotes, devolver información del producto principal
    if (!product.lotes || product.lotes.length === 0) {
      return handleSuccess(res, 200, 'Producto sin sistema de lotes', {
        tieneMultiplesLotes: false,
        lotePrincipal: {
          precioCompra: product.PrecioCompra,
          fechaVencimiento: product.fechaVencimiento,
          origen: 'producto_principal'
        }
      });
    }

    // Obtener lotes activos ordenados por fecha de vencimiento (FIFO)
    const lotesActivos = product.lotes
      .filter(lote => lote.activo && lote.cantidad > 0)
      .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

    if (lotesActivos.length === 0) {
      return handleSuccess(res, 200, 'No hay lotes activos con stock', {
        tieneMultiplesLotes: true,
        lotePrincipal: null,
        sinStock: true
      });
    }

    // El primer lote es el que se usará primero (FIFO)
    const proximoLote = lotesActivos[0];
    const today = new Date();
    const diasParaVencer = Math.ceil((new Date(proximoLote.fechaVencimiento) - today) / (1000 * 60 * 60 * 24));

    handleSuccess(res, 200, 'Información del próximo lote obtenida', {
      tieneMultiplesLotes: true,
      totalLotes: product.lotes.filter(l => l.activo).length,
      lotePrincipal: {
        _id: proximoLote._id,
        numeroLote: proximoLote.numeroLote,
        precioCompra: proximoLote.precioCompra,
        precioVenta: proximoLote.precioVenta,
        fechaVencimiento: proximoLote.fechaVencimiento,
        cantidad: proximoLote.cantidad,
        diasParaVencer,
        estaVencido: diasParaVencer < 0,
        estaPorVencer: diasParaVencer >= 0 && diasParaVencer <= 30,
        origen: 'lote_fifo'
      }
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener información del próximo lote', err.message);
  }
};
