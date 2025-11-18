import React, { useState } from 'react';
import api from '../api'; // UPDATED: Import api helper
import { Trash2, Plus } from 'lucide-react';
import './Management.css';

// Reusable component for managing a list (Categories or Suppliers)
function ManagementList({ title, items, onAdd, onDelete, error }) {
  const [newItemName, setNewItemName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onAdd(newItemName.trim());
      setNewItemName('');
    }
  };

  return (
    <div className="management-card">
      <h3>{title}</h3>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="management-form">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`New ${title.slice(0, -1)}`}
        />
        <button type="submit" className="btn-add">
          <Plus className="icon" /> Add
        </button>
      </form>
      <ul className="management-list">
        {items.map(item => (
          <li key={item.id}>
            <span>{item.name}</span>
            <button onClick={() => onDelete(item.id)} className="btn-delete" aria-label="Delete">
              <Trash2 className="icon" />
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="empty-list">No {title.toLowerCase()} found.</li>}
      </ul>
    </div>
  );
}

// Main component
function Management({ categories, suppliers, onRefresh }) {
  const [categoryError, setCategoryError] = useState(null);
  const [supplierError, setSupplierError] = useState(null);

  const handleAdd = async (type, name) => {
    const setError = type === 'categories' ? setCategoryError : setSupplierError;
    try {
      setError(null);
      await api.post(`/${type}`, { name }); // UPDATED: use api
      onRefresh(); // Tell App.js to re-fetch data
    } catch (err) {
      console.error(`Error adding ${type}`, err);
      setError(err.response?.data?.error || `Failed to add ${type}.`);
    }
  };

  const handleDelete = async (type, id) => {
    const setError = type === 'categories' ? setCategoryError : setSupplierError;
    if (!window.confirm(`Are you sure you want to delete this ${type === 'categories' ? 'category' : 'supplier'}?`)) {
      return;
    }
    
    try {
      setError(null);
      await api.delete(`/${type}/${id}`); // UPDATED: use api
      onRefresh(); // Tell App.js to re-fetch data
    } catch (err) {
      console.error(`Error deleting ${type}`, err);
      setError(err.response?.data?.error || `Failed to delete ${type}.`);
    }
  };

  return (
    <div className="management-container">
      <ManagementList
        title="Categories"
        items={categories}
        onAdd={(name) => handleAdd('categories', name)}
        onDelete={(id) => handleDelete('categories', id)}
        error={categoryError}
      />
      <ManagementList
        title="Suppliers"
        items={suppliers}
        onAdd={(name) => handleAdd('suppliers', name)}
        onDelete={(id) => handleDelete('suppliers', id)}
        error={supplierError}
      />
    </div>
  );
}

export default Management;
