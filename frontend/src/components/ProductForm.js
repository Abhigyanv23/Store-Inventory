import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './ProductForm.css'; // Import the new CSS file

function ProductForm({ isOpen, onClose, onSubmit, product }) {
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', price: '',
    quantity: '', minStock: 0, supplier: '',
  });

  const isEditing = !!product;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        minStock: product.minStock,
        supplier: product.supplier || '',
      });
    } else {
      setFormData({
        name: '', sku: '', category: '', price: '',
        quantity: '', minStock: 0, supplier: '',
      });
    }
  }, [product, isEditing, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
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
          <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X className="icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="product-form">
            <div className="form-group form-group-full">
              <label htmlFor="name">Product Name</label>
              <input type="text" id="name" name="name"
                value={formData.name} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input type="text" id="sku" name="sku"
                value={formData.sku} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input type="text" id="category" name="category"
                value={formData.category} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input type="number" id="price" name="price"
                min="0" step="0.01"
                value={formData.price} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity in Stock</label>
              <input type="number" id="quantity" name="quantity"
                min="0" step="1"
                value={formData.quantity} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="minStock">Minimum Stock Level</label>
              <input type="number" id="minStock" name="minStock"
                min="0" step="1"
                value={formData.minStock} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="supplier">Supplier (Optional)</label>
              <input type="text" id="supplier" name="supplier"
                value={formData.supplier} onChange={handleChange} />
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
