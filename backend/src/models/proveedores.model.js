import { Schema, model } from 'mongoose';

const ProveedorSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  telefono: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  direccion: {
    type: String,
    default: '',
  },
  categorias: {
    type: [String],
    required: true,
  },
  notas: {
    type: String,
    default: '',
  },
  contactoPrincipal: {  // Añadir este campo
    type: String,
    default: '',
  },
  sitioWeb: {  // Añadir este campo
    type: String,
    required: false,
    default: '',
  },
  productos: {
    type: [Schema.Types.ObjectId],
    ref: 'Product',
    default: []
  },
  activo: {
    type: Boolean,
    default: true
  }
}, 
{ 
  versionKey: false,
  timestamps: true,
}
);

const Proveedor = model('Proveedor', ProveedorSchema);
export default Proveedor;