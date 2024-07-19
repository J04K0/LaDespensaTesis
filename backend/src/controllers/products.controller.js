import Product from '../models/products.model.js';
import { productSchema, idProductSchema } from '../schema/products.schema.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';

export const getProducts = async (req, res) => { // ! Pensar en realizar paginación, revisar mongoose-paginate-v2
  try {
    const products = await Product.find();

    if(products.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    handleSuccess(res, 200, 'Productos encontrados', products);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer los productos', err.message);
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id); // ! validar id con joi

    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    handleSuccess(res, 200, 'Producto encontrado', product);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer un producto', err.message);
  }
};

export const addProduct = async (req, res) => {
  try {
    const { value, error } = productSchema.validate(req.body)
    if (error) return handleErrorClient(res, 400, error.message);

    const newProduct = new Product(value);

    const product = await newProduct.save();

    handleSuccess(res, 201, 'Producto creado', product);

  } catch (err) {
    handleErrorServer(res, 500, 'Error al crear un producto', err.message);
  }
};

export const updateProduct = async (req, res) => {
  try {
      const { id } = req.params;
      const { value: validatedId, error: errorId } = idProductSchema.validate({id});
      if (errorId) return handleErrorClient(res, 400, errorId.message);

      const product = await Product.findById(validatedId.id);

      if (product.length === 0) return handleErrorClient(res, 404, 'Producto no encontrado');

      const { body } = req;

      const { value, error } = productSchema.validate(body);

      if (error) return handleErrorClient(res, 400, error.message);

      const updatedProduct = await Product.findByIdAndUpdate(
          validatedId.id,
          { 
              Nombre: value.Nombre,
              Marca: value.Marca,
              Stock: value.Stock,
              Categoria: value.Categoria,
              precioVenta: value.PrecioVenta,
              precioCompra: value.PrecioCompra,
              fechaVencimiento: value.fechaVencimiento,
              precioAntiguo: product.PrecioVenta
          },
          { new: true }
      );

      handleSuccess(res, 200, 'Producto modificado', updatedProduct);
  } catch (err) {
      handleErrorServer(res, 500, 'Error al modificar un producto', err.message);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params; // ! validar id con joi

    const { value, error } = idProductSchema.validate({id}, { convert: false });

    if (error) return handleErrorClient(res, 400, error.message);

    const product = await Product.findByIdAndDelete(value.id);

    if (!product) return handleErrorClient(res, 404, 'Producto no encontrado');

    handleSuccess(res, 200, 'Producto eliminado', product);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al eliminar un producto', err.message);
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoria } = req.params; // ! validar categoria con joi

    if (!categoria) return handleErrorClient(res, 400, 'Categoría es requerida');

    const products = await Product.findOne({ Categoria: categoria });

    if (products.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    handleSuccess(res, 200, 'Productos encontrados', products);
  } catch (err) {
    handleErrorServer(res, 500, 'Error al traer los productos', err.message);
  }
};

const stockMinimoPorCategoria = {
  'Congelados': 10,
  'Carnes': 10,
  'Despensa': 10,
  'Panaderia y Pasteleria': 10,
  'Quesos y Fiambres': 10,
  'Bebidas y Licores': 10,
  'Lacteos, Huevos y Refrigerados': 10,
  'Desayuno y Dulces': 10,
  'Bebes y Niños': 10,
  'Cigarros': 5
};

export const verificarStock = async (req, res) => {
  try {
    const productosConPocoStock = await Product.find();

    if (productosConPocoStock.length === 0) return handleErrorClient(res, 404, 'No hay productos registrados');

    const productosFiltrados = productosConPocoStock.filter(producto => {
      const categoria = producto.Categoria; // ! modificar desde la 134 a la 146, debido a que no es muy descriptivo y con no muy buenas practicas
      if (!categoria) {
        console.warn(`Producto sin categoría definida: ${JSON.stringify(producto)}`);
        return false;
      }

      const stockMinimo = stockMinimoPorCategoria[categoria];
      if (stockMinimo === undefined) {
        console.warn(`Categoría no definida en stockMinimoPorCategoria: ${categoria}`);
        return false;
      }
      return producto.Stock < stockMinimo;
    });

    if (productosFiltrados.length > 0) return handleSuccess(res, 200, 'Productos con poco stock', productosFiltrados);

    handleErrorClient(res, 404, 'No hay productos con poco stock');
  } catch (error) {
    handleErrorServer(res, 500, 'Error al verificar el stock', error.message);
  }
};