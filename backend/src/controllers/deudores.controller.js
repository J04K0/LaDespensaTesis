import Deudores from '../models/deudores.model.js';
import { deudorSchema, idDeudorSchema } from '../schema/deudores.schema.js';
import { handleSuccess, handleErrorClient, handleErrorServer } from '../utils/resHandlers.js';
import { emitDeudorPagoProximoAlert } from '../services/alert.service.js';
import cron from 'node-cron';

export const getDeudores = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const deudores = await Deudores.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Deudores.countDocuments();

    if (deudores.length === 0) {
      return handleErrorClient(res, 404, 'No hay deudores registrados');
    }
    const deudoresFormateados = deudores.map(deudor => ({
      ...deudor.toObject(),
      deudaTotal: `${deudor.deudaTotal.toLocaleString("es-CL")}`
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
    console.log("Datos recibidos:", body); // Log para depuración

    // Si los datos contienen historialPagos, actualizar también
    const updatedDeudor = await Deudores.findByIdAndUpdate(
      validatedId.id,
      {
        Nombre: body.Nombre,
        fechaPaga: body.fechaPaga,
        numeroTelefono: body.numeroTelefono,
        deudaTotal: body.deudaTotal,
        historialPagos: body.historialPagos // Incluir historialPagos en la actualización
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

export const updateDeudorPagos = async (req, res) => {
  try {
    const { id } = req.params;
    const { pago, nuevaDeuda } = req.body;
    
    const deudor = await Deudores.findById(id);
    if (!deudor) return handleErrorClient(res, 404, 'Deudor no encontrado');
    
    // Agregar el nuevo pago al historial
    deudor.historialPagos.push(pago);
    // Actualizar la deuda total
    deudor.deudaTotal = nuevaDeuda;
    
    const updatedDeudor = await deudor.save();
    
    handleSuccess(res, 200, 'Pago registrado exitosamente', updatedDeudor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al registrar el pago', err.message);
  }
};

// Obtener lista simple de deudores para selector de ventas
export const getDeudoresSimple = async (req, res) => {
  try {
    const deudores = await Deudores.find({}, 'Nombre numeroTelefono deudaTotal');

    if (deudores.length === 0) {
      return handleErrorClient(res, 404, 'No hay deudores registrados');
    }
    
    handleSuccess(res, 200, 'Lista de deudores obtenida', deudores);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener la lista de deudores', err.message);
  }
};

// Tarea programada para enviar alertas de pago próximo
cron.schedule('0 9 * * *', async () => {
  try {
    const deudores = await Deudores.find();
    deudores.forEach(deudor => {
      const fechaPago = new Date(deudor.fechaPaga);
      const hoy = new Date();
      // Verificar si el pago es en 3 días
      const diffTime = Math.abs(fechaPago - hoy);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays === 3) {
        emitDeudorPagoProximoAlert(deudor);
      }
    });
  } catch (err) {
    console.error('Error al enviar alertas de pago próximo:', err.message);
  }
});
