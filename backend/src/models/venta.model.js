import mongoose from "mongoose";

const VentaSchema = new mongoose.Schema({
  codigoBarras: { type: String, required: true },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  categoria: { type: String, required: true },
  precioVenta: { type: Number, required: true },
  precioCompra: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});

const Venta = mongoose.model("Venta", VentaSchema);
export default Venta;
