import axios from './root.service.js';
import { getProducts } from './AddProducts.service.js';
import { getDeudores } from './deudores.service.js';
import { obtenerVentasPorTicket } from './venta.service.js';
import { getProveedores } from './proveedores.service.js';

/**
 * Servicio para recopilar todos los datos del sistema para el reporte completo
 */
export class DataCollectionService {
  
  /**
   * Recopila todos los datos del sistema necesarios para el reporte completo
   * @returns {Promise<Object>} - Objeto con todos los datos del sistema
   */
  static async recopilarDatosSistema() {
    try {
      console.log('🔄 Iniciando recopilación de datos del sistema...');
      
      // Obtener usuario actual
      const usuario = JSON.parse(localStorage.getItem('user')) || { email: 'Sistema' };
      
      // Recopilar todos los datos en paralelo para mayor eficiencia
      const [
        productosResponse,
        ventasResponse,
        deudoresResponse,
        proveedoresResponse,
        cuentasPorPagarResponse
      ] = await Promise.allSettled([
        this.obtenerProductos(),
        this.obtenerVentas(),
        this.obtenerDeudores(),
        this.obtenerProveedores(),
        this.obtenerCuentasPorPagar()
      ]);

      // Procesar resultados y manejar errores
      const productos = productosResponse.status === 'fulfilled' ? productosResponse.value : [];
      const ventas = ventasResponse.status === 'fulfilled' ? ventasResponse.value : [];
      const deudores = deudoresResponse.status === 'fulfilled' ? deudoresResponse.value : [];
      const proveedores = proveedoresResponse.status === 'fulfilled' ? proveedoresResponse.value : [];
      const cuentasPorPagar = cuentasPorPagarResponse.status === 'fulfilled' ? cuentasPorPagarResponse.value : [];

      console.log('📊 Datos recopilados:', {
        productos: productos.length,
        ventas: ventas.length,
        deudores: deudores.length,
        proveedores: proveedores.length,
        cuentasPorPagar: cuentasPorPagar.length
      });

      // Calcular datos financieros
      const datosFinancieros = this.calcularDatosFinancieros(ventas, productos);
      
      // Calcular estadísticas generales
      const estadisticasGenerales = this.calcularEstadisticasGenerales(productos, ventas, deudores);

      return {
        productos,
        ventas,
        deudores,
        proveedores,
        cuentasPorPagar,
        datosFinancieros,
        estadisticasGenerales,
        usuario
      };

    } catch (error) {
      console.error('❌ Error al recopilar datos del sistema:', error);
      throw new Error('No se pudieron obtener todos los datos del sistema');
    }
  }

  /**
   * Obtiene todos los productos del sistema
   */
  static async obtenerProductos() {
    try {
      const response = await getProducts(1, Number.MAX_SAFE_INTEGER);
      // Asegurar que siempre devolvamos un array
      if (response && response.products) {
        return response.products;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (error) {
      console.warn('⚠️ Error al obtener productos:', error);
      return [];
    }
  }

  /**
   * Obtiene todas las ventas del sistema
   */
  static async obtenerVentas() {
    try {
      const response = await obtenerVentasPorTicket();
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Error al obtener ventas:', error);
      return [];
    }
  }

  /**
   * Obtiene todos los deudores del sistema
   */
  static async obtenerDeudores() {
    try {
      const response = await getDeudores(1, 1000); // Obtener todos
      return response.deudores || [];
    } catch (error) {
      console.warn('⚠️ Error al obtener deudores:', error);
      return [];
    }
  }

  /**
   * Obtiene todos los proveedores del sistema
   */
  static async obtenerProveedores() {
    try {
      const response = await getProveedores();
      return response || [];
    } catch (error) {
      console.warn('⚠️ Error al obtener proveedores:', error);
      return [];
    }
  }

  /**
   * Obtiene todas las cuentas por pagar del sistema
   */
  static async obtenerCuentasPorPagar() {
    try {
      const response = await axios.get('/cuentasPorPagar');
      return response.data?.data?.cuentas || response.data?.data || [];
    } catch (error) {
      console.warn('⚠️ Error al obtener cuentas por pagar:', error);
      return [];
    }
  }

  /**
   * Calcula datos financieros a partir de las ventas y productos
   */
  static calcularDatosFinancieros(ventas, productos) {
    if (!ventas || ventas.length === 0) {
      return {
        ingresosTotales: 0,
        costosTotales: 0,
        gananciasTotales: 0,
        rentabilidadPromedio: 0,
        transacciones: 0,
        valorPromedioTransaccion: 0,
        inversionMercaderia: 0,
        topCategorias: []
      };
    }

    // Asegurar que productos sea un array válido
    const productosArray = Array.isArray(productos) ? productos : [];

    let ingresosTotales = 0;
    let costosTotales = 0;
    const categorias = {};

    ventas.forEach(venta => {
      if (venta.ventas && Array.isArray(venta.ventas)) {
        venta.ventas.forEach(producto => {
          const ingreso = producto.precioVenta * producto.cantidad;
          const costo = (producto.precioCompra || 0) * producto.cantidad;
          
          ingresosTotales += ingreso;
          costosTotales += costo;

          // Agrupar por categoría
          const categoria = producto.categoria || 'Sin categoría';
          if (!categorias[categoria]) {
            categorias[categoria] = { ingresos: 0, ventas: 0 };
          }
          categorias[categoria].ingresos += ingreso;
          categorias[categoria].ventas += producto.cantidad;
        });
      }
    });

    const gananciasTotales = ingresosTotales - costosTotales;
    const rentabilidadPromedio = ingresosTotales > 0 ? (gananciasTotales / ingresosTotales) * 100 : 0;
    const transacciones = ventas.length;
    const valorPromedioTransaccion = transacciones > 0 ? ingresosTotales / transacciones : 0;

    // Calcular inversión en mercadería con protección adicional
    const inversionMercaderia = productosArray.reduce((sum, producto) => {
      if (!producto) return sum;
      return sum + ((producto.PrecioCompra || 0) * (producto.Stock || 0));
    }, 0);

    // Top categorías por ingresos
    const topCategorias = Object.entries(categorias)
      .map(([nombre, datos]) => ({
        nombre,
        ingresos: datos.ingresos,
        porcentaje: ingresosTotales > 0 ? (datos.ingresos / ingresosTotales) * 100 : 0
      }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 10);

    return {
      ingresosTotales,
      costosTotales,
      gananciasTotales,
      rentabilidadPromedio,
      transacciones,
      valorPromedioTransaccion,
      inversionMercaderia,
      topCategorias
    };
  }

  /**
   * Calcula estadísticas generales del sistema
   */
  static calcularEstadisticasGenerales(productos, ventas, deudores) {
    // Asegurar que todos los parámetros sean arrays válidos
    const productosArray = Array.isArray(productos) ? productos : [];
    const ventasArray = Array.isArray(ventas) ? ventas : [];
    const deudoresArray = Array.isArray(deudores) ? deudores : [];

    const stockTotal = productosArray.reduce((sum, p) => sum + (p.Stock || 0), 0);
    
    // Calcular productos sin rotación (sin ventas en los últimos 30 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    
    const productosVendidosReciente = new Set();
    ventasArray.forEach(venta => {
      if (new Date(venta.fecha) >= fechaLimite && venta.ventas) {
        venta.ventas.forEach(producto => {
          productosVendidosReciente.add(producto.nombre);
        });
      }
    });

    const productosSinRotacion = productosArray.filter(p => 
      !productosVendidosReciente.has(p.Nombre)
    ).length;

    // Calcular promedio de días de inventario
    const ventasDiarias = ventasArray.length / 30; // Aproximación de ventas diarias
    const diasInventario = ventasDiarias > 0 ? stockTotal / ventasDiarias : 0;

    // Calcular deuda total
    const deudaTotal = deudoresArray.reduce((sum, d) => {
      const deuda = parseFloat(d.deudaTotal?.replace(/[\$\.,]/g, '') || '0');
      return sum + deuda;
    }, 0);

    return {
      stockTotal,
      productosSinRotacion,
      diasInventario: Math.round(diasInventario),
      rotacionInventario: ventasDiarias > 0 ? (stockTotal / ventasDiarias / 30).toFixed(1) : 'N/A',
      tiempoPromedioPago: 'N/A', // Se podría calcular con más datos
      satisfaccionDeudores: 'N/A', // Se podría implementar con sistema de ratings
      eficienciaCobros: deudaTotal > 0 ? ((deudaTotal * 0.8) / deudaTotal * 100).toFixed(1) : 'N/A',
      crecimientoMensual: 'N/A', // Se podría calcular comparando períodos
      margenBrutoPromedio: 'N/A' // Se podría calcular con datos más detallados
    };
  }
}