import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Search, Package } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import './App.css'; // Import the new CSS file

const API_URL = 'http://localhost:5000/api';

function App() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [productsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/dashboard/stats`)
      ]);
      setProducts(productsRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please check the backend connection.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = async (productData) => {
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, productData);
      } else {
        await axios.post(`${API_URL}/products`, productData);
      }
      fetchData();
      setIsFormOpen(false);
      setEditingProduct(null);
      setError(null);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.error || 'Failed to save product. Please check the console.');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        fetchData();
        setError(null);
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product.');
      }
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="app">
      <div className="app-container">
        
        <header className="header">
          <div className="header-title">
            <Package className="icon" />
            <h1>Inventory Management</h1>
          </div>
          <button onClick={handleAddProduct} className="add-product-btn">
            <Plus className="icon" />
            Add Product
          </button>
        </header>

        <Dashboard stats={stats} />

        <main className="product-list-section">
          <div className="product-list-header">
            <h2>Product List</h2>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="icon" />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          <ProductList
            products={filteredProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        </main>
      </div>

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        product={editingProduct}
      />
    </div>
  );
}

export default App;
