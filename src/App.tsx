import { useEffect, useState, useRef } from 'react'
import type { Product, Company, Order } from './model'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [companies, setCompanies] = useState<Company[]>([])
  const [companySearch, setCompanySearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pageSize = 6

  useEffect(() => {
    fetch(`${API_BASE_URL}/products?page=${page}&pageSize=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products)
        setTotal(data.total)
      })
  }, [page, total])

  useEffect(() => {
    fetch(`${API_BASE_URL}/companies`)
      .then(res => res.json())
      .then(setCompanies)
  }, [])

  // Load selected company from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedCompany')
    if (saved) {
      try {
        const company = JSON.parse(saved)
        setSelectedCompany(company)
        setCompanySearch(company.Name + ' (' + company.id + ')')
      } catch { }
    }
  }, [])

  // Save selected company to localStorage
  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany))
    } else {
      localStorage.removeItem('selectedCompany')
    }
  }, [selectedCompany])

  const totalPages = Math.ceil(total / pageSize)

  const filteredCompanies = companies.filter(c =>
    c.Name.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.id.toLowerCase().includes(companySearch.toLowerCase())
  )

  // Dropdown selection handler
  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company)
    setCompanySearch(company.Name + ' (' + company.id + ')')
    setShowDropdown(false)
  }

  // Hide dropdown on blur (with timeout to allow click)
  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 100)
  }

  return (
    <div className="catalog-container">
      <OrdersPanel company={selectedCompany} />
      <div className="top-bar">
        <div className="company-combo" style={{ position: 'relative' }}>
          {selectedCompany ? (
            <div className="company-label-row">
              <span className="company-label">{selectedCompany.Name} ({selectedCompany.id})</span>
              <button
                className="company-dropdown-trigger"
                onClick={() => {
                  setCompanySearch(selectedCompany.Name);
                  setShowDropdown(v => !v);
                  setTimeout(() => inputRef.current?.focus(), 0);
                  setSelectedCompany(null);
                }}
                aria-label="Change company"
                tabIndex={0}
              >
                ...
              </button>
              {showDropdown && filteredCompanies.length > 0 && (
                <ul className="company-dropdown">
                  {filteredCompanies.map((c, idx) => (
                    <li
                      key={c.id + '-' + idx}
                      onMouseDown={() => handleSelectCompany(c)}
                      className="company-dropdown-item"
                    >
                      {c.Name} ({c.id})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search company..."
                value={companySearch}
                onChange={e => {
                  setCompanySearch(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={handleBlur}
                className="company-search"
                autoComplete="off"
              />
              {showDropdown && filteredCompanies.length > 0 && (
                <ul className="company-dropdown">
                  {filteredCompanies.map((c, idx) => (
                    <li
                      key={c.id + '-' + idx}
                      onMouseDown={() => handleSelectCompany(c)}
                      className="company-dropdown-item"
                    >
                      {c.Name} ({c.id})
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
      <h1>Product Catalog</h1>
      <div className="product-list" role="list">
        {products.map(product => (
          <div className="product-card" role="listitem" key={product.id}>
            <h2>{product.Name}</h2>
            <p>Price: ${product.PricePerUnit.toFixed(2)}</p>
            <p>In Stock: {product.UnitsInStock}</p>
            {product.Discontinued && <span className="discontinued">Discontinued</span>}
          </div>
        ))}
      </div>
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt; Prev</button>
        <span>Page {page} of {totalPages} - {total}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>&gt; Next</button>
      </div>
    </div >
  )
}

function OrdersPanel({ company }: { company: Company | null }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 2

  useEffect(() => {
    if (!company) return
    setLoading(true)
    setError(null)
    fetch(`${API_BASE_URL}/orders?companyId=${encodeURIComponent(company.id)}&page=${page}&pageSize=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load orders')
        setLoading(false)
      })
  }, [company, page])

  useEffect(() => {
    setPage(1)
  }, [company])

  if (!company) return <div className="orders-panel-empty">Choose a company</div>
  if (loading) return <div className="orders-panel-loading">Loading orders...</div>
  if (error) return <div className="orders-panel-error">{error}</div>
  if (!orders.length) return <div className="orders-panel-empty">No orders found</div>

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="orders-panel-list">
      <h3>Orders</h3>
      <ul>
        {orders.map(order => (
          <li key={order.id} className="orders-panel-order">
            <div>Ordered At: {order.OrderedAt?.slice(0, 10)}</div>
            <ul className="orders-panel-lines">
              <li className="orders-panel-lines-header">
                <div>Product</div>
                <div>Qty</div>
                <div>Total</div>
                <div>Discount</div>
              </li>
              {order.Lines.map((line, idx) => (
                <li key={line.Product + '-' + idx} className="orders-panel-line">
                  <div>{line.ProductName}</div>
                  <div>{line.Quantity}</div>
                  <div>${(line.PricePerUnit * line.Quantity * (1 - line.Discount)).toFixed(2)}</div>
                  <div>{line.Discount > 0 ? `${(line.Discount * 100).toFixed(0)}%` : '-'}</div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="orders-panel-pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt; Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>&gt; Next</button>
      </div>
    </div>
  )
}

export default App
