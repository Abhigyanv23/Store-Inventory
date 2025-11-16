const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to Database
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL Database');
  
  // Create table if not exists
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      min_stock INT NOT NULL DEFAULT 0,
      supplier VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('❌ Error creating table:', err);
    } else {
      console.log('✅ Products table ready');
      
      // Insert sample data if table is empty
      db.query('SELECT COUNT(*) as count FROM products', (err, results) => {
        if (!err && results[0].count === 0) {
          const sampleData = `
            INSERT INTO products (name, sku, category, price, quantity, min_stock, supplier) VALUES
            ('Wireless Headphones', 'WH-001', 'Electronics', 79.99, 45, 10, 'TechCorp'),
            ('Cotton T-Shirt', 'TS-002', 'Clothing', 24.99, 8, 15, 'FashionHub'),
            ('Smart Water Bottle', 'WB-003', 'Lifestyle', 34.99, 0, 5, 'LifeStyle Inc'),
            ('Laptop Stand', 'LS-004', 'Office', 49.99, 23, 8, 'OfficeMax'),
            ('Yoga Mat', 'YM-005', 'Fitness', 39.99, 12, 10, 'FitGear')
          `;
          db.query(sampleData, (err) => {
            if (!err) console.log('✅ Sample data inserted');
          });
        }
      });
    }
  });
});

// ==================== API ROUTES ====================

// Get all products
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products ORDER BY updated_at DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const formattedProducts = results.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: parseFloat(product.price),
      quantity: product.quantity,
      minStock: product.min_stock,
      supplier: product.supplier,
      status: product.quantity === 0 ? 'Out of Stock' : 
              product.quantity <= product.min_stock ? 'Low Stock' : 'In Stock',
      lastUpdated: product.updated_at
    }));
    
    res.json(formattedProducts);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const query = 'SELECT * FROM products WHERE id = ?';
  
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = results[0];
    res.json({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: parseFloat(product.price),
      quantity: product.quantity,
      minStock: product.min_stock,
      supplier: product.supplier
    });
  });
});

// Create new product
app.post('/api/products', (req, res) => {
  const { name, sku, category, price, quantity, minStock, supplier } = req.body;
  
  if (!name || !sku || !category || price === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const query = `
    INSERT INTO products (name, sku, category, price, quantity, min_stock, supplier) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [name, sku, category, price, quantity, minStock || 0, supplier || ''], 
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'SKU already exists' });
        }
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({ 
        message: 'Product created successfully',
        id: result.insertId 
      });
  });
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const { name, sku, category, price, quantity, minStock, supplier } = req.body;
  
  const query = `
    UPDATE products 
    SET name = ?, sku = ?, category = ?, price = ?, quantity = ?, min_stock = ?, supplier = ?
    WHERE id = ?
  `;
  
  db.query(query, [name, sku, category, price, quantity, minStock, supplier, req.params.id],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'SKU already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ message: 'Product updated successfully' });
  });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const query = 'DELETE FROM products WHERE id = ?';
  
  db.query(query, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  });
});

// Get dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) as count FROM products',
    value: 'SELECT SUM(price * quantity) as total FROM products',
    lowStock: 'SELECT COUNT(*) as count FROM products WHERE quantity <= min_stock AND quantity > 0',
    outOfStock: 'SELECT COUNT(*) as count FROM products WHERE quantity = 0'
  };
  
  Promise.all([
    new Promise((resolve, reject) => db.query(queries.total, (err, res) => err ? reject(err) : resolve(res))),
    new Promise((resolve, reject) => db.query(queries.value, (err, res) => err ? reject(err) : resolve(res))),
    new Promise((resolve, reject) => db.query(queries.lowStock, (err, res) => err ? reject(err) : resolve(res))),
    new Promise((resolve, reject) => db.query(queries.outOfStock, (err, res) => err ? reject(err) : resolve(res)))
  ])
  .then(([total, value, lowStock, outOfStock]) => {
    res.json({
      totalProducts: total[0].count,
      totalValue: parseFloat(value[0].total) || 0,
      lowStockItems: lowStock[0].count,
      outOfStockItems: outOfStock[0].count
    });
  })
  .catch(err => {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
