import { Schema, model } from "mongoose";

const PagoSchema = new Schema({
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  monto: {
    type: Number,
    required: true
  },
  tipo: {
    type: String,
    enum: ['pago', 'deuda'],
    required: true
  }
});

const DeudorSchema = new Schema({
  Nombre: {
    type: String,
    required: true,
  },
  fechaPaga: {
    type: Date,
    required: true,
  },
  numeroTelefono: {
    type: Number,
    required: true,
  },
  deudaTotal: {
    type: Number,
    required: true,
  },
  historialPagos: [PagoSchema] // Asegúrate de que esto esté definido
}, 
{
  versionKey: false,
  timestamps: true,
});

const Deudor = model('Deudor', DeudorSchema);
export default Deudor;
