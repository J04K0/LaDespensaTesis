import Joi from 'joi';
import mongoose from 'mongoose';
import { CATEGORIAS_PRODUCTOS } from '../constants/products.constants.js';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Identificador no válido.');
  }
  return value;
};

const dateValidator = (value, helpers) => {
  const dateValue = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
  
  // Permitir fechas de hoy en adelante
  if (dateValue < today) {
    return helpers.message('La fecha de vencimiento debe ser igual o posterior a la fecha actual.');
  }
  return value;
};

export const productSchema = Joi.object({
  Nombre: Joi.string().min(2).max(25).required().messages({
    'string.empty': 'El nombre del producto es obligatorio',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder los 25 caracteres'
  }),
  Marca: Joi.string().min(2).max(15).required().messages({
    'string.empty': 'La marca del producto es obligatoria',
    'string.min': 'La marca debe tener al menos 2 caracteres',
    'string.max': 'La marca no puede exceder los 15 caracteres'
  }),
  Stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'El stock debe ser un número entero',
    'number.min': 'El stock no puede ser negativo',
    'number.empty': 'El stock del producto es obligatorio'
  }),
  Categoria: Joi.string()
    .valid(...CATEGORIAS_PRODUCTOS)
    .required()
    .messages({
      'any.only': 'Categoría no válida',
      'string.empty': 'La categoría del producto es obligatoria',
      'string.base': 'La categoría del producto debe ser una cadena de texto'
    }),
  PrecioVenta: Joi.number().min(1).required().messages({
    'number.base': 'El precio de venta debe ser un número',
    'number.min': 'El precio de venta no puede ser negativo',
    'number.empty': 'El precio de venta es obligatorio'
  }),
  PrecioCompra: Joi.number().min(0).required().messages({
    'number.base': 'El precio de compra debe ser un número',
    'number.min': 'El precio de compra no puede ser negativo',
    'number.empty': 'El precio de compra es obligatorio'
  }),
  fechaVencimiento: Joi.date().custom(dateValidator).required().messages({
    'date.base': 'La fecha de vencimiento debe ser una fecha válida',
    'date.empty': 'La fecha de vencimiento es obligatoria'
  }),
  precioAntiguo: Joi.number().min(0).optional().messages({
    'number.base': 'El precio antiguo debe ser un número',
    'number.min': 'El precio antiguo no puede ser negativo',
  }),
  codigoBarras: Joi.string().min(8).max(20).pattern(/^\d+$/).required().messages({
    'string.empty': 'El código de barras del producto es obligatorio',
    'string.min': 'El código de barras debe tener entre 8 y 20 caracteres',
    'string.max': 'El código de barras debe tener entre 8 y 20 caracteres',
    'string.pattern.base': 'El código de barras debe contener solo números'
  }),
  image: Joi.string().optional().allow(null).messages({
    "string.base": "El archivo debe ser de tipo string.",
  }),
  motivo: Joi.string().min(10).max(50).optional().messages({
    'string.min': 'El motivo debe tener al menos 10 caracteres',
    'string.max': 'El motivo no puede exceder los 50 caracteres',
    'string.base': 'El motivo debe ser texto'
  }),
  tipoMovimiento: Joi.string().valid('ajuste_manual', 'venta', 'devolucion', 'perdida', 'entrada_inicial', 'correccion').optional().messages({
    'any.only': 'Tipo de movimiento no válido',
    'string.base': 'El tipo de movimiento debe ser texto'
  })
}).options({ 
  allowUnknown: true,
  stripUnknown: true
});

export const idProductSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator, 'Validación Id producto')
}).messages({
  'object.unknown': 'No se permiten propiedades adicionales.'
});
