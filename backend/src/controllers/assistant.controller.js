import Product from '../models/products.model.js';
import Venta from '../models/venta.model.js';
import Deudores from '../models/deudores.model.js';
import Proveedor from '../models/proveedores.model.js';
import CuentasPorPagar from '../models/cuentasPorPagar.model.js';
import { handleSuccess, handleErrorClient, handleErrorServer } from '../utils/resHandlers.js';

// PRIMERO definir todas las funciones handlers
const getTopSellingProducts = async () => {
  try {
    // Implementación existente
    const ventas = await Venta.aggregate([
      {
        $group: {
          _id: { nombre: "$nombre", codigoBarras: "$codigoBarras" },
          totalVendido: { $sum: "$cantidad" },
          ingresos: { $sum: { $multiply: ["$cantidad", "$precioVenta"] } }
        }
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 10 }
    ]);
    
    if (ventas.length === 0) {
      return {
        text: "No se encontraron datos de ventas registrados en el sistema.",
        resultData: null
      };
    }
    
    // Formatear resultados para la respuesta
    const resultData = {
      type: 'table',
      headers: ['Producto', 'Unidades Vendidas', 'Ingresos Generados'],
      rows: ventas.map(v => [
        v._id.nombre, 
        v.totalVendido.toString(), 
        `$${v.ingresos.toLocaleString('es-CL')}`
      ])
    };
    
    return {
      text: "Estos son los productos más vendidos:",
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo productos más vendidos:', error);
    throw error;
  }
};

// Función para obtener los deudores con mayor deuda
const getTopDebtors = async () => {
  try {
    const deudores = await Deudores.find()
      .sort({ deudaTotal: -1 })
      .limit(10);
    
    if (deudores.length === 0) {
      return {
        text: "No se encontraron deudores registrados en el sistema.",
        resultData: null
      };
    }
    
    // Formatear resultados para la respuesta
    const resultData = {
      type: 'table',
      headers: ['Nombre', 'Teléfono', 'Deuda Total', 'Fecha Límite'],
      rows: deudores.map(d => [
        d.Nombre,
        d.numeroTelefono,
        `$${d.deudaTotal.toLocaleString('es-CL')}`,
        new Date(d.fechaPaga).toLocaleDateString('es-CL')
      ])
    };
    
    return {
      text: "Estos son los deudores con mayor deuda:",
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo deudores con mayor deuda:', error);
    throw error;
  }
};

// Función para obtener el estado del inventario
const getInventoryStatus = async () => {
  try {
    // Productos con stock crítico o agotados
    const lowStockProducts = await Product.find({ Stock: { $lte: 5 } })
      .sort({ Stock: 1 })
      .limit(15);
    
    // Productos por vencer en los próximos 30 días
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    const expiringProducts = await Product.find({
      fechaVencimiento: {
        $gte: today,
        $lte: nextMonth
      }
    }).sort({ fechaVencimiento: 1 }).limit(15);
    
    if (lowStockProducts.length === 0 && expiringProducts.length === 0) {
      return {
        text: "No se encontraron problemas en el inventario. El stock parece estar en niveles normales y no hay productos por vencer pronto.",
        resultData: null
      };
    }
    
    let responseText = "";
    let resultData = null;
    
    if (lowStockProducts.length > 0) {
      responseText = "Estos son los productos con stock crítico o agotados:";
      resultData = {
        type: 'table',
        headers: ['Producto', 'Categoría', 'Stock Actual', 'Estado'],
        rows: lowStockProducts.map(p => [
          p.Nombre,
          p.Categoria,
          p.Stock.toString(),
          p.Stock === 0 ? 'AGOTADO' : 'BAJO STOCK'
        ])
      };
    } else if (expiringProducts.length > 0) {
      responseText = "Estos son los productos próximos a vencer:";
      resultData = {
        type: 'table',
        headers: ['Producto', 'Categoría', 'Stock', 'Fecha Vencimiento'],
        rows: expiringProducts.map(p => [
          p.Nombre,
          p.Categoria,
          p.Stock.toString(),
          new Date(p.fechaVencimiento).toLocaleDateString('es-CL')
        ])
      };
    }
    
    return {
      text: responseText,
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo estado del inventario:', error);
    throw error;
  }
};

// Función para obtener las ventas por categoría
const getSalesByCategory = async () => {
  try {
    // Agregación para obtener ventas por categoría
    const ventasPorCategoria = await Venta.aggregate([
      {
        $group: {
          _id: "$categoria",
          totalVendido: { $sum: "$cantidad" },
          ingresos: { $sum: { $multiply: ["$cantidad", "$precioVenta"] } }
        }
      },
      { $sort: { ingresos: -1 } }
    ]);
    
    if (ventasPorCategoria.length === 0) {
      return {
        text: "No se encontraron datos de ventas por categoría.",
        resultData: null
      };
    }
    
    // Formatear resultados para la respuesta
    const resultData = {
      type: 'table',
      headers: ['Categoría', 'Unidades Vendidas', 'Ingresos'],
      rows: ventasPorCategoria.map(v => [
        v._id,
        v.totalVendido.toString(),
        `$${v.ingresos.toLocaleString('es-CL')}`
      ])
    };
    
    return {
      text: "Este es el resumen de ventas por categoría:",
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo ventas por categoría:', error);
    throw error;
  }
};

// Función para obtener información de proveedores
const getProveedoresInfo = async () => {
  try {
    // Obtener proveedores con conteo de productos
    const proveedores = await Proveedor.aggregate([
      {
        $project: {
          nombre: 1,
          categorias: 1,
          email: 1,
          telefono: 1,
          cantidadProductos: { $size: { $ifNull: ["$productos", []] } }
        }
      },
      { $sort: { cantidadProductos: -1 } },
      { $limit: 10 }
    ]);
    
    if (proveedores.length === 0) {
      return {
        text: "No se encontraron proveedores registrados en el sistema.",
        resultData: null
      };
    }
    
    // Formatear resultados para la respuesta
    const resultData = {
      type: 'table',
      headers: ['Proveedor', 'Categorías', 'Teléfono', 'Productos'],
      rows: proveedores.map(p => [
        p.nombre,
        p.categorias.join(', '),
        p.telefono,
        p.cantidadProductos.toString()
      ])
    };
    
    return {
      text: "Estos son los principales proveedores:",
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo información de proveedores:', error);
    throw error;
  }
};

// Función para obtener cuentas por pagar
const getAccountsPayable = async () => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Formatear mes actual como '01', '02', etc.
    const monthString = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
    const yearMonth = `${currentYear}-${monthString}`;
    
    // Consultar cuentas del mes actual
    const cuentas = await CuentasPorPagar.find({
      Mes: { $regex: `^${yearMonth}` }
    }).sort({ Estado: 1 }); // Pendientes primero
    
    if (cuentas.length === 0) {
      return {
        text: "No se encontraron cuentas por pagar para el mes actual.",
        resultData: null
      };
    }
    
    // Agrupar por estado
    const pendientes = cuentas.filter(c => c.Estado === 'Pendiente');
    const pagadas = cuentas.filter(c => c.Estado === 'Pagado');
    
    // Calcular totales
    const totalPendiente = pendientes.reduce((sum, c) => sum + c.Monto, 0);
    const totalPagado = pagadas.reduce((sum, c) => sum + c.Monto, 0);
    
    // Formatear resultados para la respuesta
    const resultData = {
      type: 'table',
      headers: ['Proveedor', 'Categoría', 'Monto', 'Estado'],
      rows: cuentas.map(c => [
        c.Nombre,
        c.Categoria,
        `$${c.Monto.toLocaleString('es-CL')}`,
        c.Estado
      ])
    };
    
    // Texto de resumen
    const resumenText = `Resumen del mes actual: ${pendientes.length} cuentas pendientes por $${totalPendiente.toLocaleString('es-CL')} y ${pagadas.length} cuentas pagadas por $${totalPagado.toLocaleString('es-CL')}.`;
    
    return {
      text: `${resumenText}\n\nDetalle de cuentas por pagar del mes:`,
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo cuentas por pagar:', error);
    throw error;
  }
};

// Función para obtener los productos menos vendidos
const getLeastSellingProducts = async () => {
  try {
    const ventas = await Venta.aggregate([
      {
        $group: {
          _id: { nombre: "$nombre", codigoBarras: "$codigoBarras" },
          totalVendido: { $sum: "$cantidad" },
          ingresos: { $sum: { $multiply: ["$cantidad", "$precioVenta"] } }
        }
      },
      { $sort: { totalVendido: 1 } }, // Ordenar ascendente para los menos vendidos
      { $limit: 10 }
    ]);
    
    if (ventas.length === 0) {
      return {
        text: "No se encontraron datos de ventas registrados en el sistema.",
        resultData: null
      };
    }
    
    const resultData = {
      type: 'table',
      headers: ['Producto', 'Unidades Vendidas', 'Ingresos Generados'],
      rows: ventas.map(v => [
        v._id.nombre, 
        v.totalVendido.toString(), 
        `$${v.ingresos.toLocaleString('es-CL')}`
      ])
    };
    
    return {
      text: "Estos son los productos menos vendidos:",
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo productos menos vendidos:', error);
    throw error;
  }
};

// Función para obtener productos vencidos o por vencer pronto
const getExpiringProducts = async () => {
  try {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    // Productos ya vencidos
    const expiredProducts = await Product.find({
      fechaVencimiento: { $lt: today },
      Stock: { $gt: 0 }
    }).sort({ fechaVencimiento: 1 }).limit(10);
    
    // Productos por vencer en 30 días
    const expiringProducts = await Product.find({
      fechaVencimiento: {
        $gte: today,
        $lte: nextMonth
      },
      Stock: { $gt: 0 }
    }).sort({ fechaVencimiento: 1 }).limit(10);
    
    if (expiredProducts.length === 0 && expiringProducts.length === 0) {
      return {
        text: "No se encontraron productos vencidos o por vencer en los próximos 30 días.",
        resultData: null
      };
    }
    
    let responseText = "";
    let resultData = null;
    
    if (expiredProducts.length > 0) {
      responseText = "¡ALERTA! Estos productos ya están vencidos y deben ser retirados:";
      resultData = {
        type: 'table',
        headers: ['Producto', 'Categoría', 'Stock', 'Fecha Vencimiento', 'Estado'],
        rows: expiredProducts.map(p => [
          p.Nombre,
          p.Categoria,
          p.Stock.toString(),
          new Date(p.fechaVencimiento).toLocaleDateString('es-CL'),
          'VENCIDO'
        ])
      };
    } else {
      responseText = "Estos productos vencerán en los próximos 30 días:";
      resultData = {
        type: 'table',
        headers: ['Producto', 'Categoría', 'Stock', 'Fecha Vencimiento', 'Días Restantes'],
        rows: expiringProducts.map(p => {
          const diasRestantes = Math.ceil((new Date(p.fechaVencimiento) - today) / (1000 * 60 * 60 * 24));
          return [
            p.Nombre,
            p.Categoria,
            p.Stock.toString(),
            new Date(p.fechaVencimiento).toLocaleDateString('es-CL'),
            diasRestantes.toString()
          ];
        })
      };
    }
    
    return {
      text: responseText,
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo productos vencidos:', error);
    throw error;
  }
};

// Función para obtener resumen financiero
const getFinancialSummary = async () => {
  try {
    // Obtener ventas del mes actual
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const ventasMes = await Venta.find({
      fecha: { $gte: firstDayOfMonth, $lte: today }
    });
    
    // Calcular totales
    let ingresosMes = 0;
    let costosMes = 0;
    
    ventasMes.forEach(venta => {
      ingresosMes += venta.precioVenta * venta.cantidad;
      costosMes += venta.precioCompra * venta.cantidad;
    });
    
    const gananciasMes = ingresosMes - costosMes;
    const margenGanancia = ingresosMes > 0 ? (gananciasMes / ingresosMes) * 100 : 0;
    
    // Obtener cuentas por pagar pendientes
    const cuentasPendientes = await CuentasPorPagar.find({ 
      Estado: 'Pendiente'
    });
    
    const totalPorPagar = cuentasPendientes.reduce((sum, cuenta) => sum + cuenta.Monto, 0);
    
    // Obtener total de deudas por cobrar
    const deudores = await Deudores.find();
    const totalPorCobrar = deudores.reduce((sum, deudor) => {
      // Asumiendo que deudaTotal podría ser string con formato "$X.XXX"
      const deuda = typeof deudor.deudaTotal === 'number' 
        ? deudor.deudaTotal 
        : parseFloat(deudor.deudaTotal.replace(/[^\d,-]/g, '').replace(',', '.'));
      return sum + (isNaN(deuda) ? 0 : deuda);
    }, 0);
    
    // Crear tabla de resumen
    const resultData = {
      type: 'table',
      headers: ['Concepto', 'Valor'],
      rows: [
        ['Ingresos del mes', `$${ingresosMes.toLocaleString('es-CL')}`],
        ['Costos del mes', `$${costosMes.toLocaleString('es-CL')}`],
        ['Ganancias del mes', `$${gananciasMes.toLocaleString('es-CL')}`],
        ['Margen de ganancia', `${margenGanancia.toFixed(2)}%`],
        ['Por cobrar (deudores)', `$${totalPorCobrar.toLocaleString('es-CL')}`],
        ['Por pagar (proveedores)', `$${totalPorPagar.toLocaleString('es-CL')}`],
        ['Balance (por cobrar - por pagar)', `$${(totalPorCobrar - totalPorPagar).toLocaleString('es-CL')}`]
      ]
    };
    
    return {
      text: "Resumen financiero actualizado:",
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo resumen financiero:', error);
    throw error;
  }
};

// Función para obtener deudores con pagos vencidos
const getOverdueDebtors = async () => {
  try {
    const today = new Date();
    
    const deudoresVencidos = await Deudores.find({
      fechaPaga: { $lt: today },
      deudaTotal: { $gt: 0 }
    }).sort({ deudaTotal: -1 });
    
    if (deudoresVencidos.length === 0) {
      return {
        text: "No se encontraron deudores con pagos vencidos.",
        resultData: null
      };
    }
    
    // Formatear resultados para la respuesta
    const resultData = {
      type: 'table',
      headers: ['Nombre', 'Teléfono', 'Deuda Total', 'Fecha Límite', 'Días de Atraso'],
      rows: deudoresVencidos.map(d => {
        const diasAtraso = Math.ceil((today - new Date(d.fechaPaga)) / (1000 * 60 * 60 * 24));
        return [
          d.Nombre,
          d.numeroTelefono,
          `$${d.deudaTotal.toLocaleString('es-CL')}`,
          new Date(d.fechaPaga).toLocaleDateString('es-CL'),
          diasAtraso.toString()
        ];
      })
    };
    
    return {
      text: "Estos son los deudores con pagos vencidos:",
      resultData
    };
  } catch (error) {
    console.error('Error obteniendo deudores con pagos vencidos:', error);
    throw error;
  }
};

// DESPUÉS definir el array INTENTS que usa esas funciones
const INTENTS = [
  {
    name: 'productos_mas_vendidos',
    keywords: ['productos mas vendidos', 'productos populares', 'que se vende mas', 'mejores ventas', 'top ventas'],
    handler: getTopSellingProducts
  },
  {
    name: 'productos_menos_vendidos',
    keywords: ['productos menos vendidos', 'que se vende menos', 'peores ventas', 'menos populares'],
    handler: getLeastSellingProducts
  },
  {
    name: 'deudores_mayor_deuda',
    keywords: ['deudores', 'deben mas', 'mayor deuda', 'clientes deuda'],
    handler: getTopDebtors
  },
  {
    name: 'deudores_vencidos',
    keywords: ['deudores vencidos', 'pagos atrasados', 'clientes morosos', 'deudas vencidas'],
    handler: getOverdueDebtors
  },
  {
    name: 'estado_inventario',
    keywords: ['inventario', 'stock', 'productos agotados', 'productos disponibles'],
    handler: getInventoryStatus
  },
  {
    name: 'productos_vencidos',
    keywords: ['productos vencidos', 'por vencer', 'fechas de vencimiento', 'caducidad'],
    handler: getExpiringProducts
  },
  {
    name: 'ventas_categoria',
    keywords: ['ventas por categoria', 'categoria mas vendida', 'ventas categoria'],
    handler: getSalesByCategory
  },
  {
    name: 'proveedores',
    keywords: ['proveedores', 'distribuidores', 'proveedor'],
    handler: getProveedoresInfo
  },
  {
    name: 'cuentas_por_pagar',
    keywords: ['cuentas por pagar', 'pagos pendientes', 'deudas a proveedores'],
    handler: getAccountsPayable
  },
  {
    name: 'resumen_finanzas',
    keywords: ['finanzas', 'resumen financiero', 'balance', 'ganancias', 'resumen economico', 'ganancias mes', 'gastos'],
    handler: getFinancialSummary
  }
];

// La implementación de processQuery
export const processQuery = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return handleErrorClient(res, 400, 'La consulta es requerida');
    }
    
    // Normalizar la consulta a minúsculas sin acentos
    const normalizedQuery = query.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    // Buscar coincidencia con las intenciones
    let matchedIntent = null;
    let maxMatches = 0;
    
    for (const intent of INTENTS) {
      // Contar cuántas palabras clave coinciden
      const matches = intent.keywords.filter(keyword => 
        normalizedQuery.includes(keyword)
      ).length;
      
      if (matches > 0 && matches > maxMatches) {
        maxMatches = matches;
        matchedIntent = intent;
      }
    }
    
    // Procesar respuesta según la intención detectada
    let response;
    if (matchedIntent) {
      response = await matchedIntent.handler();
    } else {
      response = {
        text: "Lo siento, no entendí tu consulta. Por favor, intenta ser más específico o usa alguna de las consultas sugeridas.",
        resultData: null
      };
    }
    
    handleSuccess(res, 200, 'Consulta procesada con éxito', response);
  } catch (error) {
    handleErrorServer(res, 500, 'Error al procesar la consulta', error.message);
  }
};