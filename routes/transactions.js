const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Add Transaction
router.post('/', authMiddleware, (req, res) => {
    const { type, category, amount, date, description } = req.body;
    const userId = req.user.id;

    if (!type || !category || !amount) {
        return res.status(400).json({ message: 'Type, category, and amount are required' });
    }

    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'Invalid transaction type' });
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const sql = 'INSERT INTO transactions (user_id, type, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [userId, type, category, parseFloat(amount), date || new Date(), description || ''], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to add transaction' });
        res.json({ message: 'Transaction added', id: result.insertId });
    });
});

// Get All User Transactions
router.get('/', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const sql = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC';
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch transactions' });
        res.json(results);
    });
});

// Delete Transaction
router.delete('/:id', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const txId = req.params.id;

    const sql = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
    db.query(sql, [txId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to delete transaction' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Transaction not found' });
        res.json({ message: 'Transaction deleted' });
    });
});

module.exports = router;

// Edit Transaction
router.put('/:id', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const txId = req.params.id;
    const { category, amount, date, description } = req.body;
    if (!category || !amount) return res.status(400).json({ message: 'Category and amount required' });
    const sql = 'UPDATE transactions SET category=?, amount=?, date=?, description=? WHERE id=? AND user_id=?';
    db.query(sql, [category, parseFloat(amount), date || new Date(), description || '', txId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to update' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Updated' });
    });
});
