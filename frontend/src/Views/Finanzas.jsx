import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar";
import { obtenerVentasPorTicket, obtenerVentas } from "../services/venta.service.js";
import { useVentas } from "../context/VentasContext";
import { getProducts } from "../services/AddProducts.service.js";
import { ExportService } from '../services/export.service.js';
import "../styles/FinanzasStyles.css";
import "../styles/SmartPagination.css";
import FinanzasSkeleton from '../components/Skeleton/FinanzasSkeleton';
import { 
  faFilePdf, faChartBar, faCoins, faMoneyBillWave, faShoppingCart, faChartLine, faWarehouse,
  faPercentage, faCalendarAlt, faBoxOpen, faPercent, faChartPie, faTable, faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SmartPagination from '../components/SmartPagination';

const Finanzas = () => {
  const [datosFinancieros, setDatosFinancieros] = useState({
    ingresosTotales: 0,
    transacciones: 0,
    costosTotales: 0,
    gananciasTotales: 0,
    inversionMercaderia: 0,
    rentabilidadPromedio: 0,
    valorPromedioTransaccion: 0,
    topCategorias: [],
    datosDisponibles: false,
    ingresosPorPeriodo: {},
    ingresosPorMes: {},
    productosMasVendidos: [],
    categoriasPorVolumen: [],
    inversionPorCategoria: {},
    margenPorCategoria: [],
    rentabilidadTemporal: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("semana");
  const [seccionActiva, setSeccionActiva] = useState("general");
  const [paginaActual, setPaginaActual] = useState(1);
  const [diasPorPagina, setDiasPorPagina] = useState(14); // Mostrar 2 semanas por página
  
  // Estados para filtros de fecha específicos
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState(false);
  const [seleccionSemana, setSeleccionSemana] = useState(0); // 0: esta semana, -1: semana anterior, etc.
  const [seleccionMes, setSeleccionMes] = useState({
    mes: new Date().getMonth(),
    anio: new Date().getFullYear()
  });
  const [seleccionAnio, setSeleccionAnio] = useState({
    anio: new Date().getFullYear(),
    trimestre: 0 // 0: todo el año, 1-4: trimestres específicos
  });
  
  // Nuevos estados para los tooltips de información
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [verTabla, setVerTabla] = useState({}); // Cambiar a objeto para múltiples tarjetas
  
  // Referencia al contenedor principal para calcular posiciones de tooltips
  const containerRef = useRef(null);

  // 🧠 USAR CONTEXTO DE VENTAS CON USEMEMO PARA OPTIMIZAR ESTADÍSTICAS
  const { ventasGlobales, loading: ventasLoading, getVentasByDateRange } = useVentas();

  // 📅 FUNCIÓN PARA CALCULAR RANGOS DE FECHAS (memoizada para evitar re-renders)
  const calcularRangoFechas = useCallback(() => {
    const hoy = new Date();
    let inicio = new Date();
    let fin = new Date();
    
    if (timeRange === "semana") {
      // Obtener el lunes de la semana seleccionada
      const diaSemana = hoy.getDay() || 7;
      const diasDesdeInicio = diaSemana - 1;
      
      inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - diasDesdeInicio + (seleccionSemana * 7));
      inicio.setHours(0, 0, 0, 0);
      
      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
      
    } else if (timeRange === "mes") {
      inicio = new Date(seleccionMes.anio, seleccionMes.mes, 1);
      inicio.setHours(0, 0, 0, 0);
      
      fin = new Date(seleccionMes.anio, seleccionMes.mes + 1, 0);
      fin.setHours(23, 59, 59, 999);
      
    } else if (timeRange === "año") {
      if (seleccionAnio.trimestre === 0) {
        inicio = new Date(seleccionAnio.anio, 0, 1);
        fin = new Date(seleccionAnio.anio, 11, 31);
      } else {
        const trimestre = seleccionAnio.trimestre - 1;
        inicio = new Date(seleccionAnio.anio, trimestre * 3, 1);
        fin = new Date(seleccionAnio.anio, (trimestre + 1) * 3, 0);
      }
      
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      
    } else if (timeRange === "personalizado" && periodoPersonalizado) {
      inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      
      fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
    } else {
      inicio.setDate(hoy.getDate() - 7);
      inicio.setHours(0, 0, 0, 0);
    }
    
    return { inicio, fin };
  }, [timeRange, seleccionSemana, seleccionMes, seleccionAnio, periodoPersonalizado, fechaInicio, fechaFin]);

  // 🚀 OPTIMIZACIÓN: Usar useMemo para calcular datos financieros cuando ya están cargadas las ventas
  const datosFinancierosOptimized = useMemo(() => {
    if (!ventasGlobales || ventasGlobales.length === 0) {
      return {
        ingresosTotales: 0,
        transacciones: 0,
        costosTotales: 0,
        gananciasTotales: 0,
        rentabilidadPromedio: 0,
        valorPromedioTransaccion: 0,
        topCategorias: [],
        datosDisponibles: false,
        ingresosPorPeriodo: {},
        ingresosPorMes: {},
        productosMasVendidos: [],
        categoriasPorVolumen: [],
        margenPorCategoria: [],
        ventasPorDiaSemana: {},
        rentabilidadTemporal: []
      };
    }

    // Obtener rango de fechas basado en los filtros seleccionados
    const { inicio: fechaInicio, fin: fechaFin } = calcularRangoFechas();
    
    // Filtrar ventas por rango de tiempo usando el cache global
    const ventasFiltradas = getVentasByDateRange(
      fechaInicio.toISOString().split('T')[0],
      fechaFin.toISOString().split('T')[0]
    );
    
    // Calcular métricas generales
    let ingresosTotales = 0;
    let costosTotales = 0;
    const ingresosPorCategoria = {};
    const ingresosPorDia = {};
    const ingresosPorMes = {};
    const productoVendido = {};
    const ventasPorCategoria = {};
    
    // Para calcular márgenes reales por categoría
    const costosPorCategoria = {};
    const gananciasPorCategoria = {};
    
    // Inicializar días en ingresosPorDia para el período seleccionado
    const fechaActual = new Date(fechaInicio);
    while (fechaActual <= fechaFin) {
      const fechaStr = fechaActual.toISOString().split('T')[0];
      ingresosPorDia[fechaStr] = 0;
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    // Inicializar meses en ingresosPorMes (año actual)
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    meses.forEach(mes => {
      ingresosPorMes[mes] = 0;
    });
    
    // Inicializar ventas por día de la semana con valores cero
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const ventasPorDiaSemana = {};
    diasSemana.forEach(dia => {
      ventasPorDiaSemana[dia] = 0;
    });
    
    // Mapeo correcto de los días de JavaScript a nuestro array
    const mapeoJSaDias = {
      0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb'
    };
    
    // Procesar las ventas - CORREGIDO: Verificar que venta.ventas existe
    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      const fechaStr = fecha.toISOString().split('T')[0];
      const mes = meses[fecha.getMonth()];
      const diaSemana = fecha.getDay();
      const diaSemanaKey = mapeoJSaDias[diaSemana];
      
      let ingresoVenta = 0;
      let costoVenta = 0;
      
      // 🔧 FIX: Verificar que venta.ventas existe y es un array antes de usar forEach
      if (venta.ventas && Array.isArray(venta.ventas)) {
        venta.ventas.forEach(producto => {
          ingresoVenta += producto.precioVenta * producto.cantidad;
          costoVenta += (producto.precioCompra || (producto.precioVenta * 0.7)) * producto.cantidad;
          
          // Agregar a categoría
          const categoria = producto.categoria || "Sin categoría";
          if (!ingresosPorCategoria[categoria]) {
            ingresosPorCategoria[categoria] = 0;
            ventasPorCategoria[categoria] = 0;
            costosPorCategoria[categoria] = 0;
          }
          ingresosPorCategoria[categoria] += producto.precioVenta * producto.cantidad;
          ventasPorCategoria[categoria] += producto.cantidad;
          costosPorCategoria[categoria] += (producto.precioCompra || (producto.precioVenta * 0.7)) * producto.cantidad;

          // Tracking de productos más vendidos
          const productoKey = producto.nombre;
          if (!productoVendido[productoKey]) {
            productoVendido[productoKey] = {
              nombre: producto.nombre,
              ventas: 0,
              ingreso: 0
            };
          }
          productoVendido[productoKey].ventas += producto.cantidad;
          productoVendido[productoKey].ingreso += producto.precioVenta * producto.cantidad;
        });
      } else {
        // Si es una venta individual (formato anterior) - también verificar que tenga las propiedades necesarias
        if (venta.precioVenta && venta.cantidad) {
          ingresoVenta += venta.precioVenta * venta.cantidad;
          costoVenta += (venta.precioCompra || (venta.precioVenta * 0.7)) * venta.cantidad;
          
          const categoria = venta.categoria || "Sin categoría";
          if (!ingresosPorCategoria[categoria]) {
            ingresosPorCategoria[categoria] = 0;
            ventasPorCategoria[categoria] = 0;
            costosPorCategoria[categoria] = 0;
          }
          ingresosPorCategoria[categoria] += venta.precioVenta * venta.cantidad;
          ventasPorCategoria[categoria] += venta.cantidad;
          costosPorCategoria[categoria] += (venta.precioCompra || (venta.precioVenta * 0.7)) * venta.cantidad;

          const productoKey = venta.nombre;
          if (!productoVendido[productoKey]) {
            productoVendido[productoKey] = {
              nombre: venta.nombre,
              ventas: 0,
              ingreso: 0
            };
          }
          productoVendido[productoKey].ventas += venta.cantidad;
          productoVendido[productoKey].ingreso += venta.precioVenta * venta.cantidad;
        }
      }
      
      ingresosTotales += ingresoVenta;
      costosTotales += costoVenta;
      
      // Actualizar ingresos por día si es del período actual
      if (fechaStr in ingresosPorDia) {
        ingresosPorDia[fechaStr] += ingresoVenta;
      }
      
      // Actualizar ingresos por día de la semana
      if (diaSemanaKey) {
        ventasPorDiaSemana[diaSemanaKey] += ingresoVenta;
      }
      
      // Actualizar ingresos por mes del año actual
      if (fecha.getFullYear() === new Date().getFullYear()) {
        ingresosPorMes[mes] += ingresoVenta;
      }
    });
    
    // Calcular ganancias y rentabilidad
    const gananciasTotales = ingresosTotales - costosTotales;
    const rentabilidadPromedio = ingresosTotales > 0 ? (gananciasTotales / ingresosTotales) * 100 : 0;
    
    // Top categorías por ingresos
    const categoriasOrdenadas = Object.keys(ingresosPorCategoria)
      .map(categoria => ({ 
        nombre: categoria, 
        ingresos: ingresosPorCategoria[categoria],
        porcentaje: (ingresosPorCategoria[categoria] / ingresosTotales) * 100
      }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);
    
    // Categorías por volumen de ventas
    const categoriasPorVolumen = Object.keys(ventasPorCategoria)
      .map(categoria => {
        const totalVentas = Object.values(ventasPorCategoria).reduce((a, b) => a + b, 0);
        return {
          nombre: categoria,
          ventas: ventasPorCategoria[categoria],
          porcentaje: totalVentas > 0 ? (ventasPorCategoria[categoria] / totalVentas) * 100 : 0
        };
      })
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 5);
    
    // Productos más vendidos
    const productosMasVendidos = Object.values(productoVendido)
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 5);
    
    // Valor promedio por transacción
    const valorPromedioTransaccion = ventasFiltradas.length > 0 ? ingresosTotales / ventasFiltradas.length : 0;
    
    // 🔄 NUEVA FUNCIONALIDAD: Cálculo de rotación de inventario
    const calcularRotacionInventario = () => {
      // Obtener período en días basado en el rango de fechas
      const { inicio: fechaInicio, fin: fechaFin } = calcularRangoFechas();
      const diasPeriodo = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
      
      // Rotación global de inventario
      const rotacionGlobal = {
        costoVendido: costosTotales,
        valorInventarioPromedio: datosFinancieros?.inversionMercaderia || 0,
        rotacionAnual: 0,
        diasInventario: 0,
        periodoAnalizado: diasPeriodo
      };
      
      if (rotacionGlobal.valorInventarioPromedio > 0 && diasPeriodo > 0) {
        // Calcular rotación anualizada
        const factorAnualizacion = 365 / diasPeriodo;
        rotacionGlobal.rotacionAnual = (costosTotales * factorAnualizacion) / rotacionGlobal.valorInventarioPromedio;
        rotacionGlobal.diasInventario = rotacionGlobal.valorInventarioPromedio / (costosTotales / diasPeriodo);
      }
      
      // Rotación por categoría
      const rotacionPorCategoria = Object.keys(costosPorCategoria)
        .map(categoria => {
          const costoCategoria = costosPorCategoria[categoria];
          const inversionCategoria = datosFinancieros?.inversionPorCategoria?.[categoria] || 0;
          let rotacionAnual = 0;
          let diasInventario = 0;
          let velocidad = 'lenta';
          
          if (inversionCategoria > 0 && diasPeriodo > 0) {
            const factorAnualizacion = 365 / diasPeriodo;
            rotacionAnual = (costoCategoria * factorAnualizacion) / inversionCategoria;
            diasInventario = inversionCategoria / (costoCategoria / diasPeriodo);
            
            // Clasificar velocidad de rotación
            if (rotacionAnual >= 12) {
              velocidad = 'muy_rapida'; // Más de 1 vez por mes
            } else if (rotacionAnual >= 6) {
              velocidad = 'rapida'; // Cada 2 meses
            } else if (rotacionAnual >= 3) {
              velocidad = 'media'; // Cada 4 meses
            } else if (rotacionAnual >= 1) {
              velocidad = 'lenta'; // Menos de 1 vez por año
            } else {
              velocidad = 'muy_lenta'; // Casi no rota
            }
          }
          
          return {
            categoria,
            rotacionAnual: parseFloat(rotacionAnual.toFixed(2)),
            diasInventario: parseFloat(diasInventario.toFixed(0)),
            velocidad,
            costoVendido: costoCategoria,
            inversionInventario: inversionCategoria
          };
        })
        .sort((a, b) => b.rotacionAnual - a.rotacionAnual);
      
      // Productos de lenta rotación (basado en las ventas del período)
      const productosRotacion = Object.entries(productoVendido)
        .map(([nombre, data]) => {
          const costosProducto = data.ventas * (data.ingreso / data.ventas * 0.7); // Estimación de costos
          return {
            nombre,
            ventasUnidades: data.ventas,
            ingresos: data.ingreso,
            costosEstimados: costosProducto,
            frecuenciaVenta: data.ventas / diasPeriodo, // Ventas por día
            clasificacion: data.ventas / diasPeriodo >= 1 ? 'alta' : 
                          data.ventas / diasPeriodo >= 0.3 ? 'media' : 'baja'
          };
        })
        .sort((a, b) => a.frecuenciaVenta - b.frecuenciaVenta); // Los de menor rotación primero
      
      return {
        global: rotacionGlobal,
        porCategoria: rotacionPorCategoria,
        productosLentaRotacion: productosRotacion.slice(0, 5), // Top 5 de lenta rotación
        productosAltaRotacion: productosRotacion.slice(-5).reverse() // Top 5 de alta rotación
      };
    };
    
    const rotacionInventario = calcularRotacionInventario();
    
    // Calcular márgenes por categoría reales
    const margenPorCategoria = Object.keys(ingresosPorCategoria)
      .filter(categoria => ingresosPorCategoria[categoria] > 0 && costosPorCategoria[categoria] > 0)
      .map(categoria => {
        const ingresos = ingresosPorCategoria[categoria];
        const costos = costosPorCategoria[categoria];
        const ganancias = ingresos - costos;
        const margen = ingresos > 0 ? (ganancias / ingresos) * 100 : 0;
        
        let rendimiento = "bajo";
        if (margen >= 30) {
          rendimiento = "alto";
        } else if (margen >= 20) {
          rendimiento = "medio";
        }
        
        return {
          categoria,
          margen: parseFloat(margen.toFixed(2)),
          rendimiento
        };
      })
      .sort((a, b) => b.margen - a.margen);
    
    // Rentabilidad temporal
    const rentabilidadTemporal = [];
    const dias = Object.keys(ingresosPorDia)
      .sort((a, b) => new Date(a) - new Date(b))
      .slice(0, 7);
    
    dias.forEach(fecha => {
      const ingresos = ingresosPorDia[fecha] || 0;
      const costos = ingresos * (1 - (rentabilidadPromedio / 100));
      const ganancias = ingresos - costos;
      const margen = ingresos > 0 ? (ganancias / ingresos) * 100 : 0;
      
      rentabilidadTemporal.push({
        fecha: new Date(fecha),
        ingresos,
        costos,
        ganancias,
        margen
      });
    });
    
    return {
      ingresosTotales,
      transacciones: ventasFiltradas.length,
      costosTotales,
      gananciasTotales,
      rentabilidadPromedio,
      valorPromedioTransaccion,
      topCategorias: categoriasOrdenadas,
      datosDisponibles: true,
      ingresosPorPeriodo: ingresosPorDia,
      ingresosPorMes,
      productosMasVendidos,
      categoriasPorVolumen,
      margenPorCategoria,
      ventasPorDiaSemana,
      rentabilidadTemporal,
      rotacionInventario // Incluir rotación de inventario en los datos optimizados
    };
  }, [ventasGlobales, calcularRangoFechas, getVentasByDateRange]);

  // 🔧 FIX: Simplificar useEffect para evitar bucles infinitos
  useEffect(() => {
    if (ventasGlobales && datosFinancierosOptimized.datosDisponibles) {
      // 🚀 CORRECIÓN: Preservar los datos de inventario al actualizar datos financieros
      setDatosFinancieros(prevState => ({
        ...datosFinancierosOptimized,
        // Mantener los datos de inventario que son independientes del filtro temporal
        inversionMercaderia: prevState.inversionMercaderia,
        inversionPorCategoria: prevState.inversionPorCategoria
      }));
      setLoading(false);
    } else if (ventasLoading) {
      setLoading(true);
    }
  }, [datosFinancierosOptimized, ventasGlobales, ventasLoading]);

  // Simplificar carga de datos de inventario
  useEffect(() => {
    obtenerDatosInventario();
  }, []); // Solo al montar el componente

  // Resetear la página actual cuando cambia el rango de tiempo
  useEffect(() => {
    setPaginaActual(1);
  }, [timeRange]);

  const obtenerDatosInventario = async () => {
    try {
      const response = await getProducts(1, Number.MAX_SAFE_INTEGER);
      const productos = response.products || response.data?.products || response.data || [];
      
      if (!productos || productos.length === 0) {
        console.warn("⚠️ No hay productos en inventario.");
        return;
      }

      procesarDatosInventario(productos);
    } catch (error) {
      console.error("Error al obtener datos de inventario:", error);
    }
  };

  const procesarDatosInventario = (productos) => {
    console.log("🔍 Procesando inventario - Total productos:", productos.length);
    let inversionTotal = 0;
    const inversionPorCategoria = {};
    
    productos.forEach(producto => {
      if (!producto) return;
      
      const categoria = producto.Categoria || producto.categoria || "Sin categoría";
      if (!inversionPorCategoria[categoria]) {
        inversionPorCategoria[categoria] = 0;
      }
      
      const precioCompra = producto.PrecioCompra || producto.precioCompra || 0;
      const stock = producto.Stock || producto.stock || 0;
      
      console.log(`📦 Producto: ${producto.Nombre} - PrecioCompra: ${precioCompra}, Stock: ${stock}`);
      
      if (precioCompra > 0 && stock > 0) {
        const valorInventario = precioCompra * stock;
        inversionTotal += valorInventario;
        inversionPorCategoria[categoria] += valorInventario;
        console.log(`💰 Valor inventario: ${valorInventario} - Total acumulado: ${inversionTotal}`);
      }
    });
    
    console.log("✅ Inversión total calculada:", inversionTotal);
    console.log("📊 Inversión por categoría:", inversionPorCategoria);
    
    // Actualizar el estado con la información de inventario
    setDatosFinancieros(prevState => ({
      ...prevState,
      inversionMercaderia: inversionTotal,
      inversionPorCategoria
    }));
  };

  const aplicarFiltroPersonalizado = () => {
    setPeriodoPersonalizado(true);
    // Los datos se recalcularán automáticamente por el useMemo cuando cambien las fechas
  };

  const handleTimeRangeChange = (e) => {
    const newTimeRange = e.target.value;
    setTimeRange(newTimeRange);
    setPeriodoPersonalizado(false); // Reset periodo personalizado al cambiar tipo
    console.log(`Cambiando período a: ${newTimeRange}`);
  };

  const handleCambioSeccion = (seccion) => {
    setSeccionActiva(seccion);
  };

  const descargarReporteFinanciero = () => {
    ExportService.generarReporteFinanciero({
      ...datosFinancieros,
      periodo: timeRange
    }, timeRange);
  };

  // Formatear valores monetarios
  const formatMoney = (value) => {
    // Verificar si el valor es undefined, null o NaN
    const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    
    // Redondear a 2 decimales para evitar problemas de precisión
    const roundedValue = Math.round(numericValue * 100) / 100;
    
    // Separar parte entera y decimal
    const parts = roundedValue.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Aplicar separador de miles (punto) a la parte entera
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Si no hay decimales o son .00, no mostrar decimales
    if (decimalPart === '00') {
      return '$' + formattedInteger;
    }
    
    // Usar coma como separador decimal
    return '$' + formattedInteger + ',' + decimalPart;
  };

  // Formatear valores porcentuales
  const formatPercent = (value) => {
    // Verificar si el valor es undefined, null o NaN
    const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    
    return numericValue.toFixed(1) + '%';
  };

  // Calcular tendencias (simuladas)
  const getTendencia = (tipo) => {
    // En una implementación real, calcularías tendencias comparando períodos
    if (tipo === 'ingresos') return Math.random() > 0.5 ? 8.3 : -5.2;
    if (tipo === 'costos') return Math.random() > 0.3 ? -3.1 : 4.7;
    if (tipo === 'ganancias') return Math.random() > 0.6 ? 12.4 : -7.8;
    return 0;
  };

  // Formatear fechas para mostrar el rango de fechas específico
  const formatFechaRango = () => {
    const { inicio, fin } = calcularRangoFechas();
    
    // Opciones para formatear fechas en español
    const opciones = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    
    const fechaInicioStr = inicio.toLocaleDateString('es-AR', opciones);
    const fechaFinStr = fin.toLocaleDateString('es-AR', opciones);
    
    return `${fechaInicioStr} - ${fechaFinStr}`;
  };

  // Función auxiliar para paginar los datos de ingresos por día
  const getPaginatedData = () => {
    if (!datosFinancieros.ingresosPorPeriodo) return [];
    
    const entradas = Object.entries(datosFinancieros.ingresosPorPeriodo);
    // Ordenar por fecha
    const entradasOrdenadas = entradas.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    
    // Calcular el número de páginas basado en el tamaño de los datos y el timeRange
    let elementosPorPagina = diasPorPagina;
    if (timeRange === "año") {
      elementosPorPagina = 31; // Ajustado para mostrar aproximadamente un mes por página
    } else if (timeRange === "mes") {
      elementosPorPagina = 15; // Medio mes por página cuando es un periodo mensual
    }
    
    // Actualizar la cantidad de días por página
    if (diasPorPagina !== elementosPorPagina) {
      setDiasPorPagina(elementosPorPagina);
    }
    
    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    
    return entradasOrdenadas.slice(inicio, fin);
  };
  
  // Calcular el número total de páginas
  const getTotalPages = () => {
    if (!datosFinancieros.ingresosPorPeriodo) return 1;
    
    const totalEntradas = Object.keys(datosFinancieros.ingresosPorPeriodo).length;
    return Math.ceil(totalEntradas / diasPorPagina);
  };
  
  // Funciones para navegar entre páginas
  const goToNextPage = () => {
    if (paginaActual < getTotalPages()) {
      setPaginaActual(paginaActual + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };
  
  // Función para obtener datos de ventas mensuales del último año completo, independientemente del filtro de periodo seleccionado
  const obtenerDatosVentasAnuales = async () => {
    try {
      const response = await obtenerVentasPorTicket();
      const todasLasVentas = response.data || [];
      
      if (!todasLasVentas || todasLasVentas.length === 0) {
        console.warn("⚠️ No hay datos de ventas disponibles para el año completo.");
        return {};
      }
      
      // Inicializar ingresos por mes (año actual)
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const ingresosPorMes = {};
      meses.forEach(mes => {
        ingresosPorMes[mes] = 0;
      });

      // Filtrar ventas del último año, independientemente del filtro general
      const hoy = new Date();
      const inicioAnio = new Date();
      inicioAnio.setFullYear(hoy.getFullYear() - 1);
      
      const ventasUltimoAnio = todasLasVentas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= inicioAnio && fechaVenta <= hoy;
      });
      
      // Procesar las ventas del año completo
      ventasUltimoAnio.forEach(venta => {
        const fecha = new Date(venta.fecha);
        const mes = meses[fecha.getMonth()];
        
        let ingresoVenta = 0;
        venta.ventas.forEach(producto => {
          ingresoVenta += producto.precioVenta * producto.cantidad;
        });
        
        // Actualizar ingresos por mes del año actual
        if (fecha.getFullYear() === new Date().getFullYear()) {
          ingresosPorMes[mes] += ingresoVenta;
        }
      });
      
      return ingresosPorMes;
    } catch (error) {
      console.error("Error al obtener datos de ventas anuales:", error);
      return {};
    }
  };
  
  // Estado para almacenar los datos de ventas mensuales anuales
  const [ingresosPorMesAnual, setIngresosPorMesAnual] = useState({});
  
  // Efecto para cargar los datos de ventas mensuales anuales cuando se monta el componente
  useEffect(() => {
    const cargarDatosAnuales = async () => {
      const datos = await obtenerDatosVentasAnuales();
      setIngresosPorMesAnual(datos);
    };
    
    cargarDatosAnuales();
  }, []);
  
  // Mostrar/ocultar tooltips
  const showTooltip = (e, tooltipText) => {
    // Obtener la posición del botón en relación con la ventana
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Posicionar el tooltip debajo del botón
    setTooltipPosition({
      top: rect.bottom + 10,
      left: rect.left + (rect.width / 2)
    });
    
    setActiveTooltip(tooltipText);
  };
  
  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  // Alternar entre vista de gráfico y tabla
  const toggleTableView = (cardId) => {
    setVerTabla(prevState => ({
      ...prevState,
      [cardId]: !prevState[cardId] // Toggle individual para cada tarjeta
    }));
  };
  
  // Información para tooltips
  const tooltipInfo = {
    ingresosTotales: "Total de dinero recibido por ventas en el período seleccionado, sin considerar costos.",
    costosTotales: "Total de costos asociados a los productos vendidos, incluyendo precio de compra.",
    gananciasTotales: "Diferencia entre ingresos y costos, representa el beneficio neto.",
    inversionInventario: "Valor total del inventario actual a precio de compra.",
    transacciones: "Número total de ventas realizadas en el período seleccionado.",
    rentabilidad: "Porcentaje de ganancia respecto a los ingresos totales.",
    categoriasPrincipales: "Categorías con mayor volumen de ventas ordenadas por ingresos.",
    distribucionDias: "Ingresos diarios durante el período seleccionado.",
    ventasDiaSemana: "Distribución de ventas según el día de la semana.",
    ventasMensuales: "Ingresos mensuales durante el año actual.",
    productosMasVendidos: "Productos con mayor cantidad de unidades vendidas.",
    categoriasPorVolumen: "Categorías ordenadas por cantidad de unidades vendidas.",
    inversionPorCategoria: "Valor del inventario actual distribuido por categorías.",
    rotacionInventario: "Métrica que indica cuántas veces se renueva tu inventario en un año. Una rotación alta (6x o más) significa que vendes tu inventario rápidamente, lo que mejora tu flujo de caja. Una rotación baja (menos de 3x) indica que tienes capital inmovilizado. También muestra los días de cobertura: cuántos días puedes operar con tu stock actual al ritmo de ventas actual.",
    margenPorCategoria: "Porcentaje de ganancia por categoría de productos. Los valores superiores al 30% se consideran de alto rendimiento (verde), entre 20-30% de rendimiento medio (amarillo) y menores al 20% de rendimiento bajo (rojo). Permite identificar qué categorías generan mayor rentabilidad para priorizar la inversión o ajustar precios en aquellas con margen bajo.",
    comparativaFinanciera: "Visualización de la relación entre ingresos, costos y ganancias para el período seleccionado. La barra completa representa el 100% de los ingresos, mientras que las barras de costos y ganancias muestran su proporción respecto a los ingresos. Permite evaluar rápidamente la estructura financiera del negocio e identificar oportunidades para mejorar márgenes."
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container" ref={containerRef}>
        {loading ? (
          <FinanzasSkeleton />
        ) : (
          <>
            <div className="page-header">
              <div className="title-container">
                <h1 className="page-title">Dashboard Financiero</h1>
                <p className="page-subtitle">Analiza el rendimiento económico y tendencias de ventas de tu negocio</p>
              </div>
              <button className="btn-export-pdf" onClick={descargarReporteFinanciero}>
                <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
              </button>
            </div>
            
            <div className="filters-container" style={{ alignSelf: 'flex-start' }}>
              <div className="filter-group">
                <label className="form-label">Periodo:</label>
                <select 
                  value={timeRange} 
                  onChange={handleTimeRangeChange}
                  className="form-select"
                >
                  <option value="semana">Semana</option>
                  <option value="mes">Mes</option>
                  <option value="año">Año</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>
              
              {/* Filtros específicos por tipo de período */}
              {timeRange === "semana" && (
                <div className="filter-group">
                  <label className="form-label">Seleccionar:</label>
                  <select 
                    value={seleccionSemana} 
                    onChange={(e) => setSeleccionSemana(parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value="0">Esta semana</option>
                    <option value="-1">Semana anterior</option>
                    <option value="-2">Hace 2 semanas</option>
                    <option value="-3">Hace 3 semanas</option>
                    <option value="-4">Hace 4 semanas</option>
                  </select>
                </div>
              )}
              
              {timeRange === "mes" && (
                <>
                  <div className="filter-group">
                    <label className="form-label">Mes:</label>
                    <select 
                      value={seleccionMes.mes} 
                      onChange={(e) => setSeleccionMes({...seleccionMes, mes: parseInt(e.target.value)})}
                      className="form-select"
                    >
                      <option value="0">Enero</option>
                      <option value="1">Febrero</option>
                      <option value="2">Marzo</option>
                      <option value="3">Abril</option>
                      <option value="4">Mayo</option>
                      <option value="5">Junio</option>
                      <option value="6">Julio</option>
                      <option value="7">Agosto</option>
                      <option value="8">Septiembre</option>
                      <option value="9">Octubre</option>
                      <option value="10">Noviembre</option>
                      <option value="11">Diciembre</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label className="form-label">Año:</label>
                    <select 
                      value={seleccionMes.anio} 
                      onChange={(e) => setSeleccionMes({...seleccionMes, anio: parseInt(e.target.value)})}
                      className="form-select"
                    >
                      {[...Array(6)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                </>
              )}
              
              {timeRange === "año" && (
                <>
                  <div className="filter-group">
                    <label className="form-label">Año:</label>
                    <select 
                      value={seleccionAnio.anio} 
                      onChange={(e) => setSeleccionAnio({...seleccionAnio, anio: parseInt(e.target.value)})}
                      className="form-select"
                    >
                      {[...Array(6)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label className="form-label">Periodo:</label>
                    <select 
                      value={seleccionAnio.trimestre} 
                      onChange={(e) => setSeleccionAnio({...seleccionAnio, trimestre: parseInt(e.target.value)})}
                      className="form-select"
                    >
                      <option value="0">Año completo</option>
                      <option value="1">Primer trimestre</option>
                      <option value="2">Segundo trimestre</option>
                      <option value="3">Tercer trimestre</option>
                      <option value="4">Cuarto trimestre</option>
                    </select>
                  </div>
                </>
              )}
              
              {timeRange === "personalizado" && (
                <>
                  <div className="filter-group filter-date">
                    <label className="form-label">Desde:</label>
                    <input 
                      type="date" 
                      value={fechaInicio.toISOString().split('T')[0]} 
                      onChange={(e) => setFechaInicio(new Date(e.target.value))}
                      className="form-date-input"
                    />
                  </div>
                  <div className="filter-group filter-date">
                    <label className="form-label">Hasta:</label>
                    <input 
                      type="date" 
                      value={fechaFin.toISOString().split('T')[0]} 
                      onChange={(e) => setFechaFin(new Date(e.target.value))}
                      className="form-date-input"
                    />
                  </div>
                  <div className="filter-group">
                    <button 
                      className="btn-apply-filter"
                      onClick={aplicarFiltroPersonalizado}
                    >
                      Aplicar
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Navegación entre secciones */}
            <div className="finanzas-nav">
              <button 
                className={`finanzas-nav-btn ${seccionActiva === 'general' ? 'active' : ''}`}
                onClick={() => handleCambioSeccion('general')}
              >
                <FontAwesomeIcon icon={faChartPie} /> General
              </button>
              <button 
                className={`finanzas-nav-btn ${seccionActiva === 'ingresos' ? 'active' : ''}`}
                onClick={() => handleCambioSeccion('ingresos')}
              >
                <FontAwesomeIcon icon={faCoins} /> Ingresos
              </button>
              <button 
                className={`finanzas-nav-btn ${seccionActiva === 'productos' ? 'active' : ''}`}
                onClick={() => handleCambioSeccion('productos')}
              >
                <FontAwesomeIcon icon={faBoxOpen} /> Productos
              </button>
              <button 
                className={`finanzas-nav-btn ${seccionActiva === 'rentabilidad' ? 'active' : ''}`}
                onClick={() => handleCambioSeccion('rentabilidad')}
              >
                <FontAwesomeIcon icon={faPercent} /> Rentabilidad
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* SECCIÓN GENERAL - Resumen financiero y métricas principales */}
            {seccionActiva === 'general' && (
              <div className="finanzas-section">
                <h2 className="section-title">Resumen financiero</h2>
                
                {/* Tarjetas de métricas principales */}
                <div className="stats-cards">
                  <div className="stat-card primary">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faCoins} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Ingresos totales</h3>
                      </div>
                    </div>
                    <div className="stat-value">{formatMoney(datosFinancieros.ingresosTotales)}</div>
                    <div className="stat-caption">
                      <FontAwesomeIcon icon={faCalendarAlt} /> {formatFechaRango()}
                    </div>
                  </div>

                  <div className="stat-card danger">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faMoneyBillWave} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Costos totales</h3>
                      </div>
                    </div>
                    <div className="stat-value">{formatMoney(datosFinancieros.costosTotales)}</div>
                    <div className="stat-caption">
                      <FontAwesomeIcon icon={faCalendarAlt} /> {formatFechaRango()}
                    </div>
                  </div>

                  <div className="stat-card success">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Ganancias totales</h3>
                      </div>
                    </div>
                    <div className="stat-value">{formatMoney(datosFinancieros.gananciasTotales)}</div>
                    <div className="stat-caption">
                      <FontAwesomeIcon icon={faCalendarAlt} /> {formatFechaRango()}
                    </div>
                  </div>
                </div>

                {/* Segunda fila de métricas */}
                <div className="stats-cards">
                  <div className="stat-card warning">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faWarehouse} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Inversión en inventario</h3>
                      </div>
                    </div>
                    <div className="stat-value">{formatMoney(datosFinancieros.inversionMercaderia)}</div>
                    <div className="stat-caption">
                      <div className="inventory-info">Total de productos en stock</div>
                    </div>
                  </div>

                  <div className="stat-card info">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faShoppingCart} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Transacciones</h3>
                      </div>
                    </div>
                    <div className="stat-value">{datosFinancieros.transacciones}</div>
                    <div className="stat-caption">
                      <div className="transactions-info">Promedio: {formatMoney(datosFinancieros.valorPromedioTransaccion)}</div>
                    </div>
                  </div>

                  <div className="stat-card secondary">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faPercentage} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Rentabilidad</h3>
                      </div>
                    </div>
                    <div className="stat-value">{formatPercent(datosFinancieros.rentabilidadPromedio)}</div>
                    <div className="stat-caption">
                      <div className="roi-info">Retorno sobre inversión</div>
                    </div>
                  </div>
                </div>
                
                {/* Resumen por categoría */}
                <div className="category-summary-container">
                  <h2 className="section-title">Categorías principales</h2>
                  
                  <div className="category-cards">
                    {datosFinancieros.topCategorias.map((categoria, index) => (
                      <div key={index} className="category-card">
                        <div className="category-card-header">
                          <div className="category-name">{categoria.nombre}</div>
                          <div className="category-percent">{formatPercent(categoria.porcentaje)}</div>
                        </div>
                        <div className="category-value">{formatMoney(categoria.ingresos)}</div>
                        <div className="progress-bar">
                          <div className="progress" style={{ width: `${categoria.porcentaje}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN INGRESOS - Detalles de ventas e ingresos */}
            {seccionActiva === 'ingresos' && (
              <div className="finanzas-section">
                <h2 className="section-title">Análisis de ingresos</h2>
                
                <div className="section-cards">
                  <div className="analysis-card">
                    <h3 className="card-title">Ventas por día de la semana</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, tooltipInfo.ventasDiaSemana)}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('ventasDiaSemana')}
                    >
                      <FontAwesomeIcon icon={verTabla === 'ventasDiaSemana' ? faChartBar : faTable} />
                      {verTabla === 'ventasDiaSemana' ? ' Ver gráfico' : ' Ver tabla'}
                    </button>

                    {verTabla.ventasDiaSemana ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Día de la semana</th>
                            <th>Ingresos</th>
                            <th>Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            if (!datosFinancieros.ventasPorDiaSemana) return null;
                            
                            const totalVentasSemana = Object.values(datosFinancieros.ventasPorDiaSemana).reduce((sum, valor) => sum + valor, 0);
                            const diasOrdenados = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                            const diasCompletos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                            
                            return diasOrdenados.map((dia, index) => {
                              const valor = datosFinancieros.ventasPorDiaSemana[dia] || 0;
                              const porcentaje = totalVentasSemana > 0 ? (valor / totalVentasSemana) * 100 : 0;
                              
                              return (
                                <tr key={index}>
                                  <td>{diasCompletos[index]}</td>
                                  <td>{formatMoney(valor)}</td>
                                  <td>{porcentaje.toFixed(1)}%</td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    ) : (
                      <div className="category-volume">
                        {datosFinancieros.ventasPorDiaSemana ? (
                          // Verificar si hay datos de ventas
                          Object.values(datosFinancieros.ventasPorDiaSemana).some(valor => valor > 0) ? (
                            (() => {
                              // Calcular el total de ventas para porcentajes
                              const totalVentasSemana = Object.values(datosFinancieros.ventasPorDiaSemana).reduce((sum, valor) => sum + valor, 0);
                              
                              // Orden fijo de los días
                              const diasOrdenados = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                              
                              return diasOrdenados.map((dia, index) => {
                                // Obtener el valor asignado a este día o 0 si no existe
                                const valor = datosFinancieros.ventasPorDiaSemana[dia] || 0;
                                
                                // Calcular el porcentaje de este día respecto al total
                                const porcentaje = totalVentasSemana > 0 ? (valor / totalVentasSemana) * 100 : 0;
                                
                                return (
                                  <div key={index} className="category-volume-item">
                                    <div className="category-volume-info">
                                      <div className="category-volume-name">{dia}</div>
                                      <div className="category-volume-count">{formatMoney(valor)}</div>
                                    </div>
                                    <div className="category-volume-bar-container">
                                      <div 
                                        className="category-volume-bar" 
                                        style={{ 
                                          width: `${Math.max(2, porcentaje)}%`,
                                          backgroundColor: index >= 5 ? '#ff9f1c' : '#4f86c6' // Colores diferentes para fin de semana
                                        }}
                                      ></div>
                                      <span className="category-volume-percent">{porcentaje.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                );
                              });
                            })()
                          ) : (
                            <div className="no-data">No hay ventas registradas en este período</div>
                          )
                        ) : (
                          <div className="no-data">Cargando datos...</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="analysis-card">
                    <h3 className="card-title">Ventas mensuales (año actual)</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, tooltipInfo.ventasMensuales)}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('ventasMensuales')}
                    >
                      <FontAwesomeIcon icon={verTabla.ventasMensuales ? faChartBar : faTable} />
                      {verTabla.ventasMensuales ? ' Ver gráfico' : ' Ver tabla'}
                    </button>

                    {verTabla.ventasMensuales ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Mes</th>
                            <th>Ingresos</th>
                            <th>Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(ingresosPorMesAnual).map(([mes, valor], index) => {
                            const totalIngresos = Object.values(ingresosPorMesAnual).reduce((a, b) => a + b, 0);
                            const porcentaje = totalIngresos > 0 ? (valor / totalIngresos) * 100 : 0;
                            
                            return (
                              <tr key={index}>
                                <td>{mes}</td>
                                <td>{formatMoney(valor)}</td>
                                <td>{porcentaje.toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="category-volume">
                        {Object.entries(ingresosPorMesAnual).map(([mes, valor], index) => {
                          const porcentaje = Object.values(ingresosPorMesAnual).reduce((a, b) => a + b, 0) > 0 
                            ? (valor / Object.values(ingresosPorMesAnual).reduce((a, b) => a + b, 0)) * 100 
                            : 0;
                            
                          return (
                            <div key={index} className="category-volume-item">
                              <div className="category-volume-info">
                                <div className="category-volume-name">{mes.substring(0, 3)}</div>
                                <div className="category-volume-count">{formatMoney(valor)}</div>
                              </div>
                              <div className="category-volume-bar-container">
                                <div className="category-volume-bar" style={{ width: `${Math.max(2, porcentaje)}%` }}></div>
                                <span className="category-volume-percent">{porcentaje.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN PRODUCTOS - Análisis de productos */}
            {seccionActiva === 'productos' && (
              <div className="finanzas-section">
                <h2 className="section-title">Análisis de productos</h2>
                
                <div className="section-cards">
                  <div className="analysis-card">
                    <h3 className="card-title">Productos más vendidos</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, tooltipInfo.productosMasVendidos)}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('productosMasVendidos')}
                    >
                      <FontAwesomeIcon icon={verTabla.productosMasVendidos ? faChartBar : faTable} />
                      {verTabla.productosMasVendidos ? ' Ver lista' : ' Ver tabla'}
                    </button>

                    {verTabla.productosMasVendidos ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Ranking</th>
                            <th>Producto</th>
                            <th>Unidades vendidas</th>
                            <th>Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datosFinancieros.productosMasVendidos.length > 0 ? (
                            datosFinancieros.productosMasVendidos.map((producto, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{producto.nombre}</td>
                                <td>{producto.ventas}</td>
                                <td>{formatMoney(producto.ingreso)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="no-data">No hay datos disponibles</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <div className="product-list">
                        {datosFinancieros.productosMasVendidos.length > 0 ? (
                          datosFinancieros.productosMasVendidos.map((producto, index) => (
                            <div key={index} className="product-item">
                              <div className="product-rank">{index + 1}</div>
                              <div className="product-info">
                                <div className="product-name">{producto.nombre}</div>
                                <div className="product-meta">{producto.ventas} unidades vendidas</div>
                              </div>
                              <div className="product-revenue">{formatMoney(producto.ingreso)}</div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data">No hay datos disponibles para el período seleccionado</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="analysis-card">
                    <h3 className="card-title">Categorías por volumen</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, tooltipInfo.categoriasPorVolumen)}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('categoriasPorVolumen')}
                    >
                      <FontAwesomeIcon icon={verTabla.categoriasPorVolumen ? faChartBar : faTable} />
                      {verTabla.categoriasPorVolumen ? ' Ver gráfico' : ' Ver tabla'}
                    </button>

                    {verTabla.categoriasPorVolumen ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Categoría</th>
                            <th>Unidades vendidas</th>
                            <th>Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datosFinancieros.categoriasPorVolumen.length > 0 ? (
                            datosFinancieros.categoriasPorVolumen.map((categoria, index) => (
                              <tr key={index}>
                                <td>{categoria.nombre}</td>
                                <td>{categoria.ventas}</td>
                                <td>{categoria.porcentaje.toFixed(1)}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="no-data">No hay datos disponibles</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <div className="category-volume">
                        {datosFinancieros.categoriasPorVolumen.length > 0 ? (
                          datosFinancieros.categoriasPorVolumen.map((categoria, index) => (
                            <div key={index} className="category-volume-item">
                              <div className="category-volume-info">
                                <div className="category-volume-name">{categoria.nombre}</div>
                                <div className="category-volume-count">{categoria.ventas} unidades</div>
                              </div>
                              <div className="category-volume-bar-container">
                                <div className="category-volume-bar" style={{ width: `${categoria.porcentaje}%` }}></div>
                                <span className="category-volume-percent">{categoria.porcentaje.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data">No hay datos disponibles para el período seleccionado</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="section-cards">
                  <div className="analysis-card">
                    <h3 className="card-title">Inversión por categoría</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, tooltipInfo.inversionPorCategoria)}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('inversionPorCategoria')}
                    >
                      <FontAwesomeIcon icon={verTabla.inversionPorCategoria ? faChartBar : faTable} />
                      {verTabla.inversionPorCategoria ? ' Ver gráfico' : ' Ver tabla'}
                    </button>

                    {verTabla.inversionPorCategoria ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Categoría</th>
                            <th>Inversión</th>
                            <th>Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(datosFinancieros.inversionPorCategoria || {})
                            .sort(([, a], [, b]) => b - a)
                            .map(([categoria, valor], index) => {
                              const porcentaje = datosFinancieros.inversionMercaderia > 0 
                                ? (valor / datosFinancieros.inversionMercaderia) * 100 
                                : 0;
                                
                              return (
                                <tr key={index}>
                                  <td>{categoria}</td>
                                  <td>{formatMoney(valor)}</td>
                                  <td>{porcentaje.toFixed(1)}%</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="inventory-distribution">
                        {Object.entries(datosFinancieros.inversionPorCategoria || {})
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([categoria, valor], index) => {
                            const porcentaje = datosFinancieros.inversionMercaderia > 0 
                              ? (valor / datosFinancieros.inversionMercaderia) * 100 
                              : 0;
                              
                            return (
                              <div key={index} className="inventory-category">
                                <div className="inventory-category-header">
                                  <span className="inventory-category-name">{categoria}</span>
                                  <span className="inventory-category-value">{formatMoney(valor)}</span>
                                </div>
                                <div className="inventory-progress-container">
                                  <div className="inventory-progress" style={{ width: `${porcentaje}%` }}></div>
                                  <span className="inventory-percent">{porcentaje.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* 🔄 NUEVA FUNCIONALIDAD: Rotación de Inventario */}
                  <div className="analysis-card">
                    <h3 className="card-title">Rotación de inventario</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, tooltipInfo.rotacionInventario)}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('rotacionInventario')}
                    >
                      <FontAwesomeIcon icon={verTabla === 'rotacionInventario' ? faChartBar : faTable} />
                      {verTabla === 'rotacionInventario' ? ' Ver resumen' : ' Ver tabla'}
                    </button>

                    {verTabla !== 'rotacionInventario' ? (
                      <div className="inventory-turnover">
                        {/* Métrica global de rotación */}
                        <div className="turnover-global">
                          <div className="turnover-metric">
                            <div className="turnover-label">Rotación anual global</div>
                            <div className="turnover-value">
                              {datosFinancieros.rotacionInventario?.global?.rotacionAnual?.toFixed(1) || '0.0'}x
                            </div>
                            <div className="turnover-caption">
                              {datosFinancieros.rotacionInventario?.global?.diasInventario 
                                ? `${Math.round(datosFinancieros.rotacionInventario.global.diasInventario)} días de cobertura`
                                : 'Sin datos suficientes'
                              }
                            </div>
                          </div>
                        </div>

                        {/* Top categorías por rotación */}
                        <div className="turnover-categories">
                          {datosFinancieros.rotacionInventario?.porCategoria?.slice(0, 5).map((cat, index) => (
                            <div key={index} className="turnover-category-item">
                              <div className="turnover-category-info">
                                <span className="turnover-category-name">{cat.categoria}</span>
                                <span className={`turnover-velocity ${cat.velocidad}`}>
                                  {cat.velocidad === 'muy_rapida' ? 'Muy Rápida' :
                                   cat.velocidad === 'rapida' ? 'Rápida' :
                                   cat.velocidad === 'media' ? 'Media' :
                                   cat.velocidad === 'lenta' ? 'Lenta' : 'Muy Lenta'}
                                </span>
                              </div>
                              <div className="turnover-metrics">
                                <span className="turnover-rate">{cat.rotacionAnual}x/año</span>
                                <span className="turnover-days">{cat.diasInventario} días</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Categoría</th>
                            <th>Rotación anual</th>
                            <th>Días inventario</th>
                            <th>Velocidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datosFinancieros.rotacionInventario?.porCategoria?.map((cat, index) => (
                            <tr key={index}>
                              <td>{cat.categoria}</td>
                              <td>{cat.rotacionAnual}x</td>
                              <td>{cat.diasInventario} días</td>
                              <td>
                                <span className={`velocity-badge ${cat.velocidad}`}>
                                  {cat.velocidad === 'muy_rapida' ? 'Muy Rápida' :
                                   cat.velocidad === 'rapida' ? 'Rápida' :
                                   cat.velocidad === 'media' ? 'Media' :
                                   cat.velocidad === 'lenta' ? 'Lenta' : 'Muy Lenta'}
                                </span>
                              </td>
                            </tr>
                          )) || (
                            <tr>
                              <td colSpan="4" className="no-data">No hay datos disponibles</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* 🔄 NUEVA SECCIÓN: Productos de lenta y alta rotación */}
                <div className="section-cards">
                  <div className="analysis-card">
                    <h3 className="card-title">Productos de lenta rotación</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, "Productos que se venden con menor frecuencia. Considera promocionar, reducir stock o discontinuar estos productos para optimizar tu capital de trabajo y reducir costos de almacenamiento.")}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('productosLentaRotacion')}
                    >
                      <FontAwesomeIcon icon={verTabla === 'productosLentaRotacion' ? faChartBar : faTable} />
                      {verTabla === 'productosLentaRotacion' ? ' Ver lista' : ' Ver tabla'}
                    </button>

                    {verTabla !== 'productosLentaRotacion' ? (
                      <div className="product-list">
                        {datosFinancieros.rotacionInventario?.productosLentaRotacion?.length > 0 ? (
                          datosFinancieros.rotacionInventario.productosLentaRotacion.map((producto, index) => (
                            <div key={index} className="product-item slow-rotation">
                              <div className="product-rank">{index + 1}</div>
                              <div className="product-info">
                                <div className="product-name">{producto.nombre}</div>
                                <div className="product-meta">
                                  {producto.ventasUnidades} unidades | {producto.frecuenciaVenta.toFixed(2)} ventas/día
                                </div>
                              </div>
                              <div className={`product-classification ${producto.clasificacion}`}>
                                {producto.clasificacion === 'alta' ? 'Alta' :
                                 producto.clasificacion === 'media' ? 'Media' : 'Baja'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data">No hay datos disponibles para el período seleccionado</div>
                        )}
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Ranking</th>
                            <th>Producto</th>
                            <th>Unidades vendidas</th>
                            <th>Ventas por día</th>
                            <th>Clasificación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datosFinancieros.rotacionInventario?.productosLentaRotacion?.length > 0 ? (
                            datosFinancieros.rotacionInventario.productosLentaRotacion.map((producto, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{producto.nombre}</td>
                                <td>{producto.ventasUnidades}</td>
                                <td>{producto.frecuenciaVenta.toFixed(2)}</td>
                                <td>
                                  <span className={`product-classification ${producto.clasificacion}`}>
                                    {producto.clasificacion === 'alta' ? 'Alta' :
                                     producto.clasificacion === 'media' ? 'Media' : 'Baja'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="no-data">No hay datos disponibles</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="analysis-card">
                    <h3 className="card-title">Productos de alta rotación</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, "Productos que se venden con mayor frecuencia y generan más flujo de caja. Asegúrate de mantener stock suficiente y considera incrementar el inventario de estos productos estrella para maximizar ventas.")}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('productosAltaRotacion')}
                    >
                      <FontAwesomeIcon icon={verTabla === 'productosAltaRotacion' ? faChartBar : faTable} />
                      {verTabla === 'productosAltaRotacion' ? ' Ver lista' : ' Ver tabla'}
                    </button>

                    {verTabla !== 'productosAltaRotacion' ? (
                      <div className="product-list">
                        {datosFinancieros.rotacionInventario?.productosAltaRotacion?.length > 0 ? (
                          datosFinancieros.rotacionInventario.productosAltaRotacion.map((producto, index) => (
                            <div key={index} className="product-item high-rotation">
                              <div className="product-rank">{index + 1}</div>
                              <div className="product-info">
                                <div className="product-name">{producto.nombre}</div>
                                <div className="product-meta">
                                  {producto.ventasUnidades} unidades | {producto.frecuenciaVenta.toFixed(2)} ventas/día
                                </div>
                              </div>
                              <div className={`product-classification ${producto.clasificacion}`}>
                                {producto.clasificacion === 'alta' ? 'Alta' :
                                 producto.clasificacion === 'media' ? 'Media' : 'Baja'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data">No hay datos disponibles para el período seleccionado</div>
                        )}
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Ranking</th>
                            <th>Producto</th>
                            <th>Unidades vendidas</th>
                            <th>Ventas por día</th>
                            <th>Clasificación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datosFinancieros.rotacionInventario?.productosAltaRotacion?.length > 0 ? (
                            datosFinancieros.rotacionInventario.productosAltaRotacion.map((producto, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{producto.nombre}</td>
                                <td>{producto.ventasUnidades}</td>
                                <td>{producto.frecuenciaVenta.toFixed(2)}</td>
                                <td>
                                  <span className={`product-classification ${producto.clasificacion}`}>
                                    {producto.clasificacion === 'alta' ? 'Alta' :
                                     producto.clasificacion === 'media' ? 'Media' : 'Baja'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="no-data">No hay datos disponibles</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN RENTABILIDAD - Análisis de rentabilidad */}
            {seccionActiva === 'rentabilidad' && (
              <div className="finanzas-section">
                <h2 className="section-title">Análisis de rentabilidad</h2>
                
                <div className="section-cards">
                  <div className="analysis-card">
                                       <h3 className="card-title">Margen de ganancia por categoría</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, tooltipInfo.margenPorCategoria)}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('margenPorCategoria')}
                    >
                      <FontAwesomeIcon icon={verTabla === 'margenPorCategoria' ? faChartBar : faTable} />
                      {verTabla === 'margenPorCategoria' ? ' Ver gráfico' : ' Ver tabla'}
                    </button>

                    {verTabla.margenPorCategoria ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Categoría</th>
                            <th>Margen de ganancia</th>
                            <th>Rendimiento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datosFinancieros.margenPorCategoria.length > 0 ? (
                            datosFinancieros.margenPorCategoria.map((cat, index) => (
                              <tr key={index}>
                                <td>{cat.categoria}</td>
                                <td>{cat.margen.toFixed(2)}%</td>
                                <td>
                                  <span className={`velocity-badge ${cat.rendimiento}`}>
                                    {cat.rendimiento === 'alto' ? 'Alto' :
                                     cat.rendimiento === 'medio' ? 'Medio' : 'Bajo'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="no-data">No hay datos disponibles</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <div className="margin-by-category">
                        {datosFinancieros.margenPorCategoria.map((cat, index) => (
                          <div key={index} className="margin-category">
                            <div className="margin-category-name">{cat.categoria}</div>
                            <div className="margin-meter-container">
                              <div 
                                className={`margin-meter ${cat.rendimiento}`}
                                style={{ width: `${cat.margen * 2}px` }}
                              ></div>
                              <span className="margin-value">{cat.margen}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="analysis-card">
                    <h3 className="card-title">Comparativa Ingresos vs. Costos</h3>
                    <button 
                      className="info-button"
                      onMouseEnter={(e) => showTooltip(e, tooltipInfo.comparativaFinanciera)}
                      onMouseLeave={hideTooltip}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </button>
                    <button 
                      className="toggle-view-btn"
                      onClick={() => toggleTableView('comparativaFinanciera')}
                    >
                      <FontAwesomeIcon icon={verTabla === 'comparativaFinanciera' ? faChartBar : faTable} />
                      {verTabla === 'comparativaFinanciera' ? ' Ver gráfico' : ' Ver tabla'}
                    </button>

                    {verTabla.comparativaFinanciera ? (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Concepto</th>
                            <th>Monto</th>
                            <th>Porcentaje sobre ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Ingresos totales</td>
                            <td>{formatMoney(datosFinancieros.ingresosTotales)}</td>
                            <td>100.0%</td>
                          </tr>
                          <tr>
                            <td>Costos totales</td>
                            <td>{formatMoney(datosFinancieros.costosTotales)}</td>
                            <td>
                              {datosFinancieros.ingresosTotales > 0 
                                ? ((datosFinancieros.costosTotales / datosFinancieros.ingresosTotales) * 100).toFixed(1)
                                : '0.0'
                              }%
                            </td>
                          </tr>
                          <tr>
                            <td>Ganancias netas</td>
                            <td>{formatMoney(datosFinancieros.gananciasTotales)}</td>
                            <td>
                              {datosFinancieros.ingresosTotales > 0 
                                ? ((datosFinancieros.gananciasTotales / datosFinancieros.ingresosTotales) * 100).toFixed(1)
                                : '0.0'
                              }%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <div className="comparison-stats">
                        <div className="comparison-stat">
                          <div className="comparison-header">
                            <div className="comparison-label">Ingresos</div>
                            <div className="comparison-value">{formatMoney(datosFinancieros.ingresosTotales)}</div>
                          </div>
                          <div className="comparison-bar-container">
                            <div className="comparison-bar income" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                        
                        <div className="comparison-stat">
                          <div className="comparison-header">
                            <div className="comparison-label">Costos</div>
                            <div className="comparison-value">{formatMoney(datosFinancieros.costosTotales)}</div>
                          </div>
                          <div className="comparison-bar-container">
                            <div 
                              className="comparison-bar expenses" 
                              style={{ width: `${(datosFinancieros.costosTotales / Math.max(datosFinancieros.ingresosTotales, 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="comparison-stat">
                          <div className="comparison-header">
                            <div className="comparison-label">Ganancias</div>
                            <div className="comparison-value">{formatMoney(datosFinancieros.gananciasTotales)}</div>
                          </div>
                          <div className="comparison-bar-container">
                            <div 
                              className="comparison-bar profits" 
                              style={{ width: `${(datosFinancieros.gananciasTotales / Math.max(datosFinancieros.ingresosTotales, 1)) * 100}%` }}
                            ></div>
                          </div>
                          <div className="comparison-percentage">
                            Margen de ganancia: <span className="profit-percentage">{formatPercent(datosFinancieros.rentabilidadPromedio)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tooltip de información */}
            {activeTooltip && (
              <div className="tooltip" style={{ top: tooltipPosition.top, left: tooltipPosition.left }}>
                {activeTooltip}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Finanzas;