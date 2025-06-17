import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
        balanceEfectivo
      } = data;
      
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Título y fecha
      doc.setFontSize(18);
      doc.text("La Despensa - Reporte de Cierre de Caja", 14, 15);
      
      doc.setFontSize(12);
      doc.text(`Fecha: ${fechaFormateada}`, 14, 25);
      
      const horaInicioFormateada = new Date(sessionStartTime).toLocaleTimeString();
      doc.text(`Periodo: ${horaInicioFormateada} a ${horaFinFormateada}`, 14, 32);
      doc.text(`Usuario: ${usuarioActual.email}`, 14, 39);
      
      // Resumen de ventas y operaciones
      doc.setFontSize(14);
      doc.text("Resumen de Operaciones", 14, 50);
      
      // Tabla de resumen
      autoTable(doc, {
        startY: 55,
        head: [["Concepto", "Cantidad", "Monto"]],
        body: resumenCajaData.slice(1), // Omitir la fila de encabezado
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 38, 81] },
      });
      
      // Calcular el balance total
      doc.setFontSize(12);
      doc.text(`Balance en Efectivo: $${balanceEfectivo.toLocaleString('es-ES')}`, 14, doc.lastAutoTable.finalY + 15);
      
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
      doc.text(`Total de transacciones: ${ventasSesion.length + deudoresData.length}`, 14, doc.lastAutoTable.finalY + 30);
      doc.text(`Período del reporte: ${sessionStartTime.toLocaleString('es-ES')} - ${new Date().toLocaleString('es-ES')}`, 14, doc.lastAutoTable.finalY + 40);
      
      // Pie de página con información del usuario
      doc.text(`Reporte generado por: ${usuarioActual.email} - ${new Date().toLocaleString('es-ES')}`, 14, doc.internal.pageSize.height - 10);
      
      // Guardar el PDF
      const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
      doc.save(`Cierre_Caja_${usuarioActual.email}_${timestamp}.pdf`);
      
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
      ["Ingresos totales", `$${ingresosTotales.toLocaleString('es-ES')}`],
      ["Costos totales", `$${costosTotales.toLocaleString('es-ES')}`],
      ["Ganancias totales", `$${gananciasTotales.toLocaleString('es-ES')}`],
      ["Rentabilidad", `${rentabilidadPromedio.toFixed(2)}%`],
      ["Número de transacciones", transacciones],
      ["Valor promedio por transacción", `$${valorPromedioTransaccion.toLocaleString('es-ES')}`],
      ["Inversión en inventario", `$${inversionMercaderia.toLocaleString('es-ES')}`]
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
          `$${valor.toLocaleString('es-AR')}`
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
        `$${cat.ingresos.toLocaleString('es-AR')}`,
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
        `$${prod.ingreso.toLocaleString('es-AR')}`
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
          return [categoria, `$${valor.toLocaleString('es-AR')}`, `${porcentaje}%`];
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
      ["Ingresos", `$${ingresosTotales.toLocaleString('es-AR')}`, "100%"],
      ["Costos", `$${costosTotales.toLocaleString('es-AR')}`, `${(costosTotales / ingresosTotales * 100).toFixed(2)}%`],
      ["Ganancias", `$${gananciasTotales.toLocaleString('es-AR')}`, `${(gananciasTotales / ingresosTotales * 100).toFixed(2)}%`]
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
        `$${dia.ingresos.toLocaleString('es-AR')}`,
        `$${dia.costos.toLocaleString('es-AR')}`,
        `$${dia.ganancias.toLocaleString('es-AR')}`,
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
   */
  static generarReporteHistorialVentas(ventas) {
    const doc = new jsPDF();
    doc.text("Historial de Ventas", 20, 10);

    autoTable(doc, {
      head: [["Ticket", "Fecha", "Usuario", "Método de Pago", "Productos", "Total"]],
      body: ventas.map((venta) => [
        venta._id,
        new Date(venta.fecha).toLocaleDateString(),
        venta.usuario ? venta.usuario.nombre || venta.usuario.username : "Usuario desconocido",
        venta.deudorId ? `Deudor: ${venta.deudor?.Nombre || 'Desconocido'}` : venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo',
        venta.ventas
          .map(
            (producto) =>
              `${producto.nombre} - ${producto.cantidad}x $${producto.precioVenta}`
          )
          .join("\n"),
        venta.ventas.reduce(
          (acc, producto) => acc + producto.cantidad * producto.precioVenta,
          0
        ),
      ]),
    });

    doc.save("historial_ventas.pdf");
  }

  /**
   * Genera un reporte de proveedores en PDF
   * @param {Array} proveedores - Lista de proveedores para incluir en el reporte
   */
  static generarReporteProveedores(proveedores) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.text("Listado de Proveedores", 14, 15);
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Fecha: ${currentDate}`, 14, 22);
    
    const headers = [
      'Nombre', 
      'Teléfono', 
      'Email',
      'Contacto Principal',
      'Dirección',
      'Categorías',
      'Notas'
    ];
    
    const rows = proveedores.map(proveedor => [
      proveedor.nombre,
      proveedor.telefono,
      proveedor.email,
      proveedor.contactoPrincipal || '—',
      proveedor.direccion || '—',
      proveedor.categorias.join(', '),
      proveedor.notas || '—'
    ]);
    
    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: rows,
      margin: { top: 30 },
      styles: { overflow: 'linebreak' },
      headStyles: { fillColor: [0, 38, 81] }, // Color #002651
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(`La Despensa - Listado de Proveedores - ${currentDate}`, 14, doc.internal.pageSize.height - 10);
      }
    });
    
    // Guardar PDF
    doc.save("Proveedores.pdf");
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
          rowData.push(`$${cuentaMes.monto.toLocaleString()} (${cuentaMes.estado})`);
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
      `$${producto.PrecioCompra.toLocaleString()}`,
      `$${producto.PrecioVenta.toLocaleString()}`,
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
      const colorGrisClaro = [245, 245, 245]; // Gris muy claro #F5F5F5
      
      const fechaActual = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const horaActual = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // ============ PORTADA REDISEÑADA ============
      // Fondo degradado simulado con rectángulos
      doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Rectángulo decorativo superior
      doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
      doc.rect(0, 0, 210, 80, 'F');
      
      // Elementos decorativos geométricos
      doc.setFillColor(colorAcento[0], colorAcento[1], colorAcento[2]);
      doc.circle(180, 25, 15, 'F');
      doc.setFillColor(255, 255, 255);
      doc.circle(30, 60, 8, 'F');
      
      // Logo/Título principal
      doc.setFontSize(36);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("LA DESPENSA", 105, 120, { align: 'center' });
      
      // Línea decorativa bajo el título
      doc.setDrawColor(colorAcento[0], colorAcento[1], colorAcento[2]);
      doc.setLineWidth(3);
      doc.line(60, 130, 150, 130);
      
      // Subtítulo
      doc.setFontSize(24);
      doc.setTextColor(colorAcento[0], colorAcento[1], colorAcento[2]);
      doc.setFont("helvetica", "normal");
      doc.text("REPORTE INTEGRAL DEL SISTEMA", 105, 150, { align: 'center' });
      
      // Descripción
      doc.setFontSize(16);
      doc.setTextColor(200, 200, 200);
      doc.text("Análisis Completo de Gestión Empresarial", 105, 170, { align: 'center' });
      
      // Información del reporte en recuadro
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(40, 190, 130, 60, 8, 8, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMACIÓN DEL REPORTE", 105, 205, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`Fecha: ${fechaActual}`, 105, 220, { align: 'center' });
      doc.text(`Hora: ${horaActual}`, 105, 230, { align: 'center' });
      doc.text(`Usuario: ${usuario?.email || 'Sistema'}`, 105, 240, { align: 'center' });
      
      // Pie de página de portada
      doc.setFontSize(10);
      doc.setTextColor(180, 180, 180);
      doc.text("Sistema de Gestión Integral", 105, 280, { align: 'center' });
      doc.text("Reporte Generado Automáticamente", 105, 290, { align: 'center' });

      // ============ ÍNDICE MEJORADO ============
      doc.addPage();
      
      // Encabezado del índice
      doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.rect(0, 0, 210, 50, 'F');
      
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ÍNDICE DE CONTENIDOS", 105, 30, { align: 'center' });
      
      // Contenido del índice con iconos simulados
      const indiceItems = [
        { titulo: "📊 Resumen Financiero General", pagina: 3 },
        { titulo: "📦 Análisis de Productos e Inventario", pagina: 4 },
        { titulo: "🛒 Historial de Ventas y Transacciones", pagina: 5 },
        { titulo: "👥 Gestión de Deudores", pagina: 6 },
        { titulo: "🏢 Directorio de Proveedores", pagina: 7 },
        { titulo: "💳 Cuentas por Pagar", pagina: 8 },
        { titulo: "📈 Estadísticas Generales", pagina: 9 },
        { titulo: "📋 Conclusiones y Recomendaciones", pagina: 10 }
      ];

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      let yPos = 70;
      
      indiceItems.forEach((item, index) => {
        // Línea alterna de fondo
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(20, yPos - 10, 170, 20, 'F');
        }
        
        // Punto decorativo
        doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.circle(30, yPos, 2, 'F');
        
        doc.text(item.titulo, 40, yPos + 2);
        doc.text(item.pagina.toString(), 170, yPos + 2);
        
        // Línea punteada
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(40, yPos + 5, 165, yPos + 5);
        doc.setLineDashPattern([], 0);
        
        yPos += 20;
      });

      // ============ SECCIONES MEJORADAS ============
      
      // SECCIÓN 1: RESUMEN FINANCIERO
      doc.addPage();
      this.agregarEncabezadoSeccion(doc, "📊 RESUMEN FINANCIERO GENERAL", colorPrimario, colorSecundario);

      if (datosFinancieros) {
        // KPIs principales en tarjetas
        const kpis = [
          { 
            titulo: "Ingresos Totales", 
            valor: `$${datosFinancieros.ingresosTotales?.toLocaleString('es-AR') || '0'}`,
            color: colorExito,
            icono: "💰"
          },
          { 
            titulo: "Ganancia Neta", 
            valor: `$${datosFinancieros.gananciasTotales?.toLocaleString('es-AR') || '0'}`,
            color: colorSecundario,
            icono: "📈"
          },
          { 
            titulo: "Rentabilidad", 
            valor: `${datosFinancieros.rentabilidadPromedio?.toFixed(2) || '0'}%`,
            color: colorAcento,
            icono: "⚡"
          },
          { 
            titulo: "Transacciones", 
            valor: datosFinancieros.transacciones?.toString() || '0',
            color: colorPrimario,
            icono: "🛒"
          }
        ];

        this.dibujarTarjetasKPI(doc, kpis, 60);

        // Tabla financiera detallada
        const metricsFinancieras = [
          ["Métrica", "Valor", "Estado"],
          ["Ingresos Totales", `$${datosFinancieros.ingresosTotales?.toLocaleString('es-AR') || '0'}`, "✅ Activo"],
          ["Costos Totales", `$${datosFinancieros.costosTotales?.toLocaleString('es-AR') || '0'}`, "📊 Controlado"],
          ["Ganancia Neta", `$${datosFinancieros.gananciasTotales?.toLocaleString('es-AR') || '0'}`, "💹 Positivo"],
          ["Rentabilidad Promedio", `${datosFinancieros.rentabilidadPromedio?.toFixed(2) || '0'}%`, "📈 Saludable"],
          ["Valor Promedio/Transacción", `$${datosFinancieros.valorPromedioTransaccion?.toLocaleString('es-AR') || '0'}`, "🎯 Objetivo"],
          ["Inversión en Mercadería", `$${datosFinancieros.inversionMercaderia?.toLocaleString('es-AR') || '0'}`, "📦 Inventario"]
        ];

        autoTable(doc, {
          startY: 160,
          head: [metricsFinancieras[0]],
          body: metricsFinancieras.slice(1),
          headStyles: { 
            fillColor: [colorPrimario[0], colorPrimario[1], colorPrimario[2]],
            textColor: [255, 255, 255],
            fontSize: 12,
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          styles: { 
            fontSize: 11,
            cellPadding: 8
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { halign: 'right', cellWidth: 50 },
            2: { halign: 'center', cellWidth: 40 }
          },
          margin: { left: 20, right: 20 }
        });

        // Top categorías con gráfico visual simulado
        if (datosFinancieros.topCategorias?.length > 0) {
          const newY = doc.lastAutoTable.finalY + 25;
          
          doc.setFontSize(16);
          doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
          doc.setFont("helvetica", "bold");
          doc.text("🏆 TOP CATEGORÍAS POR INGRESOS", 20, newY);

          const categoriasData = datosFinancieros.topCategorias.slice(0, 5).map((cat, index) => [
            `${index + 1}°`,
            cat.nombre,
            `$${cat.ingresos?.toLocaleString('es-AR') || '0'}`,
            `${cat.porcentaje?.toFixed(1) || '0'}%`,
            this.generarBarraProgreso(cat.porcentaje || 0)
          ]);

          autoTable(doc, {
            startY: newY + 10,
            head: [["Pos.", "Categoría", "Ingresos", "%", "Rendimiento"]],
            body: categoriasData,
            headStyles: { 
              fillColor: [colorSecundario[0], colorSecundario[1], colorSecundario[2]],
              textColor: [255, 255, 255],
              fontSize: 11,
              fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            styles: { fontSize: 10, cellPadding: 6 },
            columnStyles: {
              0: { halign: 'center', cellWidth: 15 },
              1: { cellWidth: 50 },
              2: { halign: 'right', cellWidth: 35 },
              3: { halign: 'center', cellWidth: 20 },
              4: { halign: 'center', cellWidth: 50 }
            },
            margin: { left: 20, right: 20 }
          });
        }
      }

      // SECCIÓN 2: PRODUCTOS E INVENTARIO
      doc.addPage();
      this.agregarEncabezadoSeccion(doc, "📦 ANÁLISIS DE PRODUCTOS E INVENTARIO", colorPrimario, colorSecundario);

      if (productos?.length > 0) {
        // Estadísticas generales de productos
        const stockTotal = productos.reduce((sum, p) => sum + (p.Stock || 0), 0);
        const valorInventario = productos.reduce((sum, p) => sum + ((p.PrecioCompra || 0) * (p.Stock || 0)), 0);
        const productosBajoStock = productos.filter(p => (p.Stock || 0) < 10).length;
        const categorias = [...new Set(productos.map(p => p.Categoria))];

        const statsProductos = [
          ["Total de Productos", productos.length.toString()],
          ["Stock Total (unidades)", stockTotal.toLocaleString('es-AR')],
          ["Valor del Inventario", `$${valorInventario.toLocaleString('es-AR')}`],
          ["Productos con Bajo Stock", productosBajoStock.toString()],
          ["Categorías Diferentes", categorias.length.toString()],
          ["Precio Promedio de Venta", `$${(productos.reduce((sum, p) => sum + (p.PrecioVenta || 0), 0) / productos.length).toLocaleString('es-AR')}`]
        ];

        autoTable(doc, {
          startY: 40,
          head: [["Métrica", "Valor"]],
          body: statsProductos,
          headStyles: { fillColor: colorPrimario },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          styles: { fontSize: 11 },
          margin: { left: 20, right: 20 }
        });

        // Top 15 productos por valor de inventario
        const newY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.text("Top 15 Productos por Valor de Inventario", 20, newY);

        const topProductos = productos
          .map(p => ({
            ...p,
            valorInventario: (p.PrecioCompra || 0) * (p.Stock || 0)
          }))
          .sort((a, b) => b.valorInventario - a.valorInventario)
          .slice(0, 15)
          .map((p, index) => [
            index + 1,
            p.Nombre || 'Sin nombre',
            p.Categoria || 'Sin categoría',
            (p.Stock || 0).toString(),
            `$${(p.PrecioCompra || 0).toLocaleString('es-AR')}`,
            `$${p.valorInventario.toLocaleString('es-AR')}`
          ]);

        autoTable(doc, {
          startY: newY + 5,
          head: [["#", "Producto", "Categoría", "Stock", "Precio", "Valor Total"]],
          body: topProductos,
          headStyles: { fillColor: colorSecundario },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
      }

      // ============ SECCIÓN 3: HISTORIAL DE VENTAS ============
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("3. HISTORIAL DE VENTAS Y TRANSACCIONES", 20, 25);
      doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
      doc.line(20, 30, 190, 30);

      if (ventas?.length > 0) {
        // Estadísticas de ventas
        const ventasHoy = ventas.filter(v => {
          const fechaVenta = new Date(v.fecha);
          const hoy = new Date();
          return fechaVenta.toDateString() === hoy.toDateString();
        });

        const ventasEfectivo = ventas.filter(v => v.metodoPago === 'efectivo').length;
        const ventasTarjeta = ventas.filter(v => v.metodoPago === 'tarjeta').length;
        const ventasDeudores = ventas.filter(v => v.deudorId).length;

        const totalVentas = ventas.reduce((sum, v) => {
          return sum + v.ventas.reduce((acc, p) => acc + (p.precioVenta * p.cantidad), 0);
        }, 0);

        const statsVentas = [
          ["Total de Ventas Registradas", ventas.length.toString()],
          ["Ventas del Día", ventasHoy.length.toString()],
          ["Valor Total de Ventas", `$${totalVentas.toLocaleString('es-AR')}`],
          ["Ventas en Efectivo", `${ventasEfectivo} (${((ventasEfectivo/ventas.length)*100).toFixed(1)}%)`],
          ["Ventas con Tarjeta", `${ventasTarjeta} (${((ventasTarjeta/ventas.length)*100).toFixed(1)}%)`],
          ["Ventas a Deudores", `${ventasDeudores} (${((ventasDeudores/ventas.length)*100).toFixed(1)}%)`],
          ["Ticket Promedio", `$${(totalVentas/ventas.length).toLocaleString('es-AR')}`]
        ];

        autoTable(doc, {
          startY: 40,
          head: [["Métrica de Ventas", "Valor"]],
          body: statsVentas,
          headStyles: { fillColor: colorPrimario },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          styles: { fontSize: 11 },
          margin: { left: 20, right: 20 }
        });

        // Últimas 20 ventas
        const newY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.text("Últimas 20 Transacciones", 20, newY);

        const ultimasVentas = ventas
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 20)
          .map(v => {
            const total = v.ventas.reduce((acc, p) => acc + (p.precioVenta * p.cantidad), 0);
            const metodoPago = v.deudorId ? 'Deudor' : v.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo';
            return [
              v._id?.substring(0, 8) || 'N/A',
              new Date(v.fecha).toLocaleDateString('es-AR'),
              new Date(v.fecha).toLocaleTimeString('es-AR'),
              metodoPago,
              `$${total.toLocaleString('es-AR')}`
            ];
          });

        autoTable(doc, {
          startY: newY + 5,
          head: [["Ticket", "Fecha", "Hora", "Método", "Total"]],
          body: ultimasVentas,
          headStyles: { fillColor: colorSecundario },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
      }

      // ============ SECCIÓN 4: GESTIÓN DE DEUDORES ============
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("4. GESTIÓN DE DEUDORES", 20, 25);
      doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
      doc.line(20, 30, 190, 30);

      if (deudores?.length > 0) {
        // Estadísticas de deudores
        const deudaTotal = deudores.reduce((sum, d) => {
          const deuda = parseFloat(d.deudaTotal?.replace(/[\$\.,]/g, '') || '0');
          return sum + deuda;
        }, 0);

        const deudoresConDeuda = deudores.filter(d => {
          const deuda = parseFloat(d.deudaTotal?.replace(/[\$\.,]/g, '') || '0');
          return deuda > 0;
        });

        const mayorDeudor = deudores.reduce((max, d) => {
          const deuda = parseFloat(d.deudaTotal?.replace(/[\$\.,]/g, '') || '0');
          const maxDeuda = parseFloat(max.deudaTotal?.replace(/[\$\.,]/g, '') || '0');
          return deuda > maxDeuda ? d : max;
        }, deudores[0]);

        const statsDeudores = [
          ["Total de Deudores Registrados", deudores.length.toString()],
          ["Deudores con Deuda Pendiente", deudoresConDeuda.length.toString()],
          ["Deuda Total del Sistema", `$${deudaTotal.toLocaleString('es-AR')}`],
          ["Deuda Promedio", `$${(deudaTotal/deudores.length).toLocaleString('es-AR')}`],
          ["Mayor Deudor", mayorDeudor?.Nombre || 'N/A'],
          ["Mayor Deuda Individual", mayorDeudor?.deudaTotal || '$0']
        ];

        autoTable(doc, {
          startY: 40,
          head: [["Métrica de Deudores", "Valor"]],
          body: statsDeudores,
          headStyles: { fillColor: colorPrimario },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          styles: { fontSize: 11 },
          margin: { left: 20, right: 20 }
        });

        // Top 15 deudores
        const newY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.text("Top 15 Deudores por Monto", 20, newY);

        const topDeudores = deudores
          .map(d => ({
            ...d,
            deudaNum: parseFloat(d.deudaTotal?.replace(/[\$\.,]/g, '') || '0')
          }))
          .sort((a, b) => b.deudaNum - a.deudaNum)
          .slice(0, 15)
          .map((d, index) => [
            index + 1,
            d.Nombre || 'Sin nombre',
            d.numeroTelefono || 'Sin teléfono',
            new Date(d.fechaPaga).toLocaleDateString('es-AR'),
            d.deudaTotal || '$0'
          ]);

        autoTable(doc, {
          startY: newY + 5,
          head: [["#", "Nombre", "Teléfono", "Fecha Pago", "Deuda"]],
          body: topDeudores,
          headStyles: { fillColor: colorSecundario },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
      }

      // ============ SECCIÓN 5: DIRECTORIO DE PROVEEDORES ============
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("5. DIRECTORIO DE PROVEEDORES", 20, 25);
      doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
      doc.line(20, 30, 190, 30);

      if (proveedores?.length > 0) {
        // Estadísticas de proveedores
        const proveedoresActivos = proveedores.filter(p => p.estado === 'activo');
        const categoriasProveedores = [...new Set(proveedores.flatMap(p => p.categorias || []))];

        const statsProveedores = [
          ["Total de Proveedores", proveedores.length.toString()],
          ["Proveedores Activos", proveedoresActivos.length.toString()],
          ["Proveedores Inactivos", (proveedores.length - proveedoresActivos.length).toString()],
          ["Categorías Cubiertas", categoriasProveedores.length.toString()]
        ];

        autoTable(doc, {
          startY: 40,
          head: [["Métrica de Proveedores", "Valor"]],
          body: statsProveedores,
          headStyles: { fillColor: colorPrimario },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          styles: { fontSize: 11 },
          margin: { left: 40, right: 40 }
        });

        // Listado completo de proveedores
        const newY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.text("Directorio Completo de Proveedores", 20, newY);

        const datosProveedores = proveedores.slice(0, 20).map((p, index) => [
          index + 1,
          p.nombre || 'Sin nombre',
          p.telefono || 'Sin teléfono',
          p.email || 'Sin email',
          p.contactoPrincipal || 'Sin contacto',
          (p.categorias || []).join(', ') || 'Sin categorías'
        ]);

        autoTable(doc, {
          startY: newY + 5,
          head: [["#", "Nombre", "Teléfono", "Email", "Contacto", "Categorías"]],
          body: datosProveedores,
          headStyles: { fillColor: colorSecundario },
          styles: { fontSize: 8 },
          margin: { left: 20, right: 20 }
        });
      }

      // ============ SECCIÓN 6: CUENTAS POR PAGAR ============
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
      doc.text("6. CUENTAS POR PAGAR", 20, 25);
      doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
      doc.line(20, 30, 190, 30);

      if (cuentasPorPagar?.length > 0) {
        // Estadísticas de cuentas por pagar
        const cuentasPendientes = cuentasPorPagar.filter(c => c.Estado === 'Pendiente');
        const cuentasPagadas = cuentasPorPagar.filter(c => c.Estado === 'Pagado');
        const totalPendiente = cuentasPendientes.reduce((sum, c) => sum + (c.Monto || 0), 0);
        const totalPagado = cuentasPagadas.reduce((sum, c) => sum + (c.Monto || 0), 0);

        const statsCuentas = [
          ["Total de Cuentas", cuentasPorPagar.length.toString()],
          ["Cuentas Pendientes", cuentasPendientes.length.toString()],
          ["Cuentas Pagadas", cuentasPagadas.length.toString()],
          ["Monto Total Pendiente", `$${totalPendiente.toLocaleString('es-AR')}`],
          ["Monto Total Pagado", `$${totalPagado.toLocaleString('es-AR')}`],
          ["Total General", `$${(totalPendiente + totalPagado).toLocaleString('es-AR')}`]
        ];

        autoTable(doc, {
          startY: 40,
          head: [["Métrica de Cuentas", "Valor"]],
          body: statsCuentas,
          headStyles: { fillColor: colorPrimario },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          styles: { fontSize: 11 },
          margin: { left: 40, right: 40 }
        });

        // Cuentas pendientes más importantes
        const newY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.text("Cuentas Pendientes de Mayor Importe", 20, newY);

        const cuentasPendientesOrdenadas = cuentasPendientes
          .sort((a, b) => (b.Monto || 0) - (a.Monto || 0))
          .slice(0, 15)
          .map((c, index) => [
            index + 1,
            c.Nombre || 'Sin nombre',
            c.numeroVerificador || 'Sin número',
            c.Categoria || 'Sin categoría',
            `$${(c.Monto || 0).toLocaleString('es-AR')}`,
            c.Mes || 'Sin mes'
          ]);

        autoTable(doc, {
          startY: newY + 5,
          head: [["#", "Proveedor", "N° Verificador", "Categoría", "Monto", "Mes"]],
          body: cuentasPendientesOrdenadas,
          headStyles: { fillColor: colorSecundario },
          styles: { fontSize: 9 },
          margin: { left: 20, right: 20 }
        });
      }

      // ============ PIE DE PÁGINA PROFESIONAL ============
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        if (i > 1) { // No agregar pie de página en la portada
          // Línea superior del pie de página
          doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
          doc.setLineWidth(1);
          doc.line(20, 280, 190, 280);
          
          // Información del pie de página
          doc.setFontSize(9);
          doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
          doc.setFont("helvetica", "normal");
          
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          
          // Izquierda: Nombre del sistema
          doc.text("La Despensa - Sistema de Gestión", 20, pageHeight - 15);
          
          // Centro: Fecha del reporte
          doc.text(fechaActual, pageWidth / 2, pageHeight - 15, { align: 'center' });
          
          // Derecha: Número de página
          doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
          
          // Línea decorativa final
          doc.setDrawColor(colorAcento[0], colorAcento[1], colorAcento[2]);
          doc.setLineWidth(0.5);
          doc.line(20, pageHeight - 10, 190, pageHeight - 10);
        }
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