import { Schema, model} from 'mongoose';

const CuentasPorPagarSchema = new Schema({
    Nombre: {
        type: String,
        required: true,
    },
    numeroVerificador: {
        type: String,
        required: true,
    },
    Mes: {
        type: String,
        required: true,
    },
    Monto: {
        type: Number,
        required: true,
    },
    Estado: {
        type: String,
        required: true,
    },
    Categoria: {
        type: String,
        required: true,
    },
    Activo: {
        type: Boolean,
        default: true,
    },
},
{
    versionKey: false,
    timestamps: true,
});

const CuentasPorPagar = model('CuentasPorPagar', CuentasPorPagarSchema);
export default CuentasPorPagar;