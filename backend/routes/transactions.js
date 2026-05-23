const express = require('express');
const router = express.Router();
const { db } = require('../db');
const auth = require('../middleware/auth');

// GET /api/transactions - Fetch all transactions (Auth required)
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await db.transactions.findAll(req.user.id);
    res.json(transactions);
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching transactions.' });
  }
});

// POST /api/transactions - Record a new stock transaction ('IN' or 'OUT') (Auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, transaction_type, quantity } = req.body;

    if (!product_id || !transaction_type || quantity === undefined) {
      return res.status(400).json({ error: 'Please provide product_id, transaction_type, and quantity.' });
    }

    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      return res.status(400).json({ error: 'Transaction quantity must be greater than zero.' });
    }

    if (!['IN', 'OUT'].includes(transaction_type)) {
      return res.status(400).json({ error: "Transaction type must be 'IN' or 'OUT'." });
    }

    // Call unified database transaction method
    const result = await db.transactions.create({
      product_id: parseInt(product_id, 10),
      transaction_type,
      quantity: qty,
      userId: req.user.id
    });

    res.status(201).json({
      message: `Stock successfully adjusted ${transaction_type === 'IN' ? 'upward' : 'downward'} by ${qty} units.`,
      transaction: result.tx,
      newStock: result.newStock
    });
  } catch (error) {
    console.error('Create Transaction Error:', error.message);
    if (error.message.includes('Insufficient stock') || error.message.includes('Product not found')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error while creating transaction record.' });
  }
});

module.exports = router;
