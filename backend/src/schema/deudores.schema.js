import Joi from 'joi';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Identificador no válido.');
  }
  return value;
};

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
});
export const idDeudorSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator, 'Validación Id producto')
}).messages({
  'object.unknown': 'No se permiten propiedades adicionales.'
});
