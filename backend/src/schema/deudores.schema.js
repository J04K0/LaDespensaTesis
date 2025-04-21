import Joi from 'joi';
import mongoose from 'mongoose';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Identificador no válido.');
  }
  return value;
};

const pagoSchema = Joi.object({
  fecha: Joi.date().required(),
  monto: Joi.number().positive().required(),
  tipo: Joi.string().valid('pago', 'deuda').required(),
  comentario: Joi.string().max(50).optional().messages({
    'string.max': 'El comentario no puede exceder los 100 caracteres.'
  })
});

export const deudorSchema = Joi.object({
  Nombre: Joi.string().required().messages({
    'string.base': 'El nombre debe ser una cadena de texto.',
    'string.empty': 'El nombre no puede estar vacío.',
    'any.required': 'El nombre es un campo requerido.'
  }),
  fechaPaga: Joi.string().isoDate().required().messages({
    'date.base': 'La fecha de pago debe ser una fecha válida.',
    'date.format': 'La fecha de pago debe estar en formato ISO.',
    'any.required': 'La fecha de pago es un campo requerido.'
  }),
  numeroTelefono: Joi.string()
    .length(9)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.base': 'El número de teléfono debe ser una cadena.',
      'string.length': 'El número de teléfono debe tener exactamente 9 dígitos.',
      'string.pattern.base': 'El número de teléfono debe ser un número.',
      'any.required': 'El número de teléfono es un campo requerido.'
    }),
  deudaTotal: Joi.number().required().messages({
    'number.base': 'La deuda total debe ser un número.',
    'any.required': 'La deuda total es un campo requerido.'
  }),
  historialPagos: Joi.array().items(pagoSchema)
});

export const idDeudorSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator, 'Validación Id deudor')
}).messages({
  'object.unknown': 'No se permiten propiedades adicionales.'
});
