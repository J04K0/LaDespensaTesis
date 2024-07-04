import Joi from 'joi';

export const deudorSchema = Joi.object({
  Nombre: Joi.string().required().messages({
    'string.base': 'El nombre debe ser una cadena de texto.',
    'string.empty': 'El nombre no puede estar vacío.',
    'any.required': 'El nombre es un campo requerido.'
  }),
  fechaPaga: Joi.string().custom((value, helpers) => {
    if (isNaN(Date.parse(value))) {
      return helpers.error('date.base', { value });
    }
    return value;
  }).required().messages({
    'date.base': 'La fecha de pago debe ser una fecha válida.',
    'any.required': 'La fecha de pago es un campo requerido.'
  }),
  numeroTelefono: Joi.number().integer().required().messages({
    'number.base': 'El número de teléfono debe ser un número.',
    'number.integer': 'El número de teléfono debe ser un número entero.',
    'any.required': 'El número de teléfono es un campo requerido.'
  }),
  deudaTotal: Joi.number().required().messages({
    'number.base': 'La deuda total debe ser un número.',
    'any.required': 'La deuda total es un campo requerido.'
  }),
});
