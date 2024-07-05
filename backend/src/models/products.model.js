import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
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
  precioVenta: {
    type: Number,
    required: true,
  },
  precioCompra: { 
    type: Number,
    required: true,
  },
  fechaVencimiento: {
    type: Date,
    required: true,
  },
  precioAntiguo: {
    type: Number,
    required: false,
  },
}, { 
  versionKey: false,
  timestamps: true,});

const Product = mongoose.model('Product', ProductSchema);
export default Product;