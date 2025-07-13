import Joi from 'joi';
import mongoose from 'mongoose';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Identificador de cuenta por pagar no válido');
  }
  return value;
};

// Categorías específicas para cuentas por pagar (servicios y gastos operativos)
const CATEGORIAS_CUENTAS_POR_PAGAR = [
  'Luz', 'Agua', 'Gas', 'Internet', 'Alquiler', 'Impuestos', 
  'Salarios', 'Proveedores', 'Servicios', 'Otros'
];

export const cuentaPorPagarSchema = Joi.object({
  Nombre: Joi.string().required().messages({
    'string.base': 'El nombre debe ser una cadena de texto.',
    'string.empty': 'El nombre no puede estar vacío.',
    'any.required': 'El nombre es un campo requerido.'
  }),
  numeroVerificador: Joi.string().required().min(3).max(20).messages({
    'string.base': 'El número verificador debe ser una cadena de texto.',
    'string.empty': 'El número verificador no puede estar vacío.',
    'string.min': 'El número verificador debe tener al menos 3 caracteres.',
    'string.max': 'El número verificador no puede exceder los 20 caracteres.',
    'any.required': 'El número verificador es un campo requerido.'
  }),
  Mes: Joi.string().required().messages({
    'string.base': 'El mes debe ser una cadena de texto.',
    'string.empty': 'El mes no puede estar vacío.',
    'any.required': 'El mes es un campo requerido.'
  }),
  Monto: Joi.number().positive().required().messages({
    'number.base': 'El monto debe ser un número.',
    'number.positive': 'El monto debe ser un valor positivo.',
    'any.required': 'El monto es un campo requerido.'
  }),
  Estado: Joi.string().valid('Pendiente', 'Pagado', 'Vencido').required().messages({
    'string.base': 'El estado debe ser una cadena de texto.',
    'any.only': 'El estado debe ser uno de los siguientes valores: Pendiente, Pagado o Vencido.',
    'any.required': 'El estado es un campo requerido.'
  }),
  Categoria: Joi.string().valid(...CATEGORIAS_CUENTAS_POR_PAGAR).required().messages({
    'string.base': 'La categoría debe ser una cadena de texto.',
    'any.only': 'La categoría debe ser una de las categorías válidas.',
    'any.required': 'La categoría es un campo requerido.'
  })
});

export const idCuentaPorPagarSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator, 'Validación Id cuenta por pagar')
}).messages({
  'object.unknown': 'No se permiten propiedades adicionales.'
});