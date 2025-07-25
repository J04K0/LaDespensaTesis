// Constantes compartidas para productos - Backend
export const STOCK_MINIMO_POR_CATEGORIA = {
  'Congelados': 10,
  'Carnes': 5,
  'Despensa': 8,
  'Panaderia y Pasteleria': 10,
  'Quesos y Fiambres': 5,
  'Bebidas y Licores': 5,
  'Lacteos, Huevos y Refrigerados': 10,
  'Desayuno y Dulces': 10,
  'Snacks': 10,
  'Bebes y Niños': 10,
  'Cigarros': 5,
  'Cuidado Personal': 8,
  'Remedios': 3,
  'Limpieza y Hogar': 5,
  'Mascotas': 5,
  'Otros': 5
};

export const MARGENES_POR_CATEGORIA = {
  'Congelados': 0.25,
  'Carnes': 0.20,
  'Despensa': 0.20,
  'Panaderia y Pasteleria': 0.25,
  'Quesos y Fiambres': 0.25,
  'Bebidas y Licores': 0.33,
  'Lacteos, Huevos y Refrigerados': 0.20,
  'Desayuno y Dulces': 0.30,
  'Snacks': 0.30,
  'Bebes y Niños': 0.28,
  'Cigarros': 0.40,
  'Cuidado Personal': 0.28,
  'Limpieza y Hogar': 0.28,
  'Mascotas': 0.28,
  'Remedios': 0.15,
  'Otros': 0.23
};

export const CATEGORIAS_PRODUCTOS = [
  'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
  'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y Refrigerados',
  'Desayuno y Dulces','Snacks', 'Bebes y Niños', 'Cigarros', 'Cuidado Personal',
  'Limpieza y Hogar', 'Mascotas', 'Remedios', 'Otros'
];