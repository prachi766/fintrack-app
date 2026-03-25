const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name.trim(), email.trim().toLowerCase(), hashedPassword],
            (err) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ message: 'Email already registered. Please login.' });
                    }
                    console.error('Register error:', err);
                    return res.status(500).json({ message: 'Registration failed. Try again.' });
                }
                res.json({ message: 'Account created successfully! Please login.' });
            }
        );
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()], async (err, results) => {
        if (err) { console.error('Login error:', err); return res.status(500).json({ message: 'Server error' }); }

        if (results.length === 0) {
            return res.status(401).json({ message: 'No account found with this email' });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    });
});

module.exports = router;
