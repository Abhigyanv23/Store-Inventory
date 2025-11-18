import { useState, useEffect, useCallback } from 'react';
import api from './api'; 
import { Plus, Search, Package, Download, X, SlidersHorizontal, LayoutDashboard, List, LogOut } from 'lucide-react';

import AuthPage from './components/AuthPage';
import DashboardStats from './components/DashboardStats';
import DashboardCharts from './components/DashboardCharts';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import Management from './components/Management';
import StockLog from './components/StockLog';
import Pagination from './components/Pagination';
import DateRangeSelector from './components/DateRangeSelector'; // <-- IMPORT NEW COMPONENT
import './App.css'; 

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  
  // App view state
  const [view, setView] = useState('dashboard');

  // All data states
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Form/Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '', category: '', status: '', supplier: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // --- NEW: Date Range State ---
  const [dateRange, setDateRange] = useState([null, null]); // [startDate, endDate]

  // --- LOGOUT HANDLER ---
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setProducts([]);
    setStats({});
    setCategories([]);
    setSuppliers([]);
    setLogs([]);
    setCurrentPage(1);
    setTotalPages(0);
    setDateRange([null, null]); // Reset date range
  }, []);

  // --- DATA FETCHING FUNCTIONS ---
  const fetchCoreData = useCallback(async (isAdmin) => {
    try {
      if (isAdmin) {
         const [statsRes, categoriesRes, suppliersRes] = await Promise.all([
          api.get(`/dashboard/stats`),
          api.get(`/categories`),
          api.get(`/suppliers`)
        ]);
        setStats(statsRes.data);
        setCategories(categoriesRes.data);
        setSuppliers(suppliersRes.data);
      } else {
        const statsRes = await api.get(`/dashboard/stats`);
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error fetching core data:', err);
      setError('Failed to load core application data.');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const params = {
        search: filters.search || undefined,
        category: filters.category || undefined,
        status: filters.status || undefined,
        supplier: filters.supplier || undefined,
        page: currentPage,
        limit: 20
      };
      const productsRes = await api.get(`/products`, { params });
      setProducts(productsRes.data.products);
      setTotalPages(productsRes.data.totalPages);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load products.');
    }
  }, [filters, currentPage]); 

  const fetchLogs = useCallback(async (isAdmin) => {
    if (!isAdmin) return; 
    try {
      const logsRes = await api.get(`/logs`);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load stock logs.');
    }
  }, []);

  // --- EFFECTS ---
  
  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    window.addEventListener('forceLogout', handleLogout);
    return () => {
      window.removeEventListener('forceLogout', handleLogout);
    };
  }, [handleLogout]);

  // Fetch core data only when user logs in
  useEffect(() => {
    if (user) {
      const isAdmin = user.role === 'admin';
      fetchCoreData(isAdmin);
      fetchLogs(isAdmin);
    }
  }, [user, fetchCoreData, fetchLogs]);

  // Fetch products when user logs in, filters change, OR page changes
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, filters, currentPage, fetchProducts]);

  // --- EVENT HANDLERS ---
  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setView('dashboard');
    setError(null);
  };

  // When form is submitted, refresh core data (which includes charts)
  const handleFormSubmit = async (productData) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
      } else {
        await api.post(`/products`, productData);
      }
      
      const isAdmin = user.role === 'admin';
      fetchCoreData(isAdmin);
      fetchProducts();
      fetchLogs(isAdmin);

      setIsFormOpen(false);
      setEditingProduct(null);
      setError(null);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.error || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        
        const isAdmin = user.role === 'admin';
        fetchCoreData(isAdmin);
        fetchProducts();
        fetchLogs(isAdmin);
        setError(null);
        setCurrentPage(1); 
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product.');
      }
    }
  };
  
  const handleAddProduct = () => { setEditingProduct(null); setIsFormOpen(true); };
  const handleEditProduct = (product) => { setEditingProduct(product); setIsFormOpen(true); };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); 
  };
  
  const clearFilters = () => {
    setFilters({ search: '', category: '', status: '', supplier: '' });
    setCurrentPage(1); 
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const handleExport = async () => { 
    try {
      const res = await api.get(`/products/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV.');
    }
  };
  
  // --- RENDER ---
  
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const isAdminUser = user.role === 'admin';

  return (
    <div className="app">
      <div className="app-container">
        
        <header className="header">
          <div className="header-title">
            <Package className="icon" />
            <h1>Inventory Management</h1>
          </div>
          
          <div className="header-nav">
            <button 
              onClick={() => setView('dashboard')} 
              className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard className="icon" /> Dashboard
            </button>
            
            {isAdminUser && (
              <>
                <button 
                  onClick={() => setView('management')} 
                  className={`nav-btn ${view === 'management' ? 'active' : ''}`}
                >
                  <SlidersHorizontal className="icon" /> Manage
                </button>
                <button 
                  onClick={() => setView('logs')} 
                  className={`nav-btn ${view === 'logs' ? 'active' : ''}`}
                >
                  <List className="icon" /> Logs
                </button>
              </>
            )}
          </div>

          <div className="header-user-controls">
            <span className="welcome-user">Welcome, {user.username}! ({user.role})</span>
            
            {isAdminUser && (
              <button onClick={handleAddProduct} className="add-product-btn">
                <Plus className="icon" />
                Add Product
              </button>
            )}

            <button onClick={handleLogout} className="logout-btn">
              <LogOut className="icon" />
            </button>
          </div>
        </header>

        {error && (
          <div className="error-message global-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {view === 'dashboard' && (
          <>
            <DashboardStats stats={stats} />
            
            {/* --- NEW: Add the DateRangeSelector --- */}
            <DateRangeSelector 
              onDateChange={(start, end) => setDateRange([start, end])} 
            />

            {/* --- UPDATED: Pass dateRange to charts --- */}
            <DashboardCharts dateRange={dateRange} /> 
            
            <main className="product-list-section">
              <div className="product-list-header">
                <h2>Product List</h2>
                {isAdminUser && (
                  <button onClick={handleExport} className="export-btn">
                    <Download className="icon" />
                    Export as CSV
                  </button>
                )}
              </div>
              
              <div className="filter-bar">
                <div className="search-bar">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search by name or SKU..."
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                  <Search className="icon" />
                </div>
                
                {isAdminUser && (
                  <>
                    <select name="category" value={filters.category} onChange={handleFilterChange} className="filter-select">
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    
                    <select name="supplier" value={filters.supplier} onChange={handleFilterChange} className="filter-select">
                      <option value="">All Suppliers</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.name}>{sup.name}</option>
                      ))}
                    </select>
                  </>
                )}
                
                <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
                  <option value="">All Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                
                <button onClick={clearFilters} className="clear-filters-btn">
                  <X className="icon" />
                  Clear
                </button>
              </div>

              <ProductList
                products={products}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                user={user}
              />
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </main>
          </>
        )}

        {view === 'management' && isAdminUser && (
          <Management 
            categories={categories}
            suppliers={suppliers}
            onRefresh={() => { fetchCoreData(isAdminUser); fetchProducts(); }}
          />
        )}
        
        {view === 'logs' && isAdminUser && (
          <StockLog logs={logs} error={error} />
        )}

      </div>

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        categories={categories} 
        suppliers={suppliers}
        user={user}
      />
    </div>
  );
}

export default App;
