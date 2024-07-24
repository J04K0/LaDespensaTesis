import Joi from 'joi';
import mongoose from 'mongoose';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Identificador no válido.');
  }
  return value;
};

const dateValidator = (value, helpers) => {
  const dateValue = new Date(value);
  if (dateValue < new Date()) {
    return helpers.message('La fecha de vencimiento debe ser igual o posterior a la fecha actual.');
  }
  return value;
};

export const productSchema = Joi.object({
  Nombre: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'El nombre del producto es obligatorio',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder los 50 caracteres'
  }),
  Marca: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'La marca del producto es obligatoria',
    'string.min': 'La marca debe tener al menos 2 caracteres',
    'string.max': 'La marca no puede exceder los 50 caracteres'
  }),
  Stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'El stock debe ser un número entero',
    'number.min': 'El stock no puede ser negativo',
    'number.empty': 'El stock del producto es obligatorio'
  }),
  Categoria: Joi.string().
  valid(
    'Congelados', 
    'Carnes', 
    'Despensa', 
    'Panaderia y Pasteleria', 
    'Quesos y Fiambres', 
    'Bebidas y Licores', 
    'Lacteos, Huevos y Refrigerados', 
    'Desayuno y Dulces', 
    'Bebes y Niños ', 
    'Cigarros')
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
});

export const idProductSchema = Joi.object({
  id: Joi.string().custom(objectIdValidator, 'Validación Id producto')
}).messages({
  'object.unknown': 'No se permiten propiedades adicionales.'
});
