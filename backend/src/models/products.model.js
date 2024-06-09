import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  valorVenta: {
    type: Number,
    required: true,
  },
  valorCompra: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  fechaVencimiento: { 
    type: Date,
    required: true,
  },
})

const Product = mongoose.model('Product', ProductSchema);
export default Product;