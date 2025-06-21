import { useEffect, useState } from 'react';
import type { Product, Company } from './model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ProductsPanelProps {
  selectedCompany: Company | null;
  onAddToCart: (productId: string) => Promise<void>;
}

export function ProductsPanel({ selectedCompany, onAddToCart }: ProductsPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 2;

  useEffect(() => {
    fetch(`${API_BASE_URL}/products?page=${page}&pageSize=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        setTotal(data.total);
      });
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h2>Product Catalog</h2>
      <div className="product-list" role="list">
        {products.map(product => (
          <div className="product-card" role="listitem" key={product.id}>
            <h3>{product.Name}</h3>
            <span>Price: ${product.PricePerUnit.toFixed(2)}</span>
            <span>In Stock: {product.UnitsInStock}</span>
            {product.Discontinued && <span className="discontinued">Discontinued</span>}
            <button
              className="add-to-cart-btn"
              disabled={!selectedCompany}
              onClick={() => selectedCompany && onAddToCart(product.id)}
            >
              Add to cart
            </button>
          </div>
        ))}
      </div>
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt; Prev</button>
        <span>Page {page} of {totalPages} - {total}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>&gt; Next</button>
      </div>
    </div>
  );
}
