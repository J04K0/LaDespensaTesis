import mongoose from "mongoose";

const DeudorSchema = new mongoose.Schema({
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
    }, { 
    versionKey: false,
    timestamps: true,});

const Deudor = mongoose.model('Deudor', DeudorSchema);
export default Deudor;