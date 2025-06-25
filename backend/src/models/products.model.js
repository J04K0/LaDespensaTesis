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
  // Nuevo campo para historial de cambios de stock
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
  // NUEVOS CAMPOS para auditoría de eliminación
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

// Definir márgenes por categoría (valores promedio del rango sugerido)
const margenesPorCategoria = {
  'Congelados': 0.25, // 25% (promedio de 20-30%)
  'Carnes': 0.20, // 20% (promedio de 15-25%)
  'Despensa': 0.20, // 20% (promedio de 15-25%)
  'Panaderia y Pasteleria': 0.25, // 25% (promedio de 20-30%)
  'Quesos y Fiambres': 0.25, // 25% (promedio de 20-30%)
  'Bebidas y Licores': 0.33, // 33% (promedio de 25-40%)
  'Lacteos, Huevos y otros': 0.20, // 20% (promedio de 15-25%)
  'Desayuno y Dulces': 0.30, // 30% (promedio de 25-35%)
  'Bebes y Niños': 0.28, // 28% (promedio de 20-35%)
  'Cigarros y Tabacos': 0.40, // 40% (promedio de 30-50%)
  'Cuidado Personal': 0.28, // 28% (promedio de 20-35%)
  'Limpieza y Hogar': 0.28, // 28% (promedio de 20-35%)
  'Mascotas': 0.28, // 28% (promedio de 20-35%)
  'Remedios': 0.15, // 15% (promedio de 10-20%)
  'Otros': 0.23  // 23% (promedio de 15-30%)
};

// Middleware pre-save para actualizar el precio recomendado cuando cambia el precio de compra o la categoría
ProductSchema.pre('save', function(next) {
  if (this.isModified('PrecioCompra') || this.isModified('Categoria')) {
    // Obtener el margen según la categoría o usar 0.23 (23%) por defecto
    const margen = margenesPorCategoria[this.Categoria] || 0.23;
    // Calcular el precio recomendado (precio de compra + margen)
    this.PrecioRecomendado = this.PrecioCompra * (1 + margen);
  }
  next();
});

const Product = model('Product', ProductSchema);
export default Product;