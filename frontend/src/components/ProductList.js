
import { Pencil, Trash2 } from 'lucide-react';
import './ProductList.css'; // Import the new CSS file

function ProductList({ products, onEdit, onDelete }) {

  const getStatusClass = (status) => {
    switch (status) {
      case 'In Stock':
        return 'status-in-stock';
      case 'Low Stock':
        return 'status-low-stock';
      case 'Out of Stock':
        return 'status-out-of-stock';
      default:
        return 'status-default';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  return (
    <div className="table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" className="no-products">
                No products found.
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-name">{product.name}</div>
                  <div className="product-supplier">{product.supplier || 'N/A'}</div>
                </td>
                <td>{product.sku}</td>
                <td>{product.category}</td>
                <td>{formatCurrency(product.price)}</td>
                <td>
                  {product.quantity}
                  <span className="product-quantity"> (Min: {product.minStock})</span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(product)}
                      className="action-btn action-btn-edit"
                      aria-label="Edit"
                    >
                      <Pencil className="icon" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="action-btn action-btn-delete"
                      aria-label="Delete"
                    >
                      <Trash2 className="icon" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProductList;
