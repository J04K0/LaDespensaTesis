import Deudores from '../models/deudores.model.js';
import { deudorSchema, idDeudorSchema } from '../schema/deudores.schema.js';
import { handleSuccess, handleErrorClient, handleErrorServer } from '../utils/resHandlers.js';
import { emitDeudorPagoProximoAlert } from '../services/alert.service.js';
import cron from 'node-cron';


const formatNumberWithDots = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Traer todos los deudores con paginación
// y formatear la deuda total con puntos como separadores de miles
export const getDeudores = async (req, res) => {
  try {
    const { page = 1, limit = 10, incluirInactivos = false } = req.query;
    
    let filtro = {};
    if (incluirInactivos === 'true') {
      filtro = { activo: false };
    } else if (incluirInactivos === 'false' || incluirInactivos === false) {
      filtro = { activo: true };
    }
    
    const deudores = await Deudores.find(filtro)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Deudores.countDocuments(filtro);

    if (deudores.length === 0) {
      return handleSuccess(res, 200, 'No hay deudores registrados con los criterios seleccionados', {
        deudores: [],
        totalPages: 0,
        currentPage: page
      });
    }
    const deudoresFormateados = deudores.map(deudor => ({
      ...deudor.toObject(),
      deudaTotal: `$${formatNumberWithDots(deudor.deudaTotal)}`
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

// Traer un deudor por ID
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

// Crear un nuevo deudor
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

// Actualizar un deudor
// Incluye la actualización del historial de pagos si se proporciona
export const updateDeudor = async (req, res) => {
  try {
    const { id } = req.params;
    const { value: validatedId, error: errorId } = idDeudorSchema.validate({ id });
    if (errorId) return handleErrorClient(res, 400, errorId.message);

    const deudor = await Deudores.findById(validatedId.id);
    if (!deudor) return handleErrorClient(res, 404, 'Deudor no encontrado');

    const { body } = req;
    const updatedDeudor = await Deudores.findByIdAndUpdate(
      validatedId.id,
      {
        Nombre: body.Nombre,
        fechaPaga: body.fechaPaga,
        numeroTelefono: body.numeroTelefono,
        deudaTotal: body.deudaTotal,
        historialPagos: body.historialPagos
      },
      { new: true }
    );

    handleSuccess(res, 200, 'Deudor modificado', updatedDeudor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al modificar a un deudor', err.message);
  }
};

// Eliminar un deudor
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
    const deudores = await Deudores.find({ activo: true }, 'Nombre numeroTelefono deudaTotal');

    if (deudores.length === 0) {
      return handleErrorClient(res, 404, 'No hay deudores registrados');
    }
    
    handleSuccess(res, 200, 'Lista de deudores obtenida', deudores);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener la lista de deudores', err.message);
  }
};

// Cambiar el estado de un deudor (activo/inactivo)
export const cambiarEstadoDeudor = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return handleErrorClient(res, 400, 'El estado "activo" debe ser un valor booleano');
    }
    
    const deudor = await Deudores.findByIdAndUpdate(
      id,
      { activo },
      { new: true }
    );
    
    if (!deudor) {
      return handleErrorClient(res, 404, 'Deudor no encontrado');
    }
    
    const mensaje = activo ? 'Deudor activado' : 'Deudor desactivado';
    handleSuccess(res, 200, mensaje, deudor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al cambiar el estado del deudor', err.message);
  }
};