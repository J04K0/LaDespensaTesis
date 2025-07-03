import { Schema, model } from "mongoose";

const PrecioHistorialSchema = new Schema({
  precioVenta: {
    type: Number,
    required: true,
  },
  precioCompra: {
    type: Number,
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
  }
});

// Nuevo schema para historial de cambios de stock
const StockHistorialSchema = new Schema({
  stockAnterior: {
    type: Number,
    required: true
  },
  stockNuevo: {
    type: Number,
    required: true
  },
  motivo: {
    type: String,
    required: true
  },
  tipoMovimiento: {
    type: String,
    enum: ['ajuste_manual', 'venta', 'devolucion', 'perdida', 'entrada_inicial', 'correccion'],
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// 🆕 NUEVO: Schema para lotes de productos
const LoteSchema = new Schema({
  numeroLote: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0
  },
  precioCompra: {
    type: Number,
    required: true
  },
  precioVenta: {
    type: Number,
    required: true
  },
  fechaVencimiento: {
    type: Date,
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  usuarioCreacion: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activo: {
    type: Boolean,
    default: true
  }
});

const ProductSchema = new Schema({
  Nombre: {
    type: String,
    required: true,
  },
  Marca: {
    type: String,
    required: true,
  },
  // 🔄 MODIFICADO: Stock ahora es calculado desde los lotes
  Stock: {
    type: Number,
    required: true,
    default: 0
  },
  Categoria: {
    type: String,
    required: true,
  },
  // 🔄 MODIFICADO: Precios principales (pueden ser promedio o del lote más reciente)
  PrecioVenta: {
    type: Number,
    required: true,
  },
  PrecioCompra: {
    type: Number,
    required: true,
  },
  PrecioRecomendado: {
    type: Number,
    required: false,
    default: 0,
  },
  // 🆕 NUEVO: Array de lotes
  lotes: [LoteSchema],
  historialPrecios: [PrecioHistorialSchema],
  historialStock: [StockHistorialSchema],
  // 🔄 MODIFICADO: Fecha de vencimiento principal (del lote que vence primero)
  fechaVencimiento: {
    type: Date,
    required: true,
  },
  codigoBarras: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
    default: null
  },
  eliminado: {
    type: Boolean,
    default: false
  },
  fechaEliminacion: {
    type: Date,
    required: false
  },
  usuarioEliminacion: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  motivoEliminacion: {
    type: String,
    enum: ['sin_stock_permanente', 'producto_dañado', 'vencido', 'descontinuado', 'error_registro', 'otro'],
    required: false
  },
  comentarioEliminacion: {
    type: String,
    required: false
  }
}, 
{ 
  versionKey: false,
  timestamps: true,
});

// 🆕 NUEVO: Método para calcular stock total desde lotes
ProductSchema.methods.calcularStockTotal = function() {
  return this.lotes.reduce((total, lote) => {
    return lote.activo ? total + lote.cantidad : total;
  }, 0);
};

// 🆕 NUEVO: Método para obtener el lote que vence primero
ProductSchema.methods.getLoteMasProximoAVencer = function() {
  const lotesActivos = this.lotes.filter(lote => lote.activo && lote.cantidad > 0);
  if (lotesActivos.length === 0) return null;
  
  return lotesActivos.reduce((masProximo, lote) => {
    return new Date(lote.fechaVencimiento) < new Date(masProximo.fechaVencimiento) ? lote : masProximo;
  });
};

// 🆕 NUEVO: Método para generar número de lote automático
ProductSchema.methods.generarNumeroLote = function() {
  const ultimoLote = this.lotes.length > 0 ? Math.max(...this.lotes.map(l => parseInt(l.numeroLote.replace('#', '')) || 0)) : 0;
  return `#${String(ultimoLote + 1).padStart(3, '0')}`;
};

// 🔄 MODIFICADO: Pre-save para actualizar campos calculados
ProductSchema.pre('save', function(next) {
  // Calcular precio recomendado si cambió precio de compra o categoría
  if (this.isModified('PrecioCompra') || this.isModified('Categoria')) {
    const margenBase = 0.23;
    this.PrecioRecomendado = this.PrecioCompra * (1 + margenBase);
  }
  
  // 🔧 ARREGLO CRÍTICO: Solo recalcular stock desde lotes si NO estamos en una venta
  // Para evitar que las ventas sean sobreescritas por el cálculo automático
  if (this.lotes && this.lotes.length > 0 && !this._skipStockRecalculation) {
    // Solo actualizar stock total desde lotes si no hay una venta en proceso
    const stockCalculado = this.calcularStockTotal();
    
    // 🆕 NUEVO: Solo actualizar si el stock calculado es diferente y mayor al actual
    // Esto evita que se sobrescriban las reducciones de stock por ventas
    if (this.isNew || !this.isModified('Stock') || stockCalculado > this.Stock) {
      this.Stock = stockCalculado;
    }
  }
  
  // Actualizar fecha de vencimiento principal (del lote más próximo)
  const loteMasProximo = this.getLoteMasProximoAVencer();
  if (loteMasProximo) {
    this.fechaVencimiento = loteMasProximo.fechaVencimiento;
  }
  // Si no hay lotes, mantener la fecha de vencimiento ingresada manualmente
  
  next();
});

const Product = model('Product', ProductSchema);
export default Product;