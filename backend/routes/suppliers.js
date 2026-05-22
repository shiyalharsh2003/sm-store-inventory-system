const express = require('express');
const router = express.Router();
const { db } = require('../db');
const auth = require('../middleware/auth');

// GET /api/suppliers - Fetch all suppliers (Auth required)
router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await db.suppliers.findAll();
    res.json(suppliers);
  } catch (error) {
    console.error('Fetch Suppliers Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching suppliers.' });
  }
});

// POST /api/suppliers - Add a new supplier (Auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { name, contact_email, phone } = req.body;

    if (!name || !contact_email || !phone) {
      return res.status(400).json({ error: 'Please provide supplier name, email, and phone number.' });
    }

    const newSupplier = await db.suppliers.create({ name, contact_email, phone });
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Create Supplier Error:', error);
    res.status(500).json({ error: 'Internal server error while adding supplier.' });
  }
});

module.exports = router;
