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
    default: Date.now,
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
    default: function() {
      return this.PrecioCompra * 1.2; // 20% por encima del precio de compra
    }
  },
  historialPrecios: [PrecioHistorialSchema],
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
    required: true,
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