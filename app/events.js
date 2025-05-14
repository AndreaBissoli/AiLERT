const express = require('express');
const router = express.Router();
const Event = require('./models/event');

// GET tutti gli eventi
router.get('/', async (req, res) => {
  try {
    const eventi = await Event.find();
    res.json(eventi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST nuovo evento
router.post('/', async (req, res) => {
  try {
    const nuovoEvento = new Event(req.body);
    await nuovoEvento.save();
    res.status(201).json(nuovoEvento);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
