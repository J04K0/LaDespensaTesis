import Joi from 'joi';
import mongoose from 'mongoose';
import { CATEGORIAS_PRODUCTOS } from '../constants/products.constants.js';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Identificador del proveedor no válido');
  }
  return value;
};

export const proveedorSchema = Joi.object({
  nombre: Joi.string().min(2).max(20).required().messages({
    'string.empty': 'El nombre del proveedor es obligatorio',
    'string.min': 'El nombre del proveedor debe tener al menos 2 caracteres',
    'string.max': 'El nombre del proveedor no puede exceder los 20 caracteres',
    'any.required': 'El nombre del proveedor es obligatorio'
  }),
  telefono: Joi.string()
      .length(9)
      .pattern(/^\d+$/)
      .required()
      .empty('')
      .messages({
        'string.base': 'El número de teléfono debe ser una cadena.',
        'string.empty': 'El número de teléfono no puede estar vacío.',
        'string.length': 'El número de teléfono debe tener exactamente 9 dígitos.',
        'string.pattern.base': 'El número de teléfono debe ser un número.',
        'any.required': 'El número de teléfono es un campo requerido.'
      }),
  email: Joi.string().email().max(30).required().messages({
    'string.empty': 'El email del proveedor es obligatorio',
    'string.email': 'El email debe tener un formato válido',
    'any.required': 'El email del proveedor es obligatorio'
  }),
  contactoPrincipal: Joi.string().allow('').optional(),
  sitioWeb: Joi.string().min(1).max(100).allow('').uri().optional().messages({
    'string.uri': 'El sitio web debe tener un formato de URL válido',
    'string.min': 'El sitio web debe tener al menos 1 carácter',
    'string.max': 'El sitio web no puede exceder los 100 caracteres',
    'string.empty': 'El sitio web no puede estar vacío'
  }),
  direccion: Joi.string().min(2).max(100).allow('').optional().messages({
    'string.empty': 'La dirección del proveedor no puede estar vacía',
    'string.min': 'La dirección del proveedor debe tener al menos 2 caracteres',
    'string.max': 'La dirección del proveedor no puede exceder los 100 caracteres'
  }),
  categorias: Joi.array()
    .items(Joi.string().valid(...CATEGORIAS_PRODUCTOS))
    .min(1)
    .required()
    .messages({
      'array.base': 'Las categorías deben ser un array',
      'array.includesOnly': 'Una o más categorías no son válidas',
      'any.required': 'Debe seleccionar al menos una categoría',
      'array.min': 'Debe seleccionar al menos una categoría'
    }),
  notas: Joi.string().min(1).max(200).allow('').optional().messages({
    'string.empty': 'Las notas del proveedor no pueden estar vacías',
    'string.min': 'Las notas del proveedor deben tener al menos 1 carácter',
    'string.max': 'Las notas del proveedor no pueden exceder los 200 caracteres'
  }),
  productos: Joi.array().items(Joi.string()).optional(),
  activo: Joi.boolean().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional()
});

export const idProveedorSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator).required()
}).messages({
  'object.unknown': 'No se permiten propiedades adicionales.'
});