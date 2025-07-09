import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

// Función helper para formatear números con punto como separador de miles
const formatNumberWithDots = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export class ExportService {
  /**
   * Genera un reporte de cierre de caja en PDF
   * @param {Object} data - Datos necesarios para generar el reporte
   * @returns {boolean} - true si el reporte se generó exitosamente
   */
  static generarReporteCierreCaja(data) {
    try {
      const {
        usuarioActual,
        sessionStartTime,
        horaFinFormateada,
        fechaFormateada,
        ventasSesion,
        deudoresData,
        resumenCajaData,
        balanceEfectivo,
        tienePermisoHistorial = true // Por defecto asumimos que tiene permisos completos
      } = data;
      
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Título y fecha - adaptado según permisos
      doc.setFontSize(18);
      const titulo = tienePermisoHistorial 
        ? "La Despensa - Reporte de Cierre de Caja"
        : "La Despensa - Reporte de Actividad de Sesión";
      doc.text(titulo, 14, 15);
      
      doc.setFontSize(12);
      doc.text(`Fecha: ${fechaFormateada}`, 14, 25);
      const horaInicioFormateada = new Date(sessionStartTime).toLocaleTimeString();
      doc.text(`Periodo: ${horaInicioFormateada} a ${horaFinFormateada}`, 14, 32);
      doc.text(`Usuario: ${usuarioActual.email}`, 14, 39);
      
      // Nota sobre permisos limitados si aplica
      if (!tienePermisoHistorial) {
        doc.setFontSize(10);
        doc.setTextColor(200, 100, 0); // Color naranja para advertencia
        doc.text("* Reporte con datos limitados según permisos de usuario", 14, 46);
        doc.setTextColor(0, 0, 0); // Volver a negro
        doc.setFontSize(12);
      }
      
      // Resumen de ventas y operaciones
      doc.setFontSize(14);
      const yPosTitle = tienePermisoHistorial ? 50 : 55;
      doc.text("Resumen de Operaciones", 14, yPosTitle);
      
      // Tabla de resumen
      autoTable(doc, {
        startY: yPosTitle + 5,
        head: [["Concepto", "Cantidad", "Monto"]],
        body: resumenCajaData.slice(1), // Omitir la fila de encabezado
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 38, 81] },
      });
      
      // Calcular el balance total
      doc.setFontSize(12);
      doc.text(`Balance en Efectivo: $${formatNumberWithDots(balanceEfectivo)}`, 14, doc.lastAutoTable.finalY + 15);
      
      // Si hay datos de deudores, añadir una sección
      if (deudoresData.length > 0) {
        doc.setFontSize(14);
        doc.text("Movimientos de Deudores", 14, doc.lastAutoTable.finalY + 30);
        
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 35,
          head: [["Deudor", "Tipo", "Monto", "Comentario"]],
          body: deudoresData,
        });
      }
      
      // Añadir información adicional
      doc.setFontSize(10);
      // 🔧 FIX: Corregir cálculo de transacciones para evitar duplicar ventas a deudores
      // Las ventas a deudores ya están contadas en ventasSesion, no hay que contarlas otra vez
      const ventasRegulares = ventasSesion.filter(venta => !venta.deudorId).length;
      const ventasADeudores = ventasSesion.filter(venta => venta.deudorId).length;
      
      // Solo contar los pagos y otros movimientos que NO sean creación de deuda por ventas
      const movimientosDeudoresSinVentas = deudoresData.filter(movimiento => 
        !movimiento[1].includes('Aumento de deuda') // Excluir "Aumento de deuda" que corresponden a ventas
      ).length;
      
      const totalTransacciones = ventasRegulares + ventasADeudores + movimientosDeudoresSinVentas;
      doc.text(`Total de transacciones: ${totalTransacciones}`, 14, doc.lastAutoTable.finalY + 30);
      doc.text(`Período del reporte: ${sessionStartTime.toLocaleString('es-ES')} - ${new Date().toLocaleString('es-ES')}`, 14, doc.lastAutoTable.finalY + 40);
      
      // Nota adicional sobre limitaciones si no tiene permisos completos
      if (!tienePermisoHistorial) {
        doc.setTextColor(150, 150, 150); // Color gris
        doc.text(`Nota: Este reporte incluye solo datos de deudores y operaciones`, 14, doc.lastAutoTable.finalY + 50);
        doc.text(`disponibles para el rol actual (${usuarioActual.roles?.[0]?.name || 'empleado'}).`, 14, doc.lastAutoTable.finalY + 60);
        doc.setTextColor(0, 0, 0); // Volver a negro
      }
      
      // Pie de página con información del usuario
      doc.text(`Reporte generado por: ${usuarioActual.email} - ${new Date().toLocaleString('es-ES')}`, 14, doc.internal.pageSize.height - 10);
      
      // Guardar el PDF con nombre descriptivo
      const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
      const tipoReporte = tienePermisoHistorial ? 'Cierre_Caja' : 'Actividad_Sesion';
      doc.save(`${tipoReporte}_${usuarioActual.email}_${timestamp}.pdf`);
      
      return true;
    } catch (error) {
      console.error("Error al generar reporte de cierre de caja:", error);
      return false;
    }
  }

  /**
   * Genera un reporte financiero en PDF
   * @param {Object} data - Datos financieros para generar el reporte
   * @param {string} timeRange - Rango de tiempo para el reporte ('semana', 'mes', 'año')
   */
  static generarReporteFinanciero(data, timeRange) {
    // Extraer todos los datos financieros necesarios
    const { 
      ingresosTotales, 
      costosTotales, 
      gananciasTotales, 
      rentabilidadPromedio,
      transacciones,
      valorPromedioTransaccion,
      inversionMercaderia,
      topCategorias,
      productosMasVendidos,
      categoriasPorVolumen,
      margenPorCategoria,
      ingresosPorPeriodo,
      ingresosPorMes,
      inversionPorCategoria,
      rentabilidadTemporal
    } = data;
    
    // Crear el documento PDF
    const doc = new jsPDF();
    
    // Estilo para títulos y secciones
    const colorPrimario = [0, 38, 81]; // Color #002651
    const colorSecundario = [17, 138, 178]; // Color #118AB2
    const colorAcento = [239, 71, 111]; // Color #EF476F
    
    // Formatear la fecha actual para el nombre del archivo
    const fechaActual = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
    
    // ---- PORTADA ----
    doc.setFontSize(22);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text("REPORTE FINANCIERO", 105, 50, { align: 'center' });
    doc.text("LA DESPENSA", 105, 65, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.setLineWidth(1);
    doc.line(40, 75, 170, 75);
    
    // Información del periodo
    let periodoTexto = "Últimos 7 días";
    if (timeRange === "mes") periodoTexto = "Último mes";
    if (timeRange === "año") periodoTexto = "Último año";
    
    doc.setFontSize(16);
    doc.text(`Periodo: ${periodoTexto}`, 105, 90, { align: 'center' });
    
    // Calcular y formatear el rango de fechas específico
    const calcularRangoFechas = () => {
      const hoy = new Date();
      let inicio = new Date();
      let fin = new Date();
      
      if (timeRange === "semana") {
        inicio.setDate(hoy.getDate() - 7);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
      } else if (timeRange === "mes") {
        inicio.setMonth(hoy.getMonth() - 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
      } else if (timeRange === "año") {
        inicio.setFullYear(hoy.getFullYear() - 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
      }
      
      // Formatear fechas
      const opciones = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      };
      
      return {
        inicio: inicio.toLocaleDateString('es-AR', opciones),
        fin: fin.toLocaleDateString('es-AR', opciones)
      };
    };
    
    const { inicio, fin } = calcularRangoFechas();
    doc.setFontSize(14);
    doc.text(`Fechas: desde ${inicio} hasta ${fin}`, 105, 105, { align: 'center' });
    
    // Fecha de generación
    const horaActual = new Date().toLocaleTimeString();
    doc.setFontSize(12);
    doc.text(`Generado el: ${fechaActual} a las ${horaActual}`, 105, 120, { align: 'center' });
    
    // Agregar página nueva para el contenido
    doc.addPage();
    
    // ---- RESUMEN EJECUTIVO ----
    doc.setFontSize(18);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text("RESUMEN EJECUTIVO", 105, 20, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.line(40, 25, 170, 25);
    
    // Métricas principales
    doc.setFontSize(12);
    doc.text("Métricas principales del periodo:", 20, 35);
    
    // Crear tabla de métricas principales
    const metricasPrincipales = [
      ["Ingresos totales", `$${formatNumberWithDots(ingresosTotales)}`],
      ["Costos totales", `$${formatNumberWithDots(costosTotales)}`],
      ["Ganancias totales", `$${formatNumberWithDots(gananciasTotales)}`],
      ["Rentabilidad", `${rentabilidadPromedio.toFixed(2)}%`],
      ["Número de transacciones", transacciones],
      ["Valor promedio por transacción", `$${formatNumberWithDots(valorPromedioTransaccion)}`],
      ["Inversión en inventario", `$${formatNumberWithDots(inversionMercaderia)}`]
    ];
    
    autoTable(doc, {
      startY: 40,
      head: [["Métrica", "Valor"]],
      body: metricasPrincipales,
      headStyles: { fillColor: colorPrimario },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { left: 20, right: 20 }
    });
    
    // ---- ANÁLISIS DE INGRESOS ----
    // Verificar si la tabla anterior dejó suficiente espacio, sino añadir nueva página
    const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 30 : 120; // Aumentado de 15 a 30
    if (currentY > 200) { // Reducido de 220 a 200 para agregar página más temprano
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("ANÁLISIS DE INGRESOS", 105, 20, { align: 'center' });
      doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
      doc.line(40, 25, 170, 25);
    } else {
      doc.setFontSize(18);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("ANÁLISIS DE INGRESOS", 105, currentY, { align: 'center' });
      doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
      doc.line(40, currentY + 5, 170, currentY + 5);
    }
    
    // Si hay datos de ingresos por periodo (día, semana, mes)
    if (ingresosPorPeriodo && Object.keys(ingresosPorPeriodo).length > 0) {
      const newY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : (currentY > 200 ? 40 : currentY + 25); // Aumentado a 25
      doc.setFontSize(14);
      doc.text("Distribución de ingresos por día", 20, newY);
      
      // Convertir los datos de ingresosPorPeriodo para la tabla
      const datosIngresos = Object.entries(ingresosPorPeriodo).map(([fecha, valor]) => {
        return [
          new Date(fecha).toLocaleDateString('es-AR', {weekday: 'short', day: 'numeric', month: 'short'}),
          `$${formatNumberWithDots(valor)}`
        ];
      });
      
      autoTable(doc, {
        startY: newY + 10, // Aumentado de 5 a 10
        head: [["Fecha", "Ingresos"]],
        body: datosIngresos,
        headStyles: { fillColor: colorSecundario },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Si hay datos de top categorías
    if (topCategorias && topCategorias.length > 0) {
      // Verificar espacio disponible
      const newY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 180; // Aumentado de 15 a 25
      if (newY > 200) { // Reducido de 220 a 200
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("Top categorías por ingresos", 20, 30); // Aumentado de 20 a 30
      } else {
        doc.setFontSize(14);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("Top categorías por ingresos", 20, newY);
      }
      
      // Datos para la tabla
      const datosTopCategorias = topCategorias.map(cat => [
        cat.nombre,
        `$${formatNumberWithDots(cat.ingresos)}`,
        `${cat.porcentaje.toFixed(2)}%`
      ]);
      
      autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : (newY > 200 ? 40 : newY + 10), // Ajustado para más espacio
        head: [["Categoría", "Ingresos", "Porcentaje"]],
        body: datosTopCategorias,
        headStyles: { fillColor: colorPrimario },
        margin: { left: 20, right: 20 }
      });
    }
    
    // ---- ANÁLISIS DE PRODUCTOS ----
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text("ANÁLISIS DE PRODUCTOS", 105, 20, { align: 'center' });
    doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.line(40, 25, 170, 25);
    
    // Productos más vendidos
    if (productosMasVendidos && productosMasVendidos.length > 0) {
      doc.setFontSize(14);
      doc.text("Productos más vendidos", 20, 40); // Aumentado de 35 a 40
      
      // Datos para la tabla
      const datosProductos = productosMasVendidos.map((prod, index) => [
        index + 1,
        prod.nombre,
        prod.ventas,
        `$${formatNumberWithDots(prod.ingreso)}`
      ]);
      
      autoTable(doc, {
        startY: 50, // Aumentado de 40 a 50
        head: [["Ranking", "Producto", "Unidades", "Ingresos"]],
        body: datosProductos,
        headStyles: { fillColor: colorSecundario },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Categorías por volumen de ventas
    if (categoriasPorVolumen && categoriasPorVolumen.length > 0) {
      const newY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 120; // Aumentado de 15 a 25
      doc.setFontSize(14);
      doc.text("Categorías por volumen de ventas", 20, newY);
      
      // Datos para la tabla
      const datosCategorias = categoriasPorVolumen.map(cat => [
        cat.nombre,
        cat.ventas,
        `${cat.porcentaje.toFixed(2)}%`
      ]);
      
      autoTable(doc, {
        startY: newY + 10, // Aumentado de 5 a 10
        head: [["Categoría", "Unidades vendidas", "Porcentaje"]],
        body: datosCategorias,
        headStyles: { fillColor: colorPrimario },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Inversión por categoría
    if (inversionPorCategoria && Object.keys(inversionPorCategoria).length > 0) {
      // Verificar espacio disponible
      const newY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 180; // Aumentado de 15 a 25
      if (newY > 200) { // Reducido de 220 a 200
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("Inversión por categoría", 20, 30); // Aumentado de 20 a 30
      } else {
        doc.setFontSize(14);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("Inversión por categoría", 20, newY);
      }
      
      // Datos para la tabla
      const datosInversion = Object.entries(inversionPorCategoria)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10) // Top 10 categorías por inversión
        .map(([categoria, valor]) => {
          const porcentaje = inversionMercaderia > 0 
            ? (valor / inversionMercaderia * 100).toFixed(2) 
            : "0.00";
          return [categoria, `$${formatNumberWithDots(valor)}`, `${porcentaje}%`];
        });
      
      autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : (newY > 200 ? 40 : newY + 10), // Ajustado para más espacio
        head: [["Categoría", "Inversión", "Porcentaje"]],
        body: datosInversion,
        headStyles: { fillColor: colorSecundario },
        margin: { left: 20, right: 20 }
      });
    }
    
    // ---- ANÁLISIS DE RENTABILIDAD ----
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text("ANÁLISIS DE RENTABILIDAD", 105, 20, { align: 'center' });
    doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.line(40, 25, 170, 25);
    
    // Margen de ganancia por categoría
    if (margenPorCategoria && margenPorCategoria.length > 0) {
      doc.setFontSize(14);
      doc.text("Margen de ganancia por categoría", 20, 40); // Aumentado de 35 a 40
      
      // Datos para la tabla
      const datosMargen = margenPorCategoria.map(cat => [
        cat.categoria,
        `${cat.margen.toFixed(2)}%`,
        cat.rendimiento.charAt(0).toUpperCase() + cat.rendimiento.slice(1) // Capitalizar
      ]);
      
      autoTable(doc, {
        startY: 50, // Aumentado de 40 a 50
        head: [["Categoría", "Margen de ganancia", "Rendimiento"]],
        body: datosMargen,
        headStyles: { fillColor: colorPrimario },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Comparativa Ingresos vs Costos vs Ganancias
    const newY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 120; // Aumentado de 15 a 25
    doc.setFontSize(14);
    doc.text("Comparativa financiera", 20, newY);
    
    const datosComparativos = [
      ["Ingresos", `$${formatNumberWithDots(ingresosTotales)}`, "100%"],
      ["Costos", `$${formatNumberWithDots(costosTotales)}`, `${(costosTotales / ingresosTotales * 100).toFixed(2)}%`],
      ["Ganancias", `$${formatNumberWithDots(gananciasTotales)}`, `${(gananciasTotales / ingresosTotales * 100).toFixed(2)}%`]
    ];
    
    autoTable(doc, {
      startY: newY + 10, // Aumentado de 5 a 10
      head: [["Concepto", "Monto", "Porcentaje"]],
      body: datosComparativos,
      headStyles: { fillColor: colorSecundario },
      bodyStyles: { halign: 'center' },
      margin: { left: 20, right: 20 }
    });
    
    // Rentabilidad temporal si está disponible
    if (rentabilidadTemporal && rentabilidadTemporal.length > 0) {
      // Verificar espacio disponible
      const newY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 180; // Aumentado de 15 a 25
      if (newY > 200) { // Reducido de 200 a 180
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("Rentabilidad temporal", 20, 30); // Aumentado de 20 a 30
      } else {
        doc.setFontSize(14);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("Rentabilidad temporal", 20, newY);
      }
      
      // Datos para la tabla
      const datosRentabilidad = rentabilidadTemporal.map(dia => [
        `${dia.fecha.getDate()}/${dia.fecha.getMonth() + 1}`,
        `$${formatNumberWithDots(dia.ingresos)}`,
        `$${formatNumberWithDots(dia.costos)}`,
        `$${formatNumberWithDots(dia.ganancias)}`,
        `${dia.margen.toFixed(2)}%`
      ]);
      
      autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : (newY > 200 ? 40 : newY + 10), // Ajustado para más espacio
        head: [["Fecha", "Ingresos", "Costos", "Ganancias", "Margen"]],
        body: datosRentabilidad,
        headStyles: { fillColor: colorPrimario },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Agregar pie de página en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Pie de página con fecha de generación y número de página
      doc.text(`La Despensa - Reporte Financiero - ${fechaActual}`, 20, pageHeight - 10);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    }
    
    // Guardar el PDF con un nombre más descriptivo
    const timestamp = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Reporte_Financiero_${periodoTexto.replace(/ /g, '_')}_${timestamp}.pdf`;
    doc.save(nombreArchivo);
  }

  /**
   * Genera un reporte del historial de ventas en PDF
   * @param {Array} ventas - Lista de ventas para incluir en el reporte
   * @param {boolean} esVentasAnuladas - Indica si son ventas anuladas o activas
   * @param {Object} filtrosAplicados - Filtros aplicados en la vista (opcional)
   */
  static generarReporteHistorialVentas(ventas, esVentasAnuladas = false, filtrosAplicados = {}) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm', 
      format: 'a4'
    });

    // Configurar título y encabezado según el tipo de ventas
    const tipoVentas = esVentasAnuladas ? 'VENTAS ANULADAS' : 'VENTAS ACTIVAS';
    const fechaActual = new Date().toLocaleDateString();
    const horaActual = new Date().toLocaleTimeString();
    
    // Título principal
    doc.setFontSize(18);
    doc.setTextColor(0, 38, 81);
    doc.text(`La Despensa - Historial de ${tipoVentas}`, 14, 15);
    
    // Información del reporte
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha de generación: ${fechaActual} - ${horaActual}`, 14, 25);
    
    // Información del estado de las ventas
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    if (esVentasAnuladas) {
      doc.setTextColor(220, 53, 69); // Rojo para anuladas
      doc.text(`⚠️ REGISTRO DE AUDITORÍA - ${tipoVentas}`, 14, 35);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Estas ventas han sido anuladas y se conservan únicamente para fines de auditoría y control", 14, 42);
    } else {
      doc.setTextColor(40, 167, 69); // Verde para activas
      doc.text(`✓ ${tipoVentas} - REGISTRO OPERATIVO`, 14, 35);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Ventas activas del sistema - Registro de operaciones comerciales", 14, 42);
    }
    
    // Información de filtros aplicados (si los hay)
    let yPos = 50;
    if (filtrosAplicados && Object.keys(filtrosAplicados).length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Filtros aplicados:", 14, yPos);
      yPos += 5;
      
      if (filtrosAplicados.busqueda) {
        doc.text(`• Búsqueda: "${filtrosAplicados.busqueda}"`, 16, yPos);
        yPos += 4;
      }
      if (filtrosAplicados.categoria) {
        doc.text(`• Categoría: ${filtrosAplicados.categoria}`, 16, yPos);
        yPos += 4;
      }
      if (filtrosAplicados.fechaInicio || filtrosAplicados.fechaFin) {
        const desde = filtrosAplicados.fechaInicio || 'Sin límite';
        const hasta = filtrosAplicados.fechaFin || 'Sin límite';
        doc.text(`• Período: Desde ${desde} hasta ${hasta}`, 16, yPos);
        yPos += 4;
      }
      if (filtrosAplicados.montoMin || filtrosAplicados.montoMax) {
        const min = filtrosAplicados.montoMin || 'Sin límite';
        const max = filtrosAplicados.montoMax || 'Sin límite';
        doc.text(`• Rango de monto: $${min} - $${max}`, 16, yPos);
        yPos += 4;
      }
      yPos += 5;
    }
    
    // Estadísticas del reporte
    const totalVentas = ventas.length;
    const montoTotal = ventas.reduce((acc, venta) => {
      return acc + venta.ventas.reduce((sum, producto) => sum + (producto.cantidad * producto.precioVenta), 0);
    }, 0);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 38, 81);
    doc.text(`Total de registros: ${totalVentas}`, 14, yPos);
    doc.text(`Monto total: $${formatNumberWithDots(montoTotal)}`, 120, yPos);
    yPos += 10;

    // Configurar headers según el tipo de ventas
    let headers;
    if (esVentasAnuladas) {
      headers = ["Ticket", "Fecha Original", "Usuario", "Método de Pago", "Productos", "Total", "Fecha Anulación", "Anulado Por", "Motivo/Comentario"];
    } else {
      headers = ["Ticket", "Fecha", "Usuario", "Método de Pago", "Productos", "Total"];
    }

    // Generar filas de datos según el tipo de ventas
    const rows = ventas.map((venta) => {
      const productos = venta.ventas
        .map(producto => `${producto.nombre} - ${producto.cantidad}x $${formatNumberWithDots(producto.precioVenta)}`)
        .join("\n");
      
      const total = venta.ventas.reduce((acc, producto) => acc + producto.cantidad * producto.precioVenta, 0);
      const metodoPago = venta.deudorId ? `Deudor: ${venta.deudor?.Nombre || 'Desconocido'}` : 
                        venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo';
      
      const baseRow = [
        venta._id,
        new Date(venta.fecha).toLocaleDateString(),
        venta.usuario ? venta.usuario.nombre || venta.usuario.username : "Usuario desconocido",
        metodoPago,
        productos,
        `$${formatNumberWithDots(total)}`
      ];

      if (esVentasAnuladas) {
        // Agregar información específica de ventas anuladas
        const fechaAnulacion = venta.fechaAnulacion ? 
          new Date(venta.fechaAnulacion).toLocaleDateString() : 
          (venta.fechaDevolucion ? new Date(venta.fechaDevolucion).toLocaleDateString() : 'N/A');
        
        const usuarioAnulacion = venta.usuarioAnulacion ? 
          (venta.usuarioAnulacion.nombre || venta.usuarioAnulacion.username) :
          (venta.usuarioDevolucion ? 
            (venta.usuarioDevolucion.nombre || venta.usuarioDevolucion.username) : 'N/A');
        
        const motivoComentario = venta.estado === 'anulada' ? 
          (venta.motivoAnulacion || 'Sin motivo especificado') :
          venta.estado === 'devuelta_parcial' ? 
            (`Devolución Parcial: ${venta.comentarioDevolucion || 'Sin comentario'}`) :
            (venta.motivoAnulacion || venta.comentarioDevolucion || 'Sin información');

        return [...baseRow, fechaAnulacion, usuarioAnulacion, motivoComentario];
      }

      return baseRow;
    });

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: esVentasAnuladas ? [220, 53, 69] : [0, 38, 81],
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Ticket
        1: { cellWidth: 20 }, // Fecha
        2: { cellWidth: 25 }, // Usuario
        3: { cellWidth: 25 }, // Método de Pago
        4: { cellWidth: 45 }, // Productos
        5: { cellWidth: 20, halign: 'right' }, // Total
        ...(esVentasAnuladas && {
          6: { cellWidth: 20 }, // Fecha Anulación
          7: { cellWidth: 25 }, // Anulado Por
          8: { cellWidth: 35 }  // Motivo/Comentario
        })
      },
      didDrawPage: (data) => {
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
        
        // Información del pie
        doc.text(`La Despensa - ${tipoVentas} - ${fechaActual}`, 14, pageHeight - 8);
        doc.text(`Página ${data.pageNumber}`, pageWidth - 30, pageHeight - 8);
        
        if (esVentasAnuladas) {
          doc.text("⚠️ Documento de Auditoría - Solo para Control Interno", pageWidth / 2, pageHeight - 8, { align: 'center' });
        }
      }
    });

    // Guardar PDF con nombre descriptivo
    const timestamp = new Date().toISOString().split('T')[0];
    const tipoArchivo = esVentasAnuladas ? 'Ventas_Anuladas' : 'Ventas_Activas';
    const nombreArchivo = `LaDespensa_${tipoArchivo}_${timestamp}.pdf`;
    
    doc.save(nombreArchivo);
  }

  /**
   * Genera un reporte de proveedores en PDF
   * @param {Array} proveedores - Lista de proveedores para incluir en el reporte
   * @param {string} estadoFilter - Filtro de estado aplicado ('activos', 'inactivos', 'todos')
   */
  static generarReporteProveedores(proveedores, estadoFilter = 'activos') {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.text("Listado de Proveedores", 14, 15);
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Fecha: ${currentDate}`, 14, 22);
    
    // Detectar el tipo de proveedores y añadir información del estado
    let tipoProveedores = 'MIXTO';
    let infoEstado = '';
    
    if (proveedores.length > 0) {
      const proveedoresActivos = proveedores.filter(p => p.activo === true || p.activo === undefined);
      const proveedoresInactivos = proveedores.filter(p => p.activo === false);
      
      if (proveedoresActivos.length > 0 && proveedoresInactivos.length === 0) {
        tipoProveedores = 'ACTIVOS';
        infoEstado = `Estado: SOLO PROVEEDORES ACTIVOS (${proveedoresActivos.length})`;
      } else if (proveedoresInactivos.length > 0 && proveedoresActivos.length === 0) {
        tipoProveedores = 'INACTIVOS';
        infoEstado = `Estado: SOLO PROVEEDORES INACTIVOS (${proveedoresInactivos.length})`;
      } else if (proveedoresActivos.length > 0 && proveedoresInactivos.length > 0) {
        tipoProveedores = 'MIXTO';
        infoEstado = `Estado: MIXTO - Activos: ${proveedoresActivos.length}, Inactivos: ${proveedoresInactivos.length}`;
      }
    }
    
    // Mostrar información del estado en el PDF
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    if (tipoProveedores === 'ACTIVOS') {
      doc.setTextColor(0, 150, 0); // Verde para activos
    } else if (tipoProveedores === 'INACTIVOS') {
      doc.setTextColor(200, 0, 0); // Rojo para inactivos
    } else {
      doc.setTextColor(0, 0, 200); // Azul para mixto
    }
    doc.text(infoEstado, 14, 30);
    
    // Restablecer color y fuente
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    // Definir headers según el filtro de estado
    let headers;
    if (estadoFilter === 'todos') {
      // Incluir columna de Estado cuando se muestran todos los proveedores
      headers = [
        'Nombre', 
        'Teléfono', 
        'Email',
        'Contacto Principal',
        'Dirección',
        'Categorías',
        'Estado',
        'Notas'
      ];
    } else {
      // Headers normales sin columna de Estado
      headers = [
        'Nombre', 
        'Teléfono', 
        'Email',
        'Contacto Principal',
        'Dirección',
        'Categorías',
        'Notas'
      ];
    }
    
    // Generar filas según el filtro de estado
    let rows;
    if (estadoFilter === 'todos') {
      // Incluir columna de Estado
      rows = proveedores.map(proveedor => [
        proveedor.nombre,
        proveedor.telefono,
        proveedor.email,
        proveedor.contactoPrincipal || '—',
        proveedor.direccion || '—',
        proveedor.categorias.join(', '),
        proveedor.activo ? 'Activo' : 'Inactivo',
        proveedor.notas || '—'
      ]);
    } else {
      // Sin columna de Estado
      rows = proveedores.map(proveedor => [
        proveedor.nombre,
        proveedor.telefono,
        proveedor.email,
        proveedor.contactoPrincipal || '—',
        proveedor.direccion || '—',
        proveedor.categorias.join(', '),
        proveedor.notas || '—'
      ]);
    }
    
    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: rows,
      margin: { top: 40 }, // Aumentado para dar espacio a la información del estado
      styles: { 
        overflow: 'linebreak',
        fontSize: 9
      },
      headStyles: { fillColor: [0, 38, 81] }, // Color #002651
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`La Despensa - Listado de Proveedores - ${currentDate}`, 14, doc.internal.pageSize.height - 10);
      }
    });
    
    // Guardar PDF con nombre que incluya el tipo de proveedores
    const tipoParaNombre = tipoProveedores === 'MIXTO' ? 'Completo' : tipoProveedores;
    doc.save(`Proveedores_${tipoParaNombre}.pdf`);
  }

  /**
   * Genera un reporte de cuentas por pagar en PDF
   * @param {Object} cuentasAgrupadas - Cuentas agrupadas por proveedor
   * @param {Array} meses - Lista de meses del año
   * @param {string} yearSelected - Año seleccionado para el reporte
   */
  static generarReporteCuentasPorPagar(cuentasAgrupadas, meses, yearSelected) {
    const doc = new jsPDF({
      orientation: 'landscape', // Cambia la orientación a horizontal
      unit: 'mm',
      format: 'a4'
    });
    
    doc.text("Reporte de Cuentas por Pagar", 14, 16);
    doc.text(`Año: ${yearSelected}`, 14, 24);
    
    // Preparar datos para la tabla
    const headers = [
      'Proveedor', 
      'Identificador', 
      'Categoría',
      ...meses.map(mes => mes.nombre)
    ];
    
    const rows = Object.values(cuentasAgrupadas).map(proveedor => {
      const rowData = [
        proveedor.nombre,
        proveedor.numeroVerificador,
        proveedor.categoria
      ];
      
      // Agregar montos por mes
      meses.forEach(mes => {
        const cuentaMes = proveedor.meses[mes.id];
        if (cuentaMes) {
          rowData.push(`$${formatNumberWithDots(cuentaMes.monto)} (${cuentaMes.estado})`);
        } else {
          rowData.push('-');
        }
      });
      
      return rowData;
    });
    
    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: rows,
      margin: { top: 30 },
      styles: { overflow: 'linebreak' },
      headStyles: { fillColor: [0, 38, 81] }, // Color #002651
      didDrawPage: (data) => {
        // Agregar pie de página con fecha
        const currentDate = new Date().toLocaleDateString();
        doc.setFontSize(10);
        doc.text(`Fecha de emisión: ${currentDate}`, 14, doc.internal.pageSize.height - 10);
      }
    });
    
    // Guardar PDF
    doc.save(`Cuentas_por_Pagar_${yearSelected}.pdf`);
  }

  /**
   * Genera un reporte de productos en PDF
   * @param {Array} productos - Lista de productos para incluir en el reporte
   * @param {string} categoria - Categoría filtrada (opcional)
   * @param {string} disponibilidad - Filtro de disponibilidad (opcional)
   * @param {string} busqueda - Texto de búsqueda aplicado (opcional)
   */
  static generarReporteProductos(productos, categoria, disponibilidad, busqueda) {
    const doc = new jsPDF();
    
    // Título y fecha
    doc.setFontSize(18);
    doc.text("La Despensa - Reporte de Productos", 15, 15);
    
    doc.setFontSize(12);
    const fechaActual = new Date().toLocaleDateString();
    doc.text(`Fecha: ${fechaActual}`, 15, 22);
    
    // Información de los filtros aplicados
    let yPos = 29;
    if (categoria && categoria !== 'Todos') {
      doc.text(`Categoría: ${categoria}`, 15, yPos);
      yPos += 7;
    }
    
    if (disponibilidad && disponibilidad !== 'Todos') {
      doc.text(`Disponibilidad: ${disponibilidad}`, 15, yPos);
      yPos += 7;
    }
    
    if (busqueda) {
      doc.text(`Búsqueda: "${busqueda}"`, 15, yPos);
      yPos += 7;
    }
    
    doc.text(`Total de productos: ${productos.length}`, 15, yPos);
    
    // Tabla de productos
    const tableData = productos.map(producto => [
      producto.Nombre,
      producto.Marca || '-',
      producto.Categoria,
      producto.Stock.toString(),
      `$${formatNumberWithDots(producto.PrecioCompra)}`,
      `$${formatNumberWithDots(producto.PrecioVenta)}`,
      producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toLocaleDateString() : '-'
    ]);
    
    autoTable(doc, {
      startY: yPos + 10,
      head: [['Nombre', 'Marca', 'Categoría', 'Stock', 'Precio Compra', 'Precio Venta', 'Vencimiento']],
      body: tableData,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [0, 38, 81] },
      didDrawPage: (data) => {
        // Pie de página
        doc.setFontSize(10);
        doc.text(`La Despensa - Reporte de Productos - ${fechaActual}`, 15, doc.internal.pageSize.height - 10);
      }
    });
    
    doc.save(`la_despensa_productos_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Genera un reporte completo masivo con todos los datos del sistema
   * @param {Object} data - Todos los datos del sistema para incluir en el reporte
   * @returns {Promise<boolean>} - true si el reporte se generó exitosamente
   */
  static async generarReporteCompletoMasivo(data) {
    try {
      const {
        productos,
        ventas,
        deudores,
        proveedores,
        cuentasPorPagar,
        datosFinancieros,
        estadisticasGenerales,
        usuario
      } = data;

      // Crear documento PDF con orientación portrait y formato A4
      const doc = new jsPDF();
      
      // ============ PALETA DE COLORES PROFESIONAL ============
      const colorPrimario = [13, 71, 161]; // Azul corporativo más elegante #0D47A1
      const colorSecundario = [33, 150, 243]; // Azul claro #2196F3
      const colorAcento = [255, 193, 7]; // Amarillo dorado #FFC107
      const colorExito = [76, 175, 80]; // Verde #4CAF50
      const colorPeligro = [244, 67, 54]; // Rojo #F44336
      const colorGris = [117, 117, 117]; // Gris neutro #757575
      
      const fechaActual = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const horaActual = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // ============ PORTADA COMPACTA ============
      doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.rect(0, 0, 210, 80, 'F');
      
      // Logo/Título principal
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("LA DESPENSA", 105, 30, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text("REPORTE INTEGRAL DEL SISTEMA", 105, 50, { align: 'center' });
      
      // Información del reporte
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Fecha: ${fechaActual} - Hora: ${horaActual}`, 105, 90, { align: 'center' });
      doc.text(`Usuario: ${usuario?.email || 'Sistema'}`, 105, 100, { align: 'center' });
      
      // ============ RESUMEN FINANCIERO (PÁGINA 1) ============
      let currentY = 120;
      
      doc.setFontSize(16);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMEN FINANCIERO", 20, currentY);
      currentY += 15;

      if (datosFinancieros) {
        // Tabla financiera compacta
        const metricsFinancieras = [
          ["Ingresos Totales", `$${formatNumberWithDots(datosFinancieros.ingresosTotales)}`],
          ["Costos Totales", `$${formatNumberWithDots(datosFinancieros.costosTotales)}`],
          ["Ganancia Neta", `$${formatNumberWithDots(datosFinancieros.gananciasTotales)}`],
          ["Rentabilidad", `${datosFinancieros.rentabilidadPromedio?.toFixed(2) || '0'}%`],
          ["Transacciones", datosFinancieros.transacciones?.toString() || '0'],
          ["Inversion en Mercaderia", `$${formatNumberWithDots(datosFinancieros.inversionMercaderia)}`]
        ];

        autoTable(doc, {
          startY: currentY,
          head: [["Metrica", "Valor"]],
          body: metricsFinancieras,
          headStyles: { 
            fillColor: [colorPrimario[0], colorPrimario[1], colorPrimario[2]],
            fontSize: 10,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
        });
        
        currentY = doc.lastAutoTable.finalY + 15;
      }

      // ============ ANÁLISIS DE PRODUCTOS (PÁGINA 1) ============
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("ANÁLISIS DE PRODUCTOS", 20, currentY);
      currentY += 15;

      if (productos?.length > 0) {
        const stockTotal = productos.reduce((sum, p) => sum + (p.Stock || 0), 0);
        const valorInventario = productos.reduce((sum, p) => sum + ((p.PrecioCompra || 0) * (p.Stock || 0)), 0);
        const productosBajoStock = productos.filter(p => (p.Stock || 0) < 10).length;
        const categorias = [...new Set(productos.map(p => p.Categoria))];

        const statsProductos = [
          ["Total de Productos", productos.length.toString()],
          ["Stock Total", formatNumberWithDots(stockTotal)],
          ["Valor del Inventario", `$${formatNumberWithDots(valorInventario)}`],
          ["Productos con Bajo Stock", productosBajoStock.toString()],
          ["Categorias", categorias.length.toString()]
        ];

        autoTable(doc, {
          startY: currentY,
          head: [["Metrica", "Valor"]],
          body: statsProductos,
          headStyles: { fillColor: colorSecundario, fontSize: 10 },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
        });
        
        currentY = doc.lastAutoTable.finalY + 15;
      }

      // ============ HISTORIAL DE VENTAS (PÁGINA 2) ============
      doc.addPage();
      currentY = 20;

      doc.setFontSize(16);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("HISTORIAL DE VENTAS", 20, currentY);
      currentY += 15;

      if (ventas?.length > 0) {
        const ventasEfectivo = ventas.filter(v => v.metodoPago === 'efectivo').length;
        const ventasTarjeta = ventas.filter(v => v.metodoPago === 'tarjeta').length;
        const ventasDeudores = ventas.filter(v => v.deudorId).length;

        const totalVentas = ventas.reduce((sum, v) => {
          return sum + v.ventas.reduce((acc, p) => acc + (p.precioVenta * p.cantidad), 0);
        }, 0);

        const statsVentas = [
          ["Total de Ventas", ventas.length.toString()],
          ["Valor Total", `$${formatNumberWithDots(totalVentas)}`],
          ["Ventas en Efectivo", `${ventasEfectivo} (${((ventasEfectivo/ventas.length)*100).toFixed(1)}%)`],
          ["Ventas con Tarjeta", `${ventasTarjeta} (${((ventasTarjeta/ventas.length)*100).toFixed(1)}%)`],
          ["Ventas a Deudores", `${ventasDeudores} (${((ventasDeudores/ventas.length)*100).toFixed(1)}%)`]
        ];

        autoTable(doc, {
          startY: currentY,
          head: [["Metrica de Ventas", "Valor"]],
          body: statsVentas,
          headStyles: { fillColor: colorPrimario, fontSize: 10 },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 60, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
        });
        
        currentY = doc.lastAutoTable.finalY + 15;

        // Últimas 10 transacciones más importantes
        doc.setFontSize(14);
        doc.text("Ultimas 10 Transacciones", 20, currentY);
        currentY += 10;

        const ultimasVentas = ventas
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 10)
          .map(v => {
            const total = v.ventas.reduce((acc, p) => acc + (p.precioVenta * p.cantidad), 0);
            const metodoPago = v.deudorId ? 'Deudor' : v.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo';
            return [
              v._id?.substring(0, 8) || 'N/A',
              new Date(v.fecha).toLocaleDateString('es-AR'),
              metodoPago,
              `$${formatNumberWithDots(total)}`
            ];
          });

        autoTable(doc, {
          startY: currentY,
          head: [["Ticket", "Fecha", "Metodo", "Total"]],
          body: ultimasVentas,
          headStyles: { fillColor: colorSecundario, fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 40 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
        });
        
        currentY = doc.lastAutoTable.finalY + 15;
      }

      // ============ GESTIÓN DE DEUDORES (PÁGINA 3) ============
      doc.addPage();
      currentY = 20;

      doc.setFontSize(16);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("GESTION DE DEUDORES", 20, currentY);
      currentY += 15;

      if (deudores?.length > 0) {
        const deudaTotal = deudores.reduce((sum, d) => {
          const deuda = parseFloat(d.deudaTotal?.replace(/[\$\.,]/g, '') || '0');
          return sum + deuda;
        }, 0);

        const deudoresConDeuda = deudores.filter(d => {
          const deuda = parseFloat(d.deudaTotal?.replace(/[\$\.,]/g, '') || '0');
          return deuda > 0;
        });

        const statsDeudores = [
          ["Total de Deudores", deudores.length.toString()],
          ["Deudores con Deuda", deudoresConDeuda.length.toString()],
          ["Deuda Total", `$${formatNumberWithDots(deudaTotal)}`],
          ["Deuda Promedio", `$${formatNumberWithDots(Math.round(deudaTotal/deudores.length))}`]
        ];

        autoTable(doc, {
          startY: currentY,
          head: [["Metrica", "Valor"]],
          body: statsDeudores,
          headStyles: { fillColor: colorPrimario, fontSize: 10 },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
        });
        
        currentY = doc.lastAutoTable.finalY + 15;

        // Top 10 deudores
        doc.setFontSize(14);
        doc.text("Top 10 Deudores", 20, currentY);
        currentY += 10;

        const topDeudores = deudores
          .map(d => ({
            ...d,
            deudaNum: parseFloat(d.deudaTotal?.replace(/[\$\.,]/g, '') || '0')
          }))
          .sort((a, b) => b.deudaNum - a.deudaNum)
          .slice(0, 10)
          .map((d, index) => [
            index + 1,
            d.Nombre || 'Sin nombre',
            d.numeroTelefono || 'Sin telefono',
            d.deudaTotal || '$0'
          ]);

        autoTable(doc, {
          startY: currentY,
          head: [["#", "Nombre", "Telefono", "Deuda"]],
          body: topDeudores,
          headStyles: { fillColor: colorSecundario, fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 60 },
            2: { cellWidth: 45 },
            3: { cellWidth: 30, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
        });
      }

      // ============ RESUMEN DE PROVEEDORES Y CUENTAS ============
      if (proveedores?.length > 0 || cuentasPorPagar?.length > 0) {
        doc.addPage();
        currentY = 20;

        // Proveedores
        if (proveedores?.length > 0) {
          doc.setFontSize(16);
          doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
          doc.text("PROVEEDORES", 20, currentY);
          currentY += 15;

          const proveedoresActivos = proveedores.filter(p => p.estado === 'activo');
          const categoriasProveedores = [...new Set(proveedores.flatMap(p => p.categorias || []))];

          const statsProveedores = [
            ["Total de Proveedores", proveedores.length.toString()],
            ["Proveedores Activos", proveedoresActivos.length.toString()],
            ["Categorias Cubiertas", categoriasProveedores.length.toString()]
          ];

          autoTable(doc, {
            startY: currentY,
            head: [["Metrica", "Valor"]],
            body: statsProveedores,
            headStyles: { fillColor: colorPrimario, fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 40, halign: 'right' }
            },
            margin: { left: 20, right: 80 }
          });
          
          currentY = doc.lastAutoTable.finalY + 20;
        }

        // Cuentas por Pagar
        if (cuentasPorPagar?.length > 0) {
          doc.setFontSize(16);
          doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
          doc.text("CUENTAS POR PAGAR", 20, currentY);
          currentY += 15;

          const cuentasPendientes = cuentasPorPagar.filter(c => c.Estado === 'Pendiente');
          const cuentasPagadas = cuentasPorPagar.filter(c => c.Estado === 'Pagado');
          const totalPendiente = cuentasPendientes.reduce((sum, c) => sum + (c.Monto || 0), 0);
          const totalPagado = cuentasPagadas.reduce((sum, c) => sum + (c.Monto || 0), 0);

          const statsCuentas = [
            ["Total de Cuentas", cuentasPorPagar.length.toString()],
            ["Cuentas Pendientes", cuentasPendientes.length.toString()],
            ["Monto Pendiente", `$${formatNumberWithDots(totalPendiente)}`],
            ["Monto Pagado", `$${formatNumberWithDots(totalPagado)}`]
          ];

          autoTable(doc, {
            startY: currentY,
            head: [["Metrica", "Valor"]],
            body: statsCuentas,
            headStyles: { fillColor: colorPrimario, fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 60, halign: 'right' }
            },
            margin: { left: 20, right: 50 }
          });
        }
      }

      // ============ PIE DE PÁGINA SIMPLE ============
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Pie de página
        doc.setFontSize(9);
        doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Línea superior
        doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.setLineWidth(0.5);
        doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
        
        // Información del pie
        doc.text("La Despensa - Sistema de Gestion", 20, pageHeight - 10);
        doc.text(fechaActual, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }

      // Guardar el PDF con nombre mejorado
      const timestamp = new Date().toISOString().split('T')[0];
      const nombreArchivo = `LaDespensa_ReporteCompleto_${timestamp}.pdf`;
      doc.save(nombreArchivo);

      return true;
    } catch (error) {
      console.error("Error al generar reporte completo masivo:", error);
      return false;
    }
  }

  // ============ MÉTODOS AUXILIARES PARA EL DISEÑO ============
  
  /**
   * Agrega un encabezado de sección profesional
   */
  static agregarEncabezadoSeccion(doc, titulo, colorPrimario, colorSecundario) {
    // Fondo del encabezado
    doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Línea decorativa
    doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.rect(0, 35, 210, 5, 'F');
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(titulo, 105, 25, { align: 'center' });
  }

  /**
   * Dibuja tarjetas KPI estilizadas
   */
  static dibujarTarjetasKPI(doc, kpis, startY) {
    const cardWidth = 40;
    const cardHeight = 30;
    const spacing = 5;
    const startX = (210 - (kpis.length * cardWidth + (kpis.length - 1) * spacing)) / 2;

    kpis.forEach((kpi, index) => {
      const x = startX + index * (cardWidth + spacing);
      
      // Sombra de la tarjeta
      doc.setFillColor(0, 0, 0, 0.1);
      doc.roundedRect(x + 1, startY + 1, cardWidth, cardHeight, 3, 3, 'F');
      
      // Tarjeta principal
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'F');
      
      // Borde superior colorido
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.roundedRect(x, startY, cardWidth, 4, 3, 3, 'F');
      
      // Icono (simulado con texto)
      doc.setFontSize(16);
      doc.text(kpi.icono, x + 5, startY + 15);
      
      // Título
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(kpi.titulo, x + cardWidth / 2, startY + 20, { align: 'center' });
      
      // Valor
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.text(kpi.valor, x + cardWidth / 2, startY + 27, { align: 'center' });
    });
  }

  /**
   * Genera una representación visual de barra de progreso
   */
  static generarBarraProgreso(porcentaje) {
    const maxBarras = 10;
    const barrasLlenas = Math.round((porcentaje / 100) * maxBarras);
    let barra = "";
    
    for (let i = 0; i < maxBarras; i++) {
      barra += i < barrasLlenas ? "█" : "░";
    }
    
    return barra;
  }
}