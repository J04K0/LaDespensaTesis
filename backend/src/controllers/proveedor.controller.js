import Proveedor from '../models/proveedores.model.js';
import { handleSuccess, handleErrorClient, handleErrorServer } from '../utils/resHandlers.js';

// Obtener todos los proveedores
export const getProveedores = async (req, res) => {
  try {
    const { page = 1, limit = 8 } = req.query;
    
    const proveedores = await Proveedor.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Proveedor.countDocuments();
    
    if (proveedores.length === 0) {
      return handleErrorClient(res, 404, 'No hay proveedores registrados');
    }
    
    handleSuccess(res, 200, 'Proveedores encontrados', {
      proveedores,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener los proveedores', err.message);
  }
};

// Obtener un proveedor por ID
export const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proveedor = await Proveedor.findById(id);
    
    if (!proveedor) {
      return handleErrorClient(res, 404, 'Proveedor no encontrado');
    }
    
    handleSuccess(res, 200, 'Proveedor encontrado', proveedor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al obtener el proveedor', err.message);
  }
};

// Crear un nuevo proveedor
export const createProveedor = async (req, res) => {
  try {
    // Verificar si ya existe un proveedor con el mismo email
    const proveedorExistente = await Proveedor.findOne({ email: req.body.email });
    if (proveedorExistente) {
      return handleErrorClient(res, 400, 'Ya existe un proveedor con este email');
    }
    
    const nuevoProveedor = new Proveedor({
      nombre: req.body.nombre,
      telefono: req.body.telefono,
      email: req.body.email,
      direccion: req.body.direccion || '',
      categorias: req.body.categorias,
      notas: req.body.notas || ''
    });
    
    const proveedor = await nuevoProveedor.save();
    
    handleSuccess(res, 201, 'Proveedor creado', proveedor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al crear el proveedor', err.message);
  }
};

// Actualizar un proveedor
export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proveedor existe
    const proveedor = await Proveedor.findById(id);
    if (!proveedor) {
      return handleErrorClient(res, 404, 'Proveedor no encontrado');
    }
    
    // Verificar si otro proveedor ya tiene el mismo email (excepto el actual)
    if (req.body.email !== proveedor.email) {
      const emailExistente = await Proveedor.findOne({ 
        email: req.body.email, 
        _id: { $ne: id } 
      });
      
      if (emailExistente) {
        return handleErrorClient(res, 400, 'Ya existe otro proveedor con este email');
      }
    }
    
    const proveedorActualizado = await Proveedor.findByIdAndUpdate(
      id,
      {
        nombre: req.body.nombre,
        telefono: req.body.telefono,
        email: req.body.email,
        direccion: req.body.direccion || '',
        categorias: req.body.categorias,
        notas: req.body.notas || ''
      },
      { new: true }
    );
    
    handleSuccess(res, 200, 'Proveedor actualizado', proveedorActualizado);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al actualizar el proveedor', err.message);
  }
};

// Eliminar un proveedor
export const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proveedor = await Proveedor.findByIdAndDelete(id);
    
    if (!proveedor) {
      return handleErrorClient(res, 404, 'Proveedor no encontrado');
    }
    
    handleSuccess(res, 200, 'Proveedor eliminado', proveedor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al eliminar el proveedor', err.message);
  }
};