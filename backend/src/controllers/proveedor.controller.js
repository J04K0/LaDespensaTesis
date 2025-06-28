import Proveedor from '../models/proveedores.model.js';
import Product from '../models/products.model.js'; // Asegúrate de que esta línea exista
import { handleSuccess, handleErrorClient, handleErrorServer } from '../utils/resHandlers.js';
import { proveedorSchema } from '../schema/proveedores.schema.js';

// Obtener todos los proveedores
export const getProveedores = async (req, res) => {
  try {
    const { page = 1, limit = 8, incluirInactivos = false } = req.query;

    let filtro = {};
    if (incluirInactivos === 'true') {
      filtro = { activo: false };
    } else if (incluirInactivos === 'false' || incluirInactivos === false) {
      filtro = { activo: true };
    }
    
    const proveedores = await Proveedor.find(filtro)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Proveedor.countDocuments(filtro);
    
    if (proveedores.length === 0) {
      return handleSuccess(res, 200, 'No hay proveedores registrados con los criterios seleccionados', {
        proveedores: [],
        totalPages: 0,
        currentPage: page
      });
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
    const proveedorExistente = await Proveedor.findOne({ email: req.body.email });
    if (proveedorExistente) {
      return handleErrorClient(res, 400, 'Ya existe un proveedor con este email');
    }
    const { value, error } = proveedorSchema.validate(req.body);
        if (error) return handleErrorClient(res, 400, error.message);

    const { productos, ...datosProveedor } = req.body;
    
    const nuevoProveedor = new Proveedor({
      nombre: datosProveedor.nombre,
      telefono: datosProveedor.telefono,
      email: datosProveedor.email,
      direccion: datosProveedor.direccion || '',
      categorias: datosProveedor.categorias,
      notas: datosProveedor.notas || '',
      contactoPrincipal: datosProveedor.contactoPrincipal || '',
      sitioWeb: datosProveedor.sitioWeb || '',
      productos: productos || []
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
    
    const proveedor = await Proveedor.findById(id);
    if (!proveedor) {
      return handleErrorClient(res, 404, 'Proveedor no encontrado');
    }

    if (req.body.email !== proveedor.email) {
      const emailExistente = await Proveedor.findOne({ 
        email: req.body.email, 
        _id: { $ne: id } 
      });
      
      if (emailExistente) {
        return handleErrorClient(res, 400, 'Ya existe otro proveedor con este email');
      }
    }

    const { value, error } = proveedorSchema.validate(req.body);
        if (error) return handleErrorClient(res, 400, error.message);
    
    const proveedorActualizado = await Proveedor.findByIdAndUpdate(
      id,
      {
        nombre: req.body.nombre,
        telefono: req.body.telefono,
        email: req.body.email,
        direccion: req.body.direccion || '',
        categorias: req.body.categorias,
        notas: req.body.notas || '',
        contactoPrincipal: req.body.contactoPrincipal || '',
        sitioWeb: req.body.sitioWeb || ''
      },
      { new: true }
    );
    
    handleSuccess(res, 200, 'Proveedor actualizado', proveedorActualizado);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al actualizar el proveedor', err.message);
  }
};

// Cambiar el estado de un proveedor (activo/inactivo)
export const cambiarEstadoProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return handleErrorClient(res, 400, 'El estado "activo" debe ser un valor booleano');
    }
    
    const proveedor = await Proveedor.findByIdAndUpdate(
      id,
      { activo },
      { new: true }
    );
    
    if (!proveedor) {
      return handleErrorClient(res, 404, 'Proveedor no encontrado');
    }
    
    const mensaje = activo ? 'Proveedor activado' : 'Proveedor desactivado';
    handleSuccess(res, 200, mensaje, proveedor);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al cambiar el estado del proveedor', err.message);
  }
};

// Obtener productos de un proveedor
export const getProductosProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proveedor = await Proveedor.findById(id);
    if (!proveedor) {
      return handleErrorClient(res, 404, 'Proveedor no encontrado');
    }
    
    // Verificar si el proveedor tiene productos
    if (!proveedor.productos || proveedor.productos.length === 0) {
      return handleSuccess(res, 200, 'El proveedor no tiene productos vinculados', []);
    }
   
    const productos = await Product.find({ _id: { $in: proveedor.productos } });
     
    handleSuccess(res, 200, 'Productos del proveedor obtenidos con éxito', productos);
  } catch (err) {
    console.error('Error específico al obtener productos:', err);
    handleErrorServer(res, 500, 'Error al obtener los productos del proveedor', err.message);
  }
};

// Vincular productos a un proveedor
export const vincularProductos = async (req, res) => {
  try {
    const { id } = req.params;
    const { productos } = req.body;
    
    if (!productos || !Array.isArray(productos)) {
      return handleErrorClient(res, 400, 'Se requiere un array de IDs de productos');
    }
    
    const proveedor = await Proveedor.findById(id);
    if (!proveedor) {
      return handleErrorClient(res, 404, 'Proveedor no encontrado');
    }

    const productosExistentes = await Product.find({ _id: { $in: productos } });
    if (productosExistentes.length !== productos.length) {
      return handleErrorClient(res, 400, 'Algunos productos no existen');
    }
 
    const proveedorActualizado = await Proveedor.findByIdAndUpdate(
      id,
      { productos: productos },
      { new: true }
    );
    
    handleSuccess(res, 200, 'Productos vinculados al proveedor', proveedorActualizado);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al vincular productos al proveedor', err.message);
  }
};