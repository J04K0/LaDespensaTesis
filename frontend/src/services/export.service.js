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
      doc.text(`Balance en Efectivo: $${balanceEfectivo.toLocaleString()}`, 14, doc.lastAutoTable.finalY + 15);
      
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
      
      // Agregar pie de página con información del usuario
      doc.setFontSize(10);
      doc.text(`Reporte generado por: ${usuarioActual.email} - ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
      
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
    const { ingresosPorDia, ingresosPorCategoria, comparacionIngresoCosto, inversionMercaderiaPorCategoria } = data;
    
    const doc = new jsPDF();
    doc.text("Reporte Financiero - La Despensa", 20, 10);
    
    const fechaActual = new Date().toLocaleDateString();
    doc.text(`Fecha: ${fechaActual}`, 20, 20);
    
    let periodoTexto = "Últimos 7 días";
    if (timeRange === "mes") periodoTexto = "Último mes";
    if (timeRange === "año") periodoTexto = "Último año";
    doc.text(`Periodo: ${periodoTexto}`, 20, 30);
    
    if (ingresosPorDia && ingresosPorDia.labels) {
      doc.text("Ingresos por Día", 20, 45);
      
      const datosIngresos = ingresosPorDia.labels.map((fecha, i) => 
        [fecha, `$${ingresosPorDia.datasets[0].data[i].toLocaleString()}`]
      );
      
      autoTable(doc, {
        startY: 50,
        head: [["Fecha", "Ingresos"]],
        body: datosIngresos,
      });
    }
    
    if (ingresosPorCategoria && ingresosPorCategoria.labels) {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 50;
      doc.text("Ingresos por Categoría", 20, currentY);
      
      const datosCategoria = ingresosPorCategoria.labels.map((categoria, i) => 
        [categoria, `$${ingresosPorCategoria.datasets[0].data[i].toLocaleString()}`]
      );
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Categoría", "Ingresos Totales"]],
        body: datosCategoria,
      });
    }

    if (comparacionIngresoCosto && comparacionIngresoCosto.labels) {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 50;
      doc.text("Comparación de Ingresos y Costos", 20, currentY);
      
      const datosComparacion = comparacionIngresoCosto.labels.map((periodo, i) => 
        [
          periodo, 
          `$${comparacionIngresoCosto.datasets[0].data[i].toLocaleString()}`,
          `$${comparacionIngresoCosto.datasets[1].data[i].toLocaleString()}`,
          `$${comparacionIngresoCosto.datasets[2].data[i].toLocaleString()}`,
        ]
      );
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Periodo", "Ingresos", "Costos", "Ganancias"]],
        body: datosComparacion,
      });
    }
    
    if (inversionMercaderiaPorCategoria && inversionMercaderiaPorCategoria.labels) {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 230;
      doc.text("Inversión en Mercadería por Categoría", 20, currentY);
      
      const datosInversion = inversionMercaderiaPorCategoria.labels.map((categoria, i) => 
        [categoria, `$${inversionMercaderiaPorCategoria.datasets[0].data[i].toLocaleString()}`]
      );
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Categoría", "Inversión Total"]],
        body: datosInversion,
      });
    }
    
    doc.save("reporte_financiero.pdf");
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
}