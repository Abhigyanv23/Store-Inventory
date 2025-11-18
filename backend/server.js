const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();
const { Parser } = require('json2csv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-12345';
if (JWT_SECRET === 'your-fallback-secret-key-12345') {
  console.warn('WARNING: Using fallback JWT_SECRET. Set a strong JWT_SECRET in your .env file.');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

function logStockChange(productId, productName, oldQty, newQty, reason, userName) {
  const logQuery = `
    INSERT INTO stock_logs (product_id, product_name, old_quantity, new_quantity, reason, user_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(logQuery, [productId, productName, oldQty, newQty, reason, userName || 'System'], (err) => {
    if (err) console.error("Error logging stock change:", err);
  });
}

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL Database');
  
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS suppliers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
    );
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
    );
    CREATE TABLE IF NOT EXISTS stock_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      product_name VARCHAR(255),
      old_quantity INT NOT NULL,
      new_quantity INT NOT NULL,
      reason VARCHAR(100) NOT NULL,
      user_name VARCHAR(100),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  db.query(createTablesQuery, (err) => {
    if (err) {
      console.error('❌ Error creating tables:', err);
    } else {
      console.log('✅ All tables (Users, Products, Categories, Suppliers, Logs) are ready');
      insertSampleData();
    }
  });
});

function insertSampleData() {
  const insertSuppliers = `
    INSERT IGNORE INTO suppliers (name) VALUES
    ('TechCorp'), ('FashionHub'), ('LifeStyle Inc'), ('OfficeMax'), ('FitGear'), ('Unassigned');
  `;
  const insertCategories = `
    INSERT IGNORE INTO categories (name) VALUES
    ('Electronics'), ('Clothing'), ('Lifestyle'), ('Office'), ('Fitness'), ('Uncategorized');
  `;
  const insertProducts = `
    INSERT IGNORE INTO products (name, sku, category, price, quantity, min_stock, supplier) VALUES
    ('Wireless Headphones', 'WH-001', 'Electronics', 79.99, 45, 10, 'TechCorp'),
    ('Cotton T-Shirt', 'TS-002', 'Clothing', 24.99, 8, 15, 'FashionHub'),
    ('Smart Water Bottle', 'WB-003', 'Lifestyle', 34.99, 0, 5, 'LifeStyle Inc'),
    ('Laptop Stand', 'LS-004', 'Office', 49.99, 23, 8, 'OfficeMax'),
    ('Yoga Mat', 'YM-005', 'Fitness', 39.99, 12, 10, 'FitGear');
  `;
  db.query(insertSuppliers, (err) => { if (!err) console.log('✅ Sample suppliers inserted'); });
  db.query(insertCategories, (err) => { if (!err) console.log('✅ Sample categories inserted'); });
  db.query(insertProducts, (err) => { if (!err) console.log('✅ Sample products inserted'); });
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action.' });
  }
  next();
};

// ==================== AUTH ROUTES (PUBLIC) ====================
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [rows] = await db.promise().query('SELECT COUNT(*) as count FROM users');
    const role = rows[0].count === 0 ? 'admin' : 'staff';
    const query = 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)';
    db.query(query, [username, hashedPassword, role], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already taken' });
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Login successful', token, user: payload });
  });
});

// ==================== SECURED API ROUTES ====================
app.use(authenticateToken);

// ==================== CATEGORY ROUTES (Admin Only) ====================
app.get('/api/categories', isAdmin, (req, res) => {
  db.query('SELECT * FROM categories ORDER BY name', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});
app.post('/api/categories', isAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });
  db.query('INSERT INTO categories (name) VALUES (?)', [name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Category already exists' });
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, name });
  });
});
app.delete('/api/categories/:id', isAdmin, (req, res) => {
  const categoryId = req.params.id;
  db.query('SELECT name FROM categories WHERE id = ?', [categoryId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Category not found' });
    const categoryName = results[0].name;
    db.query('SELECT COUNT(*) as count FROM products WHERE category = ?', [categoryName], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results[0].count > 0) {
        return res.status(400).json({ error: `Cannot delete category: "${categoryName}" is in use by ${results[0].count} product(s).` });
      }
      db.query('DELETE FROM categories WHERE id = ?', [categoryId], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Category deleted successfully' });
      });
    });
  });
});

// ==================== SUPPLIER ROUTES (Admin Only) ====================
app.get('/api/suppliers', isAdmin, (req, res) => {
  db.query('SELECT * FROM suppliers ORDER BY name', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});
app.post('/api/suppliers', isAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Supplier name required' });
  db.query('INSERT INTO suppliers (name) VALUES (?)', [name], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Supplier already exists' });
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: result.insertId, name });
  });
});
app.delete('/api/suppliers/:id', isAdmin, (req, res) => {
  const supplierId = req.params.id;
  db.query('SELECT name FROM suppliers WHERE id = ?', [supplierId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    const supplierName = results[0].name;
    db.query('SELECT COUNT(*) as count FROM products WHERE supplier = ?', [supplierName], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results[0].count > 0) {
        return res.status(400).json({ error: `Cannot delete supplier: "${supplierName}" is in use by ${results[0].count} product(s).` });
      }
      db.query('DELETE FROM suppliers WHERE id = ?', [supplierId], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Supplier deleted successfully' });
      });
    });
  });
});

// ==================== PRODUCT ROUTES (Mixed Roles) ====================
app.get('/api/products', (req, res) => {
  const { category, status, search, supplier } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  let conditions = [];
  let params = [];
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (supplier) {
    conditions.push('supplier = ?');
    params.push(supplier);
  }
  if (status) {
    if (status === 'In Stock') conditions.push('quantity > min_stock');
    else if (status === 'Low Stock') conditions.push('quantity <= min_stock AND quantity > 0');
    else if (status === 'Out of Stock') conditions.push('quantity = 0');
  }
  if (search) {
    conditions.push('(name LIKE ? OR sku LIKE ?)');
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }
  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  const countQuery = 'SELECT COUNT(*) as totalCount FROM products' + whereClause;
  const productsQuery = 'SELECT * FROM products' + whereClause + ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  
  Promise.all([
    db.promise().query(countQuery, params),
    db.promise().query(productsQuery, [...params, limit, offset])
  ])
  .then(([[countResults], [productResults]]) => {
    const totalCount = countResults[0].totalCount;
    const totalPages = Math.ceil(totalCount / limit);
    const formattedProducts = productResults.map(product => ({
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
    let finalProducts = formattedProducts;
    if (status) {
      finalProducts = formattedProducts.filter(p => p.status === status);
    }
    res.json({
      products: finalProducts,
      totalPages: totalPages,
      currentPage: page,
      totalProducts: totalCount
    });
  })
  .catch(err => {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  });
});

app.get('/api/products/export', isAdmin, (req, res) => {
  const query = 'SELECT name, sku, category, price, quantity, min_stock, supplier FROM products ORDER BY name ASC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('CSV Export error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(results);
    res.header('Content-Type', 'text/csv');
    res.attachment('products.csv');
    res.send(csv);
  });
});

app.get('/api/products/:id', (req, res) => {
  const query = 'SELECT * FROM products WHERE id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Product not found' });
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

app.post('/api/products', isAdmin, (req, res) => {
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
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'SKU already exists' });
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      logStockChange(result.insertId, name, 0, parseInt(quantity, 10), 'Product Created', req.user.username);
      res.status(201).json({ 
        message: 'Product created successfully',
        id: result.insertId 
      });
  });
});

app.put('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const { role, username } = req.user;
  const { name, sku, category, price, quantity, minStock, supplier } = req.body;

  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Product not found' });
    
    const oldProduct = results[0];
    let updateQuery = '';
    let params = [];

    if (role === 'admin') {
      updateQuery = `
        UPDATE products 
        SET name = ?, sku = ?, category = ?, price = ?, quantity = ?, min_stock = ?, supplier = ?
        WHERE id = ?
      `;
      params = [name, sku, category, price, quantity, minStock, supplier, productId];
    } else {
      updateQuery = `
        UPDATE products 
        SET quantity = ?, min_stock = ?
        WHERE id = ?
      `;
      params = [quantity, minStock, productId];
    }

    db.query(updateQuery, params, (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'SKU already exists' });
          return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
        
        const newQuantity = parseInt(quantity, 10);
        if (oldProduct.quantity !== newQuantity) {
          const productName = role === 'admin' ? name : oldProduct.name;
          logStockChange(productId, productName, oldProduct.quantity, newQuantity, 'Stock Update', username);
        }
        res.json({ message: 'Product updated successfully' });
    });
  });
});

app.delete('/api/products/:id', isAdmin, (req, res) => {
  const productId = req.params.id;
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Product not found' });
    const oldProduct = results[0];
    db.query('DELETE FROM products WHERE id = ?', [productId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      logStockChange(productId, oldProduct.name, oldProduct.quantity, 0, 'Product Deleted', req.user.username);
      res.json({ message: 'Product deleted successfully' });
    });
  });
});

// ==================== DASHBOARD & CHART ROUTES ====================
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

// --- THIS ROUTE IS FIXED ---
app.get('/api/dashboard/category-chart', (req, res) => {
  const { startDate, endDate } = req.query;

  let params = [];
  let whereClause = ''; // Default to no WHERE clause

  // Check for valid, non-null dates
  if (startDate && endDate && startDate !== 'null' && endDate !== 'null') {
    whereClause = ' WHERE created_at BETWEEN ? AND ?';
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // Include the full end day
    params.push(new Date(startDate), end);
  }

  const query = `
    SELECT category, COUNT(*) as value 
    FROM products 
    ${whereClause}
    GROUP BY category 
    HAVING value > 0
  `;
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Chart query error:", err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// --- THIS ROUTE IS FIXED ---
app.get('/api/dashboard/value-chart', (req, res) => {
  const { startDate, endDate } = req.query;

  let params = [];
  let whereClause = 'WHERE (price * quantity) > 0'; // Base condition

  // Check for valid, non-null dates
  if (startDate && endDate && startDate !== 'null' && endDate !== 'null') {
    whereClause += ' AND created_at BETWEEN ? AND ?';
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    params.push(new Date(startDate), end);
  }
  
  const query = `
    SELECT name, (price * quantity) as value 
    FROM products 
    ${whereClause}
    ORDER BY value DESC 
    LIMIT 5
  `;
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Chart query error:", err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ==================== STOCK LOG ROUTE (Admin Only) ====================
app.get('/api/logs', isAdmin, (req, res) => {
  const query = 'SELECT id, product_name, old_quantity, new_quantity, reason, user_name, timestamp FROM stock_logs ORDER BY timestamp DESC LIMIT 200';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
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
