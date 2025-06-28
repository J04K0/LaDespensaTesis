import CuentasPorPagar from '../models/cuentasPorPagar.model.js';
import { handleSuccess, handleErrorClient, handleErrorServer } from '../utils/resHandlers.js';
import { cuentaPorPagarSchema } from '../schema/cuentasPorPagar.schema.js';
import { emitCuentaPorPagarAlert } from '../services/alert.service.js';
import cron from 'node-cron';

// Obtener todas las cuentas por pagar
export const getCuentasPorPagar = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoria, estado, year } = req.query;
    const query = {};
    
    if (categoria) query.Categoria = categoria;
    if (estado) query.Estado = estado;
    if (year) query.Mes = { $regex: `^${year}-` };

    const cuentas = await CuentasPorPagar.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ Mes: 1 })
      .exec();

    const count = await CuentasPorPagar.countDocuments(query);

    if (cuentas.length === 0) {
      return handleErrorClient(res, 404, 'No hay cuentas por pagar registradas');
    }

    handleSuccess(res, 200, 'Cuentas por pagar encontradas', {
      cuentas,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener las cuentas por pagar', err.message);
  }
};

// Obtener una cuenta por pagar por ID
export const getCuentaPorPagarById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cuenta = await CuentasPorPagar.findById(id);
    if (!cuenta) {
      return handleErrorClient(res, 404, 'Cuenta por pagar no encontrada');
    }
    
    handleSuccess(res, 200, 'Cuenta por pagar encontrada', cuenta);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener la cuenta por pagar', err.message);
  }
};

// Crear una nueva cuenta por pagar
export const createCuentaPorPagar = async (req, res) => {
  try {
    const { Nombre, numeroVerificador, Mes, Monto, Estado, Categoria } = req.body;

    const { value, error } = cuentaPorPagarSchema.validate(req.body);
        if (error) return handleErrorClient(res, 400, error.message);

    const nuevaCuenta = new CuentasPorPagar({
      Nombre,
      numeroVerificador,
      Mes,
      Monto,
      Estado,
      Categoria
    });
    
    const cuenta = await nuevaCuenta.save();
    
    handleSuccess(res, 201, 'Cuenta por pagar creada con éxito', cuenta);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al crear la cuenta por pagar', err.message);
  }
};

// Actualizar una cuenta por pagar
export const updateCuentaPorPagar = async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre, numeroVerificador, Mes, Monto, Estado, Categoria } = req.body;
    
   const { value, error } = cuentaPorPagarSchema.validate(req.body);
        if (error) return handleErrorClient(res, 400, error.message);
    
    const cuenta = await CuentasPorPagar.findById(id);
    if (!cuenta) {
      return handleErrorClient(res, 404, 'Cuenta por pagar no encontrada');
    }
    
    const cuentaActualizada = await CuentasPorPagar.findByIdAndUpdate(
      id,
      { Nombre, numeroVerificador, Mes, Monto, Estado, Categoria },
      { new: true }
    );
    
    handleSuccess(res, 200, 'Cuenta por pagar actualizada con éxito', cuentaActualizada);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al actualizar la cuenta por pagar', err.message);
  }
};

// Eliminar una cuenta por pagar
export const deleteCuentaPorPagar = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cuenta = await CuentasPorPagar.findById(id);
    if (!cuenta) {
      return handleErrorClient(res, 404, 'Cuenta por pagar no encontrada');
    }
    
    await CuentasPorPagar.findByIdAndDelete(id);
    
    handleSuccess(res, 200, 'Cuenta por pagar eliminada con éxito');
  } catch (err) {
    handleErrorServer(res, 500, 'Error al eliminar la cuenta por pagar', err.message);
  }
};

// Marcar una cuenta como pagada
export const marcarComoPagada = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cuenta = await CuentasPorPagar.findById(id);
    if (!cuenta) {
      return handleErrorClient(res, 404, 'Cuenta por pagar no encontrada');
    }
    
    if (cuenta.Estado === 'Pagado') {
      return handleErrorClient(res, 400, 'Esta cuenta ya está marcada como pagada');
    }
    
    const cuentaActualizada = await CuentasPorPagar.findByIdAndUpdate(
      id,
      { Estado: 'Pagado' },
      { new: true }
    );
    
    handleSuccess(res, 200, 'Cuenta por pagar marcada como pagada', cuentaActualizada);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al marcar la cuenta como pagada', err.message);
  }
};

// Desmarcar una cuenta como pagada
export const desmarcarComoPagada = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cuenta = await CuentasPorPagar.findById(id);
    if (!cuenta) {
      return handleErrorClient(res, 404, 'Cuenta por pagar no encontrada');
    }
    
    if (cuenta.Estado !== 'Pagado') {
      return handleErrorClient(res, 400, 'Esta cuenta no está marcada como pagada');
    }
    
    const cuentaActualizada = await CuentasPorPagar.findByIdAndUpdate(
      id,
      { Estado: 'Pendiente' },
      { new: true }
    );
    
    handleSuccess(res, 200, 'Cuenta por pagar desmarcada como pagada', cuentaActualizada);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al desmarcar la cuenta como pagada', err.message);
  }
};

// Filtrar cuentas por categoría
export const getCuentasPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    
    const cuentas = await CuentasPorPagar.find({ Categoria: categoria });
    
    if (cuentas.length === 0) {
      return handleErrorClient(res, 404, `No hay cuentas registradas para la categoría ${categoria}`);
    }
    
    handleSuccess(res, 200, `Cuentas de la categoría ${categoria} encontradas`, cuentas);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener las cuentas por categoría', err.message);
  }
};