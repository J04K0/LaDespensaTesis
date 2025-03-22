import Joi from 'joi';
import mongoose from 'mongoose';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Identificador del proveedor no válido');
  }
  return value;
};

export const proveedorSchema = Joi.object({
  nombre: Joi.string().required().messages({
    'string.empty': 'El nombre del proveedor es obligatorio',
    'any.required': 'El nombre del proveedor es obligatorio'
  }),
  telefono: Joi.string().required().messages({
    'string.empty': 'El teléfono del proveedor es obligatorio',
    'any.required': 'El teléfono del proveedor es obligatorio'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'El email del proveedor es obligatorio',
    'string.email': 'El email debe tener un formato válido',
    'any.required': 'El email del proveedor es obligatorio'
  }),
  direccion: Joi.string().allow('').optional(),
  categorias: Joi.array().items(Joi.string()).required().messages({
    'array.base': 'Las categorías deben ser un array',
    'any.required': 'Debe seleccionar al menos una categoría'
  }),
  notas: Joi.string().allow('').optional()
});

export const idProveedorSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator).required()
}).messages({
  'object.unknown': 'No se permiten propiedades adicionales.'
});