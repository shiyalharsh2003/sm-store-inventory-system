const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config();

let useMySQL = false;
let pool = null;

// File-based DB path (fallback)
const jsonDbPath = path.join(__dirname, 'local_db.json');

// Initialize database connection
async function initDB() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'store_mgt',
    port: parseInt(process.env.DB_PORT || '3306', 10)
  };

  try {
    // Try to connect to MySQL (first without database to create it if missing)
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    console.log(`[Database] Connected to MySQL server at ${dbConfig.host}:${dbConfig.port}`);
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempConnection.end();

    // Now connect to the actual database
    pool = mysql.createPool(dbConfig);
    useMySQL = true;
    console.log(`[Database] Using MySQL database: "${dbConfig.database}"`);

    // Create tables in MySQL if they do not exist
    await createMySQLTables();
  } catch (error) {
    console.warn(`[Database] Warning: Could not connect to MySQL: ${error.message}`);
    console.log('[Database] Falling back to high-performance local JSON Database (local_db.json) for zero-config execution.');
    useMySQL = false;
    initJSONDB();
  }
}

// MySQL Table Creation
async function createMySQLTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      user_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      min_stock_level INT NOT NULL DEFAULT 5,
      supplier_id INT,
      user_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      transaction_type ENUM('IN', 'OUT') NOT NULL,
      quantity INT NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`
  ];

  for (const query of queries) {
    await pool.query(query);
  }
  console.log('[Database] MySQL tables verified/created successfully.');

  // Run dynamic safe ALTER migrations to include user_id columns on existing DB tables
  try {
    const [sCols] = await pool.query("SHOW COLUMNS FROM suppliers LIKE 'user_id'");
    if (sCols.length === 0) {
      await pool.query("ALTER TABLE suppliers ADD COLUMN user_id INT NULL, ADD CONSTRAINT fk_suppliers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
      console.log("[Database] Migrated existing suppliers table to include user_id.");
    }
  } catch (err) {
    console.warn("[Database] Migration warning for suppliers: ", err.message);
  }

  try {
    const [pCols] = await pool.query("SHOW COLUMNS FROM products LIKE 'user_id'");
    if (pCols.length === 0) {
      await pool.query("ALTER TABLE products ADD COLUMN user_id INT NULL, ADD CONSTRAINT fk_products_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE");
      console.log("[Database] Migrated existing products table to include user_id.");
    }
  } catch (err) {
    console.warn("[Database] Migration warning for products: ", err.message);
  }

  // Seed default admin user in MySQL if users table is empty
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count === 0) {
      const adminEmail = 'admin@store.com';
      const adminUsername = 'admin';
      // password is "admin123" hashed with bcryptjs
      const adminPasswordHash = '$2a$10$bhqjdZ8.YFFLnvq5nXHV8eXe1E6ZDtmM17H1ba.NRmfnmEeBjXo/C';
      await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [adminUsername, adminEmail, adminPasswordHash]
      );
      console.log('[Database] Seeded default administrator user (admin@store.com / admin123) in MySQL.');
    }
  } catch (error) {
    console.error('[Database] Failed to seed default administrator in MySQL:', error.message);
  }

  // Ensure any existing suppliers/products without a user_id default to admin user (id=1)
  try {
    await pool.query("UPDATE suppliers SET user_id = 1 WHERE user_id IS NULL");
    await pool.query("UPDATE products SET user_id = 1 WHERE user_id IS NULL");
  } catch (err) {
    console.warn("[Database] Migration warning while updating default user_id values: ", err.message);
  }

  // Seed default suppliers in MySQL if empty
  try {
    const [sRows] = await pool.query('SELECT COUNT(*) as count FROM suppliers');
    if (sRows[0].count === 0) {
      const defaultSuppliers = [
        ['Apex Electronics Ltd', 'sales@apexelectronics.com', '+91 98765 43210'],
        ['Global Tech Distributors', 'orders@globaltech.com', '+91 99887 76655'],
        ['Super Pack Wholesale', 'support@superpack.in', '+91 88776 65544']
      ];
      for (const s of defaultSuppliers) {
        await pool.query(
          'INSERT INTO suppliers (name, contact_email, phone, user_id) VALUES (?, ?, ?, 1)',
          s
        );
      }
      console.log('[Database] Seeded default suppliers in MySQL.');
    }
  } catch (error) {
    console.error('[Database] Failed to seed default suppliers in MySQL:', error.message);
  }

  // Seed default products in MySQL if empty
  try {
    const [pRows] = await pool.query('SELECT COUNT(*) as count FROM products');
    if (pRows[0].count === 0) {
      // First get the suppliers to match IDs
      const [suppliers] = await pool.query('SELECT id, name FROM suppliers');
      const getSupplierId = (name) => {
        const found = suppliers.find(s => s.name === name);
        return found ? found.id : null;
      };

      const defaultProducts = [
        ['ELEC-MB-001', 'Wireless Mouse Premium', 'Ergonomic 2.4GHz wireless optical mouse with adjustable DPI.', 899.00, 45, 10, getSupplierId('Apex Electronics Ltd')],
        ['ELEC-KB-002', 'Mechanical Keyboard RGB', 'Tactile mechanical keyboard with customizable RGB backlighting and RGB switches.', 2499.00, 4, 8, getSupplierId('Apex Electronics Ltd')],
        ['OFFC-CH-003', 'Ergonomic Office Chair', 'High-back office chair with adjustable lumbar support and mesh fabric.', 7499.00, 12, 3, getSupplierId('Super Pack Wholesale')],
        ['TECH-HD-004', 'Noise Cancelling Headphones', 'Active noise-cancelling over-ear Bluetooth headphones with 30h battery life.', 4999.00, 2, 5, getSupplierId('Global Tech Distributors')],
        ['TECH-USB-005', 'Type-C Hub 6-in-1', 'Aluminum USB-C multi-port adapter with 4K HDMI, USB 3.0, and Power Delivery.', 1599.00, 30, 8, getSupplierId('Global Tech Distributors')]
      ];

      for (const p of defaultProducts) {
        await pool.query(
          'INSERT INTO products (sku, name, description, price, stock_quantity, min_stock_level, supplier_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          p
        );
      }
      console.log('[Database] Seeded default products in MySQL.');
    }
  } catch (error) {
    console.error('[Database] Failed to seed default products in MySQL:', error.message);
  }

  // Seed default transactions in MySQL if empty
  try {
    const [tRows] = await pool.query('SELECT COUNT(*) as count FROM transactions');
    if (tRows[0].count === 0) {
      // Get products to match IDs
      const [products] = await pool.query('SELECT id, sku FROM products');
      const getProductId = (sku) => {
        const found = products.find(p => p.sku === sku);
        return found ? found.id : null;
      };

      const defaultTransactions = [
        [getProductId('ELEC-MB-001'), 'IN', 50, new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)],
        [getProductId('ELEC-MB-001'), 'OUT', 5, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)],
        [getProductId('ELEC-KB-002'), 'IN', 10, new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)],
        [getProductId('ELEC-KB-002'), 'OUT', 6, new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)],
        [getProductId('OFFC-CH-003'), 'IN', 15, new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)],
        [getProductId('OFFC-CH-003'), 'OUT', 3, new Date(Date.now() - 12 * 60 * 60 * 1000)],
        [getProductId('TECH-HD-004'), 'IN', 5, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)],
        [getProductId('TECH-HD-004'), 'OUT', 3, new Date(Date.now() - 2 * 60 * 60 * 1000)]
      ];

      for (const t of defaultTransactions) {
        await pool.query(
          'INSERT INTO transactions (product_id, transaction_type, quantity, date) VALUES (?, ?, ?, ?)',
          t
        );
      }
      console.log('[Database] Seeded default transactions in MySQL.');
    }
  } catch (error) {
    console.error('[Database] Failed to seed default transactions in MySQL:', error.message);
  }
}

// JSON Database Fallback Implementation
function initJSONDB() {
  if (!fs.existsSync(jsonDbPath)) {
    // Seed standard, realistic initial database state for demonstration
    const seedData = {
      users: [
        // password is "admin123" hashed with bcryptjs
        {
          id: 1,
          username: "admin",
          email: "admin@store.com",
          password_hash: "$2a$10$bhqjdZ8.YFFLnvq5nXHV8eXe1E6ZDtmM17H1ba.NRmfnmEeBjXo/C"
        }
      ],
      suppliers: [
        { id: 1, name: "Apex Electronics Ltd", contact_email: "sales@apexelectronics.com", phone: "+91 98765 43210", user_id: 1 },
        { id: 2, name: "Global Tech Distributors", contact_email: "orders@globaltech.com", phone: "+91 99887 76655", user_id: 1 },
        { id: 3, name: "Super Pack Wholesale", contact_email: "support@superpack.in", phone: "+91 88776 65544", user_id: 1 }
      ],
      products: [
        {
          id: 1,
          sku: "ELEC-MB-001",
          name: "Wireless Mouse Premium",
          description: "Ergonomic 2.4GHz wireless optical mouse with adjustable DPI.",
          price: 899.00,
          stock_quantity: 45,
          min_stock_level: 10,
          supplier_id: 1,
          user_id: 1
        },
        {
          id: 2,
          sku: "ELEC-KB-002",
          name: "Mechanical Keyboard RGB",
          description: "Tactile mechanical keyboard with customizable RGB backlighting and RGB switches.",
          price: 2499.00,
          stock_quantity: 4, // Triggering low-stock alert!
          min_stock_level: 8,
          supplier_id: 1,
          user_id: 1
        },
        {
          id: 3,
          sku: "OFFC-CH-003",
          name: "Ergonomic Office Chair",
          description: "High-back office chair with adjustable lumbar support and mesh fabric.",
          price: 7499.00,
          stock_quantity: 12,
          min_stock_level: 3,
          supplier_id: 3,
          user_id: 1
        },
        {
          id: 4,
          sku: "TECH-HD-004",
          name: "Noise Cancelling Headphones",
          description: "Active noise-cancelling over-ear Bluetooth headphones with 30h battery life.",
          price: 4999.00,
          stock_quantity: 2, // Triggering low-stock alert!
          min_stock_level: 5,
          supplier_id: 2,
          user_id: 1
        },
        {
          id: 5,
          sku: "TECH-USB-005",
          name: "Type-C Hub 6-in-1",
          description: "Aluminum USB-C multi-port adapter with 4K HDMI, USB 3.0, and Power Delivery.",
          price: 1599.00,
          stock_quantity: 30,
          min_stock_level: 8,
          supplier_id: 2,
          user_id: 1
        }
      ],
      transactions: [
        { id: 1, product_id: 1, transaction_type: "IN", quantity: 50, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, product_id: 1, transaction_type: "OUT", quantity: 5, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 3, product_id: 2, transaction_type: "IN", quantity: 10, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 4, product_id: 2, transaction_type: "OUT", quantity: 6, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 5, product_id: 3, transaction_type: "IN", quantity: 15, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 6, product_id: 3, transaction_type: "OUT", quantity: 3, date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
        { id: 7, product_id: 4, transaction_type: "IN", quantity: 5, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 8, product_id: 4, transaction_type: "OUT", quantity: 3, date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
      ]
    };
    fs.writeFileSync(jsonDbPath, JSON.stringify(seedData, null, 2), 'utf8');
    console.log('[Database] Created new local_db.json with high-quality seed data.');
  } else {
    console.log('[Database] Found existing local_db.json data.');
  }
}

function readJSONData() {
  try {
    const data = fs.readFileSync(jsonDbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB file, recreating...', err);
    initJSONDB();
    return JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
  }
}

function writeJSONData(data) {
  fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Database Operations Layer (Unified Repository Pattern)
const db = {
  users: {
    async create({ username, email, password_hash }) {
      if (useMySQL) {
        const [result] = await pool.query(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [username, email, password_hash]
        );
        return { id: result.insertId, username, email };
      } else {
        const data = readJSONData();
        const newUser = {
          id: data.users.length ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
          username,
          email,
          password_hash
        };
        data.users.push(newUser);
        writeJSONData(data);
        return { id: newUser.id, username, email };
      }
    },

    async findByEmail(email) {
      if (useMySQL) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
      } else {
        const data = readJSONData();
        return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      }
    },

    async findById(id) {
      if (useMySQL) {
        const [rows] = await pool.query('SELECT id, username, email FROM users WHERE id = ?', [id]);
        return rows[0] || null;
      } else {
        const data = readJSONData();
        const user = data.users.find(u => u.id === parseInt(id, 10));
        if (!user) return null;
        return { id: user.id, username: user.username, email: user.email };
      }
    },

    async updatePassword(email, newPasswordHash) {
      if (useMySQL) {
        await pool.query(
          'UPDATE users SET password_hash = ? WHERE email = ?',
          [newPasswordHash, email]
        );
        return true;
      } else {
        const data = readJSONData();
        const userIndex = data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (userIndex === -1) return false;
        data.users[userIndex].password_hash = newPasswordHash;
        writeJSONData(data);
        return true;
      }
    }
  },

  suppliers: {
    async create({ name, contact_email, phone, userId }) {
      const uId = userId ? parseInt(userId, 10) : null;
      if (useMySQL) {
        const [result] = await pool.query(
          'INSERT INTO suppliers (name, contact_email, phone, user_id) VALUES (?, ?, ?, ?)',
          [name, contact_email, phone, uId]
        );
        return { id: result.insertId, name, contact_email, phone, user_id: uId };
      } else {
        const data = readJSONData();
        const newSupplier = {
          id: data.suppliers.length ? Math.max(...data.suppliers.map(s => s.id)) + 1 : 1,
          name,
          contact_email,
          phone,
          user_id: uId
        };
        data.suppliers.push(newSupplier);
        writeJSONData(data);
        return newSupplier;
      }
    },

    async findAll(userId) {
      const uId = userId ? parseInt(userId, 10) : null;
      if (useMySQL) {
        const [rows] = await pool.query('SELECT * FROM suppliers WHERE user_id = ? ORDER BY name ASC', [uId]);
        return rows;
      } else {
        const data = readJSONData();
        return data.suppliers
          .filter(s => s.user_id === uId)
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    },

    async findById(id, userId) {
      const uId = userId ? parseInt(userId, 10) : null;
      const sid = parseInt(id, 10);
      if (useMySQL) {
        const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ? AND user_id = ?', [sid, uId]);
        return rows[0] || null;
      } else {
        const data = readJSONData();
        return data.suppliers.find(s => s.id === sid && s.user_id === uId) || null;
      }
    }
  },

  products: {
    async create({ sku, name, description, price, stock_quantity, min_stock_level, supplier_id, userId }) {
      const pPrice = parseFloat(price);
      const pStock = parseInt(stock_quantity, 10);
      const pMinStock = parseInt(min_stock_level, 10);
      const pSupplierId = supplier_id ? parseInt(supplier_id, 10) : null;
      const uId = userId ? parseInt(userId, 10) : null;

      if (useMySQL) {
        const [result] = await pool.query(
          'INSERT INTO products (sku, name, description, price, stock_quantity, min_stock_level, supplier_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [sku, name, description, pPrice, pStock, pMinStock, pSupplierId, uId]
        );
        return { id: result.insertId, sku, name, description, price: pPrice, stock_quantity: pStock, min_stock_level: pMinStock, supplier_id: pSupplierId, user_id: uId };
      } else {
        const data = readJSONData();
        if (data.products.some(p => p.sku.toLowerCase() === sku.toLowerCase() && p.user_id === uId)) {
          throw new Error('A product with this SKU already exists.');
        }
        const newProduct = {
          id: data.products.length ? Math.max(...data.products.map(p => p.id)) + 1 : 1,
          sku,
          name,
          description,
          price: pPrice,
          stock_quantity: pStock,
          min_stock_level: pMinStock,
          supplier_id: pSupplierId,
          user_id: uId
        };
        data.products.push(newProduct);
        writeJSONData(data);
        return newProduct;
      }
    },

    async findAll(userId) {
      const uId = userId ? parseInt(userId, 10) : null;
      if (useMySQL) {
        const [rows] = await pool.query(`
          SELECT p.*, s.name as supplier_name 
          FROM products p 
          LEFT JOIN suppliers s ON p.supplier_id = s.id 
          WHERE p.user_id = ?
          ORDER BY p.name ASC
        `, [uId]);
        return rows;
      } else {
        const data = readJSONData();
        return data.products
          .filter(p => p.user_id === uId)
          .map(p => {
            const supplier = data.suppliers.find(s => s.id === p.supplier_id);
            return {
              ...p,
              supplier_name: supplier ? supplier.name : null
            };
          }).sort((a, b) => a.name.localeCompare(b.name));
      }
    },

    async findById(id, userId) {
      const uId = userId ? parseInt(userId, 10) : null;
      const pid = parseInt(id, 10);
      if (useMySQL) {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND user_id = ?', [pid, uId]);
        return rows[0] || null;
      } else {
        const data = readJSONData();
        return data.products.find(p => p.id === pid && p.user_id === uId) || null;
      }
    },

    async update(id, updates, userId) {
      const pid = parseInt(id, 10);
      const uId = userId ? parseInt(userId, 10) : null;
      if (useMySQL) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(updates)) {
          if (['sku', 'name', 'description', 'price', 'stock_quantity', 'min_stock_level', 'supplier_id'].includes(key)) {
            fields.push(`\`${key}\` = ?`);
            values.push(key === 'price' ? parseFloat(value) : (['stock_quantity', 'min_stock_level', 'supplier_id'].includes(key) && value !== null ? parseInt(value, 10) : value));
          }
        }
        if (fields.length === 0) return null;
        values.push(pid);
        values.push(uId);
        await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND user_id = ?', [pid, uId]);
        return rows[0] || null;
      } else {
        const data = readJSONData();
        const index = data.products.findIndex(p => p.id === pid && p.user_id === uId);
        if (index === -1) return null;

        const original = data.products[index];
        const updated = { ...original };

        for (const [key, value] of Object.entries(updates)) {
          if (['sku', 'name', 'description', 'price', 'stock_quantity', 'min_stock_level', 'supplier_id'].includes(key)) {
            updated[key] = key === 'price' ? parseFloat(value) : (['stock_quantity', 'min_stock_level', 'supplier_id'].includes(key) && value !== null ? parseInt(value, 10) : value);
          }
        }

        if (updated.sku !== original.sku && data.products.some(p => p.sku.toLowerCase() === updated.sku.toLowerCase() && p.id !== pid && p.user_id === uId)) {
          throw new Error('A product with this SKU already exists.');
        }

        data.products[index] = updated;
        writeJSONData(data);
        return updated;
      }
    },

    async delete(id, userId) {
      const pid = parseInt(id, 10);
      const uId = userId ? parseInt(userId, 10) : null;
      if (useMySQL) {
        const [result] = await pool.query('DELETE FROM products WHERE id = ? AND user_id = ?', [pid, uId]);
        return result.affectedRows > 0;
      } else {
        const data = readJSONData();
        const initialLength = data.products.length;
        data.products = data.products.filter(p => !(p.id === pid && p.user_id === uId));
        // Cascading deletion of transactions linked to this product (JSON mode)
        data.transactions = data.transactions.filter(t => t.product_id !== pid);
        writeJSONData(data);
        return data.products.length < initialLength;
      }
    },

    async findLowStock(userId) {
      const uId = userId ? parseInt(userId, 10) : null;
      if (useMySQL) {
        const [rows] = await pool.query(`
          SELECT p.*, s.name as supplier_name 
          FROM products p 
          LEFT JOIN suppliers s ON p.supplier_id = s.id 
          WHERE p.stock_quantity <= p.min_stock_level AND p.user_id = ?
          ORDER BY p.stock_quantity ASC
        `, [uId]);
        return rows;
      } else {
        const data = readJSONData();
        return data.products
          .filter(p => p.stock_quantity <= p.min_stock_level && p.user_id === uId)
          .map(p => {
            const supplier = data.suppliers.find(s => s.id === p.supplier_id);
            return {
              ...p,
              supplier_name: supplier ? supplier.name : null
            };
          })
          .sort((a, b) => a.stock_quantity - b.stock_quantity);
      }
    }
  },

  transactions: {
    async create({ product_id, transaction_type, quantity, userId }) {
      const prodId = parseInt(product_id, 10);
      const qty = parseInt(quantity, 10);
      const uId = userId ? parseInt(userId, 10) : null;
      if (!['IN', 'OUT'].includes(transaction_type)) {
        throw new Error("Invalid transaction type. Must be 'IN' or 'OUT'.");
      }
      if (qty <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      if (useMySQL) {
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          // Check current product stock and owner
          const [prods] = await connection.query('SELECT stock_quantity, min_stock_level, name FROM products WHERE id = ? AND user_id = ? FOR UPDATE', [prodId, uId]);
          if (prods.length === 0) throw new Error("Product not found");

          const product = prods[0];
          let newStock = product.stock_quantity;

          if (transaction_type === 'IN') {
            newStock += qty;
          } else {
            if (product.stock_quantity < qty) {
              throw new Error(`Insufficient stock. Current: ${product.stock_quantity}, Requested: ${qty}`);
            }
            newStock -= qty;
          }

          // Update stock_quantity
          await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ? AND user_id = ?', [newStock, prodId, uId]);

          // Create transaction record
          const [result] = await connection.query(
            'INSERT INTO transactions (product_id, transaction_type, quantity) VALUES (?, ?, ?)',
            [prodId, transaction_type, qty]
          );

          await connection.commit();

          // Return result
          const [txRows] = await connection.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
          
          // Trigger email alert async if stock falls below minimum
          if (newStock <= product.min_stock_level && transaction_type === 'OUT') {
            triggerEmailAlert(product.name, newStock, product.min_stock_level).catch(console.error);
          }

          return { tx: txRows[0], newStock };
        } catch (err) {
          await connection.rollback();
          throw err;
        } finally {
          connection.release();
        }
      } else {
        const data = readJSONData();
        const productIndex = data.products.findIndex(p => p.id === prodId && p.user_id === uId);
        if (productIndex === -1) throw new Error("Product not found");

        const product = data.products[productIndex];
        let newStock = product.stock_quantity;

        if (transaction_type === 'IN') {
          newStock += qty;
        } else {
          if (product.stock_quantity < qty) {
            throw new Error(`Insufficient stock. Current: ${product.stock_quantity}, Requested: ${qty}`);
          }
          newStock -= qty;
        }

        // Create transaction record
        const newTx = {
          id: data.transactions.length ? Math.max(...data.transactions.map(t => t.id)) + 1 : 1,
          product_id: prodId,
          transaction_type,
          quantity: qty,
          date: new Date().toISOString()
        };

        // Update product stock
        product.stock_quantity = newStock;
        data.transactions.push(newTx);
        writeJSONData(data);

        // Trigger email alert async if stock falls below minimum
        if (newStock <= product.min_stock_level && transaction_type === 'OUT') {
          triggerEmailAlert(product.name, newStock, product.min_stock_level).catch(console.error);
        }

        return { tx: newTx, newStock };
      }
    },

    async findAll(userId) {
      const uId = userId ? parseInt(userId, 10) : null;
      if (useMySQL) {
        const [rows] = await pool.query(`
          SELECT t.*, p.name as product_name, p.sku as product_sku
          FROM transactions t
          JOIN products p ON t.product_id = p.id
          WHERE p.user_id = ?
          ORDER BY t.date DESC
        `, [uId]);
        return rows;
      } else {
        const data = readJSONData();
        return data.transactions
          .filter(t => {
            const product = data.products.find(p => p.id === t.product_id && p.user_id === uId);
            return !!product;
          })
          .map(t => {
            const product = data.products.find(p => p.id === t.product_id) || { name: 'Unknown Product', sku: 'N/A' };
            return {
              ...t,
              product_name: product.name,
              product_sku: product.sku
            };
          }).sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    }
  }
};

// Optional Nodemailer Low-Stock Alerting
async function triggerEmailAlert(productName, currentStock, minStock) {
  // If credentials are left at default, do not attempt to send
  if (process.env.EMAIL_USER === 'your-email@gmail.com' || !process.env.EMAIL_USER) {
    return;
  }

  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@inventorymanager.com',
    to: process.env.EMAIL_USER, // sends to the owner
    subject: `⚠️ Low Stock Alert: ${productName}`,
    html: `
      <h2>Stock Warning!</h2>
      <p>This is an automated low-stock alert from your <strong>Small Business Inventory Manager</strong>.</p>
      <p>The product <strong>${productName}</strong> has dropped below its threshold limit.</p>
      <ul>
        <li><strong>Current Stock:</strong> ${currentStock}</li>
        <li><strong>Minimum Stock Threshold:</strong> ${minStock}</li>
      </ul>
      <p>Please restock this product soon to avoid stockouts.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Alert System] Email alert sent successfully for ${productName}`);
  } catch (err) {
    console.error(`[Alert System] Failed to send email alert: ${err.message}`);
  }
}

module.exports = {
  initDB,
  db,
  isMySQL: () => useMySQL
};
