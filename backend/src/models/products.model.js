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

const Product = model('Product', ProductSchema);
export default Product;