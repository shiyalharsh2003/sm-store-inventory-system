const express = require('express');
const router = express.Router();
const { db } = require('../db');
const auth = require('../middleware/auth');

// GET /api/products/low-stock - Fetch items where stock_quantity <= min_stock_level
// Put this ABOVE GET /:id so it doesn't get treated as an ID parameter
router.get('/low-stock', auth, async (req, res) => {
  try {
    const lowStockProducts = await db.products.findLowStock(req.user.id);
    res.json(lowStockProducts);
  } catch (error) {
    console.error('Fetch Low Stock Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching low-stock products.' });
  }
});

// GET /api/products - Fetch all products (Auth required)
router.get('/', auth, async (req, res) => {
  try {
    const products = await db.products.findAll(req.user.id);
    res.json(products);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching products.' });
  }
});

// POST /api/products - Add a new product (Auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { sku, name, description, price, stock_quantity, min_stock_level, supplier_id } = req.body;

    if (!sku || !name || price === undefined || stock_quantity === undefined) {
      return res.status(400).json({ error: 'SKU, name, price, and stock quantity are required.' });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price cannot be negative.' });
    }

    if (parseInt(stock_quantity, 10) < 0) {
      return res.status(400).json({ error: 'Stock quantity cannot be negative.' });
    }

    if (parseInt(min_stock_level, 10) < 0) {
      return res.status(400).json({ error: 'Minimum stock level threshold cannot be negative.' });
    }

    const newProduct = await db.products.create({
      sku,
      name,
      description: description || '',
      price: parseFloat(price),
      stock_quantity: parseInt(stock_quantity, 10),
      min_stock_level: min_stock_level !== undefined ? parseInt(min_stock_level, 10) : 5,
      supplier_id: supplier_id ? parseInt(supplier_id, 10) : null,
      userId: req.user.id
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create Product Error:', error.message);
    if (error.message.includes('already exists') || error.message.includes('Duplicate entry')) {
      return res.status(400).json({ error: 'A product with this SKU already exists.' });
    }
    res.status(500).json({ error: 'Internal server error while adding product.' });
  }
});

// PUT /api/products/:id - Update existing product details (Auth required)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, description, price, stock_quantity, min_stock_level, supplier_id } = req.body;

    // Validate inputs if provided
    if (price !== undefined && parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price cannot be negative.' });
    }

    if (stock_quantity !== undefined && parseInt(stock_quantity, 10) < 0) {
      return res.status(400).json({ error: 'Stock quantity cannot be negative.' });
    }

    if (min_stock_level !== undefined && parseInt(min_stock_level, 10) < 0) {
      return res.status(400).json({ error: 'Minimum stock level threshold cannot be negative.' });
    }

    const updates = {};
    if (sku !== undefined) updates.sku = sku;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (stock_quantity !== undefined) updates.stock_quantity = parseInt(stock_quantity, 10);
    if (min_stock_level !== undefined) updates.min_stock_level = parseInt(min_stock_level, 10);
    if (supplier_id !== undefined) updates.supplier_id = supplier_id ? parseInt(supplier_id, 10) : null;

    const updatedProduct = await db.products.update(id, updates, req.user.id);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update Product Error:', error.message);
    if (error.message.includes('already exists') || error.message.includes('Duplicate entry')) {
      return res.status(400).json({ error: 'A product with this SKU already exists.' });
    }
    res.status(500).json({ error: 'Internal server error while updating product.' });
  }
});

// DELETE /api/products/:id - Delete product (Auth required)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.products.delete(id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Internal server error while deleting product.' });
  }
});

module.exports = router;
