import { Schema, model } from "mongoose";

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
  }
);

const Product = model('Product', ProductSchema);
export default Product;