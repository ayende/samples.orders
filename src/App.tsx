import { useEffect, useState, useRef } from 'react'
import type { Product, Company } from './model'
import './App.css'
import { CartPanel } from './CartPanel'
import { OrdersPanel } from './OrdersPanel'
import { ProductsPanel } from './ProductsPanel'
import { AIAgent } from './AIAgent'

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

  // Expose cartPanelRef globally for AIAgent
  useEffect(() => {
    (window as any).cartPanelRef = cartPanelRef.current;
  }, [cartPanelRef.current]);

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
    <div className="main-grid-layout">
      <div className="main-grid-item orders-panel">
        <OrdersPanel
          company={selectedCompany}
          companies={companies}
          onSelectCompany={companyId => {
            const found = companies.find(c => c.id === companyId) || null;
            setSelectedCompany(found);
            setCompanySearch(found ? found.Name + ' (' + found.id + ')' : '');
          }}
        />
      </div>
      <div className="main-grid-item ai-agent">
        <AIAgent />
      </div>
      <div className="main-grid-item cart-panel">
        {selectedCompany && <CartPanel ref={cartPanelRef} company={selectedCompany} />}
      </div>
      <div className="main-grid-item products-panel">
        <ProductsPanel
          selectedCompany={selectedCompany}
          onAddToCart={async (productId) => {
            if (!selectedCompany) return;
            await cartPanelRef.current?.addToCart(productId);
          }}
        />
      </div>
    </div>
  )
}

export default App
