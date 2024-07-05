import Deudores from '../models/deudores.model.js';
import { deudorSchema } from '../schema/deudores.schema.js';
import mongoose from 'mongoose';



// Traer a todos los deudores
export const getDeudores = async (req, res) => {
  try {
    const deudors = await Deudores.find();
    res.json(deudors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Traer a un solo deudor por su ID
export const getDeudorById = async (req, res) => {
  try {
    const deudor = await Deudores.findById(req.params.id);
    if (!deudor) {
      return res.status(404).json({ msg: 'Deudor not found' });
    }
    res.json(deudor);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Deudor not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Crear un nuevo deudor
export const addDeudor = async (req, res) => {
  try {
    const {body } = req;
    console.log("Request body:", body); 
    const {value, error} = deudorSchema.validate(body,{ convert: false });
    if (error) {
      console.log("Validation error details:", error.details);
      return res.status(400).json(error.message);
    }
    const newDeudor = new Deudores(value);
    const deudor = await newDeudor.save();
    res.json(deudor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Actualizar un deudor
export const updateDeudor = async (req, res) => {
  try {
    const { Nombre, fechaPaga, numeroTelefono, deudaTotal } = req.body;

    const deudorFields = {};
    if (Nombre) deudorFields.Nombre = Nombre;
    if (fechaPaga) deudorFields.fechaPaga = fechaPaga;
    if (numeroTelefono) deudorFields.numeroTelefono = numeroTelefono;
    if (deudaTotal) deudorFields.deudaTotal = deudaTotal;

    let deudor = await Deudores.findById(req.params.id);

    if (!deudor) {
      return res.status(404).json({ msg: 'Deudor no encontrado' });
    }

    deudor = await Deudores.findByIdAndUpdate(
      req.params.id,
      { $set: deudorFields },
      { new: true }
    );

    res.json(deudor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Eliminar un deudor
export const deleteDeudor = async (req, res) => {
  try {
    const deudor = await Deudores.findByIdAndDelete(req.params.id);

    if (!deudor) {
      return res.status(404).json({ msg: 'Deudor not found' });
    }
    res.json({ msg: 'Deudor removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};



