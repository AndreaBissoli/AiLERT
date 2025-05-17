const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('./models/user');
const SALT_ROUNDS = require('./config').SALT_ROUNDS;


// GET all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', errorCode: 'INTERNAL_SERVER_ERROR' });
    }
});
// CREATE new user
router.post('/', async (req, res) => {
    try {
        const { email, password, role, name } = req.body;
        const newUser = new User({
            name,
            email,
            role,
            hash: await bcrypt.hash(password, SALT_ROUNDS) 
        });
        await newUser.save();
        res.status(201).json({ success:true, message: 'User created successfully', user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// UPDATE user
router.put('/:id', async (req, res) => {
    try {
        // Prevent admin from modifying their own account
        const loggedUserId = req.loggedUser.id;
        if (loggedUserId.toString() === req.params.id) {
            return res.status(403).json({ error: 'Cannot modify your own account', errorCode: 'SELF_MODIFICATION_FORBIDDEN' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found', errorCode: 'USER_NOT_FOUND' });
        }
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: 'Internal server error', errorCode: 'INTERNAL_SERVER_ERROR' });
    }
});
// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        // Prevent admin from deleting their own account
        const loggedUserId = req.loggedUser.id;
        if (loggedUserId.toString() === req.params.id) {
            return res.status(403).json({ error: 'Cannot delete your own account', errorCode: 'SELF_DELETION_FORBIDDEN' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found', errorCode: 'USER_NOT_FOUND' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', errorCode: 'INTERNAL_SERVER_ERROR' });
    }
});

// GET user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found', errorCode: 'USER_NOT_FOUND' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', errorCode: 'INTERNAL_SERVER_ERROR' });
    }
});

module.exports = router;