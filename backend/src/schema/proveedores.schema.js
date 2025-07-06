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
  email: Joi.string().email().required().messages({
    'string.empty': 'El email del proveedor es obligatorio',
    'string.email': 'El email debe tener un formato válido',
    'any.required': 'El email del proveedor es obligatorio'
  }),
  contactoPrincipal: Joi.string().allow('').optional(),
  sitioWeb: Joi.string().allow('').uri().optional().messages({
    'string.uri': 'El sitio web debe tener un formato de URL válido'
  }),
  direccion: Joi.string().allow('').optional(),
  categorias: Joi.array()
    .items(Joi.string().valid(
      'Congelados',
      'Carnes',
      'Despensa',
      'Panaderia y Pasteleria',
      'Quesos y Fiambres',
      'Bebidas y Licores',
      'Lacteos, Huevos y Refrigerados',
      'Desayuno y Dulces',
      'Bebes y Niños',
      'Cigarros',
      'Limpieza y Hogar',
      'Cuidado Personal',
      'Mascotas',
      'Remedios',
      'Otros'
    ))
    .min(1)
    .required()
    .messages({
      'array.base': 'Las categorías deben ser un array',
      'array.includesOnly': 'Una o más categorías no son válidas',
      'any.required': 'Debe seleccionar al menos una categoría',
      'array.min': 'Debe seleccionar al menos una categoría'
    }),
  notas: Joi.string().allow('').optional(),
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