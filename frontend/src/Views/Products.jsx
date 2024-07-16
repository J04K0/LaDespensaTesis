import React from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import '../styles/ProductsStyles.css';
import Mantequilla from '../../public/mantequilla.png';
import MonsterEnergy from '../../public/monsterenergy.png';
import Lays from '../../public/lays.png';

const productList = [
  {
    image: Mantequilla,
    price: '1.000',
    brand: 'Colun',
    description: 'Mantequilla con Sal, 250 g',
  },
  {
    image: MonsterEnergy,
    price: '1.700',
    brand: 'Monster Energy',
    description: 'Monster Absolutely Zero, 473 ml',
  },
  {
    image: Lays,
    price: '2.000',
    brand: 'Lays',
    description: 'Papas fritas corte americano, 350 g',
  },
  // Añade más productos según sea necesario
];

const Products = () => {
  return (
    <div className="products-page">
      <Navbar />
      <div className="products-content">
        <div className="products-header">
          <button className="filter-button">Buscar por nombre</button>
          <button className="filter-button">Ordenar por</button>
          <button className="filter-button">Filtrar por</button>
        </div>
        <div className="product-list">
          {productList.map((product, index) => (
            <ProductCard
              key={index}
              image={product.image}
              price={product.price}
              brand={product.brand}
              description={product.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Products;
