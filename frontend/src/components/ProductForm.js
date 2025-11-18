import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import './ProductForm.css';

// UPDATED: Receive user prop
function ProductForm({ isOpen, onClose, onSubmit, product, categories = [], suppliers = [], user }) {
  
  // NEW: Check user role
  const isStaff = user && user.role === 'staff';
  const isAdmin = user && user.role === 'admin';

  const getInitialState = useCallback(() => ({
    name: '',
    sku: '',
    category: categories[0]?.name || '',
    price: '',
    quantity: '',
    minStock: 0,
    supplier: suppliers[0]?.name || '',
  }), [categories, suppliers]);

  const [formData, setFormData] = useState(getInitialState());
  const isEditing = !!product;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        // We're editing, load the product's data
        setFormData({
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          quantity: product.quantity,
          minStock: product.minStock,
          // Ensure supplier is not null, default to first option or empty
          supplier: product.supplier || (suppliers[0]?.name || ''),
        });
      } else {
        // We're adding a new product
        setFormData(getInitialState());
      }
    }
  }, [product, isEditing, isOpen, categories, suppliers, getInitialState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // When staff edits, they can only change quantity and minStock.
    // We send the *original* form data for other fields to the backend
    // so the backend's "Stock Update" log works correctly.
    const submissionData = isStaff && isEditing ? {
      quantity: parseInt(formData.quantity, 10),
      minStock: parseInt(formData.minStock, 10),
      // Pass original data back
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      supplier: product.supplier,
    } : {
      // Admin can change everything
      ...formData,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity, 10),
      minStock: parseInt(formData.minStock, 10),
    };
    
    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>{isEditing ? `Edit Product` : 'Add New Product'}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X className="icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="product-form">
            
            <div className="form-group form-group-full">
              <label htmlFor="name">Product Name</label>
              <input type="text" id="name" name="name"
                value={formData.name} onChange={handleChange} required 
                disabled={isStaff && isEditing} />
            </div>
            
            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input type="text" id="sku" name="sku"
                value={formData.sku} onChange={handleChange} required 
                disabled={isStaff && isEditing} />
            </div>
            
            {/* === THIS IS THE FIX === */}
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select 
                id="category" 
                name="category"
                value={formData.category} 
                onChange={handleChange} 
                required
                disabled={isStaff && isEditing}
              >
                {/* If user is admin AND categories have loaded, show the full list.
                  Otherwise (if staff OR if data is still loading), 
                  just show the single category for the current product.
                  This prevents the dropdown from appearing blank.
                */}
                {isAdmin && categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))
                ) : (
                  <option value={formData.category}>{formData.category}</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input type="number" id="price" name="price"
                min="0" step="0.01"
                value={formData.price} onChange={handleChange} required 
                disabled={isStaff && isEditing} />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity in Stock</label>
              <input type="number" id="quantity" name="quantity"
                min="0" step="1"
                value={formData.quantity} onChange={handleChange} required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="minStock">Minimum Stock Level</label>
              <input type="number" id="minStock" name="minStock"
                min="0" step="1"
                value={formData.minStock} onChange={handleChange} 
              />
            </div>

            {/* === THIS IS THE FIX === */}
            <div className="form-group">
              <label htmlFor="supplier">Supplier</label>
              <select
                id="supplier"
                name="supplier"
                value={formData.supplier || ''} // Handle null/undefined values
                onChange={handleChange}
                disabled={isStaff && isEditing}
              >
                {/* Same logic as categories */}
                {isAdmin && suppliers.length > 0 ? (
                  suppliers.map(sup => (
                    <option key={sup.id} value={sup.name}>{sup.name}</option>
                  ))
                ) : (
                  <option value={formData.supplier || ''}>{formData.supplier || 'N/A'}</option>
                )}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn btn-submit">
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
