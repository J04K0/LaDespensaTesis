import { Schema, model } from "mongoose";

const PagoSchema = new Schema({
  fecha: {
    type: Date,
    required: [true, "La fecha es obligatoria"],
    default: Date.now,
    validate: {
      validator: function(value) {
        return !isNaN(new Date(value).getTime());
      },
      message: "La fecha proporcionada no es válida"
    }
  },
  monto: {
    type: Number,
    required: [true, "El monto es obligatorio"],
    validate: {
      validator: function(value) {
        return value > 0;
      },
      message: "El monto debe ser mayor que cero"
    }
  },
  tipo: {
    type: String,
    enum: {
      values: ['pago', 'deuda'],
      message: "El tipo debe ser 'pago' o 'deuda'"
    },
    required: [true, "El tipo es obligatorio"]
  },
  metodoPago: {
    type: String,
    enum: {
      values: ['efectivo', 'tarjeta'],
      message: "El método de pago debe ser 'efectivo' o 'tarjeta'"
    },
    default: 'efectivo'
  },
  comentario: {
    type: String,
    maxlength: [50, "El comentario no puede exceder los 50 caracteres"]
  }
});

const DeudorSchema = new Schema({
  Nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true,
    minlength: [2, "El nombre debe tener al menos 2 caracteres"],
    maxlength: [100, "El nombre no puede exceder los 100 caracteres"]
  },
  fechaPaga: {
    type: Date,
    required: [true, "La fecha a pagar es obligatoria"],
    validate: {
      validator: function(value) {
        return !isNaN(new Date(value).getTime());
      },
      message: "La fecha proporcionada no es válida"
    }
  },
  numeroTelefono: {
    type: Number,
    required: [true, "El número de teléfono es obligatorio"],
    validate: {
      validator: function(value) {
        return /^\d{7,15}$/.test(value.toString());
      },
      message: "Número de teléfono inválido"
    }
  },
  deudaTotal: {
    type: Number,
    required: [true, "La deuda total es obligatoria"],
    min: [0, "La deuda total no puede ser negativa"]
  },
  historialPagos: [PagoSchema]
}, 
{
  versionKey: false,
  timestamps: true,
});

const Deudor = model('Deudor', DeudorSchema);
export default Deudor;
