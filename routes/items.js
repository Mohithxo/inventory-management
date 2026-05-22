const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all item types
router.get('/item-types', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM item_types ORDER BY type_name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch item types', error: err.message });
  }
});

// GET all items with JOIN
router.get('/items', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.id,
        i.name,
        i.purchase_date,
        i.stock_available,
        i.item_type_id,
        it.type_name,
        i.created_at
      FROM items i
      JOIN item_types it ON i.item_type_id = it.id
      ORDER BY i.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch items', error: err.message });
  }
});

// POST - add multiple items in one purchase
router.post('/items', async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items provided' });
  }

  const errors = [];
  items.forEach((item, i) => {
    if (!item.name || item.name.trim() === '') {
      errors.push(`Item ${i + 1}: Name is required`);
    }
    if (!item.item_type_id || isNaN(parseInt(item.item_type_id))) {
      errors.push(`Item ${i + 1}: Item type is required`);
    }
    if (!item.purchase_date) {
      errors.push(`Item ${i + 1}: Purchase date is required`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  try {
    const placeholders = items.map(() => '(?, ?, ?, ?)').join(', ');
    const values = items.flatMap(item => [
      item.name.trim(),
      item.purchase_date,
      item.stock_available ? 1 : 0,
      parseInt(item.item_type_id)
    ]);

    await db.query(
      `INSERT INTO items (name, purchase_date, stock_available, item_type_id) VALUES ${placeholders}`,
      values
    );

    res.status(201).json({
      success: true,
      message: `${items.length} item${items.length > 1 ? 's' : ''} added successfully`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add items', error: err.message });
  }
});

// PUT - update an item
router.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, purchase_date, stock_available, item_type_id } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Item name is required' });
  }
  if (!item_type_id || isNaN(parseInt(item_type_id))) {
    return res.status(400).json({ success: false, message: 'Item type is required' });
  }
  if (!purchase_date) {
    return res.status(400).json({ success: false, message: 'Purchase date is required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE items SET name = ?, purchase_date = ?, stock_available = ?, item_type_id = ? WHERE id = ?',
      [name.trim(), purchase_date, stock_available ? 1 : 0, parseInt(item_type_id), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update item', error: err.message });
  }
});

// DELETE - remove an item
router.delete('/items/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete item', error: err.message });
  }
});

module.exports = router;
