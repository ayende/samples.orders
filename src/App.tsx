import { useEffect, useState, useRef } from 'react'
import type { Product, Company } from './model'
import './App.css'
import { CartPanel } from './CartPanel'
import { OrdersPanel } from './OrdersPanel'
import { ProductsPanel } from './ProductsPanel'

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
  const cartPanelRef = useRef<{ fetchCart: () => void; addToCart: (productId: string) => Promise<void> }>(null);
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
      <div className="main-content">
        <div className="main-left">
          <ProductsPanel
            selectedCompany={selectedCompany}
            onAddToCart={async (productId) => {
              if (!selectedCompany) return;
              await cartPanelRef.current?.addToCart(productId);
            }}
          />
        </div>
        {selectedCompany && (
          <div className="main-right">
            <CartPanel ref={cartPanelRef} company={selectedCompany} />
          </div>
        )}
      </div>
    </div >
  )
}

export default App
