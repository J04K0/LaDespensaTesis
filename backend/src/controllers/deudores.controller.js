import Deudores from '../models/deudores.model.js';
import { deudorSchema,idDeudorSchema } from '../schema/deudores.schema.js';



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
      return res.status(404).json({ msg: 'Deudor no encontrado' });
    }
    res.json(deudor);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Deudor no encontrado' });
    }
    res.status(500).send('Server Error');
  }
};

// Crear un nuevo deudor
export const addDeudor = async (req, res) => {
  try {
    const {body } = req;
    const {value, error} = deudorSchema.validate(body,{ convert: false });
    if (error) {
      console.log("Error detalles de validación:", error.details);
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
    const { id } = req.params;	
    const { value: validatedId, error: errorId } = idDeudorSchema.validate({id});
    if (errorId) return res.status(400).json({ message: errorId.message });
    const deudor = await Deudores.findById(validatedId.id);
    if(deudor.length === 0) return res.status(404).json({ message: 'Deudor no encontrado' });
    const { body } = req;
    const { value, error } = deudorSchema.validate(body);
    if (error) return res.status(400).json({ message: error.message });

    const updateDeudor = await Deudores.findByIdAndUpdate(
      validatedId.id,
      {
        Nombre: value.Nombre,
        fechaPaga: value.fechaPaga,
        numeroTelefono: value.numeroTelefono,
        deudaTotal: value.deudaTotal,
      },
      { new: true }
    )
  
    res.status(200).json({
      msg: "Deudor modificado exitosamente",
      data: updateDeudor
  })
} catch (err) {
  res.status(500).json({ message: 'Error al modificar a un deudor', err });
}
};


// Eliminar un deudor
export const deleteDeudor = async (req, res) => {
  try {
    const deudor = await Deudores.findByIdAndDelete(req.params.id);

    if (!deudor) {
      return res.status(404).json({ msg: 'Deudor no encontrado' });
    }
    res.json({ msg: 'Deudor eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};



