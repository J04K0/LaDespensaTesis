import Deudores from '../models/deudores.model.js';
import { deudorSchema, idDeudorSchema } from '../schema/deudores.schema.js';
import { handleSuccess, handleErrorClient, handleErrorServer } from '../utils/resHandlers.js';

export const getDeudores = async (req, res) => {
  try {
    const { page = 1, limit = 2 } = req.query;

    const deudores = await Deudores.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Deudores.countDocuments();

    if (deudores.length === 0) {
      return handleErrorClient(res, 404, 'No hay deudores registrados');
    }

    // Formatear el monto de la deuda con separadores de miles
    const deudoresFormateados = deudores.map(deudor => ({
      ...deudor.toObject(), // Convertimos el documento de MongoDB a objeto JSON
      deudaTotal: `${deudor.deudaTotal.toLocaleString("es-CL")}` // Formateo de moneda
    }));

    handleSuccess(res, 200, 'Deudores encontrados', {
      deudores: deudoresFormateados,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer los deudores', err.message);
  }
};


export const getDeudorById = async (req, res) => {
  try {
    const deudor = await Deudores.findById(req.params.id);
    if (!deudor) {
      return handleErrorClient(res, 404, 'Deudor no encontrado');
    }
    handleSuccess(res, 200, 'Deudor encontrado', deudor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer un deudor', err.message);
  }
};

export const addDeudor = async (req, res) => {
  try {
    const { body } = req; 
    const { value, error } = deudorSchema.validate(body, { convert: false });
    if (error) {
      return handleErrorClient(res, 400, error.message);
    }
    const newDeudor = new Deudores(value);
    const deudor = await newDeudor.save();
    handleSuccess(res, 201, 'Deudor creado', deudor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al crear un deudor', err.message);
  }
};

export const updateDeudor = async (req, res) => {
  try {
    const { id } = req.params;

    const { value: validatedId, error: errorId } = idDeudorSchema.validate({ id });

    if (errorId) return handleErrorClient(res, 400, errorId.message);

    const deudor = await Deudores.findById(validatedId.id);

    if (!deudor) return handleErrorClient(res, 404, 'Deudor no encontrado');

    const { body } = req;
    const { value, error } = deudorSchema.validate(body);
    if (error) return handleErrorClient(res, 400, error.message);
    const updatedDeudor = await Deudores.findByIdAndUpdate(
      validatedId.id,
      {
        Nombre: value.Nombre,
        fechaPaga: value.fechaPaga,
        numeroTelefono: value.numeroTelefono,
        deudaTotal: value.deudaTotal,
      },
      { new: true }
    );

    handleSuccess(res, 200, 'Deudor modificado', updatedDeudor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al modificar a un deudor', err.message);
  }
};

export const deleteDeudor = async (req, res) => {
  try {
    const { id } = req.params;
    const { value: validatedId, error: errorId } = idDeudorSchema.validate({ id });

    if (errorId) return handleErrorClient(res, 400, errorId.message);

    const deudor = await Deudores.findByIdAndDelete(validatedId.id);

    if (!deudor) return handleErrorClient(res, 404, 'Deudor no encontrado');

    handleSuccess(res, 200, 'Deudor eliminado', deudor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al eliminar un deudor', err.message);
  }
};
