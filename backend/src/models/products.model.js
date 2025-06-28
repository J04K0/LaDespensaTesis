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

const ProductSchema = new Schema({
  Nombre: {
    type: String,
    required: true,
  },
  Marca: {
    type: String,
    required: true,
  },
  Stock: {
    type: Number,
    required: true,
  },
  Categoria: {
    type: String,
    required: true,
  },
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
  historialPrecios: [PrecioHistorialSchema],
  historialStock: [StockHistorialSchema],
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

ProductSchema.pre('save', function(next) {
  if (this.isModified('PrecioCompra') || this.isModified('Categoria')) {
    const margenBase = 0.23;
    this.PrecioRecomendado = this.PrecioCompra * (1 + margenBase);
  }
  next();
});

const Product = model('Product', ProductSchema);
export default Product;