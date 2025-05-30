import mongoose from "mongoose";

const VentaSchema = new mongoose.Schema({
  ticketId: { type: String, required: true },
  codigoBarras: { type: String, required: true },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  categoria: { type: String, required: true },
  precioVenta: { type: Number, required: true },
  precioCompra: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metodoPago: { type: String, enum: ['efectivo', 'tarjeta'], default: 'efectivo' },
  deudorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deudor', default: null }
});

const Venta = mongoose.model("Venta", VentaSchema);
export default Venta;
