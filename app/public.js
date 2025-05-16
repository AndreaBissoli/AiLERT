const express = require('express');
const router = express.Router();
const Event = require('./models/event');

// GET eventi pubblici (ultimi 2 ore, solo solved/unsolved)
// Endpoint: /api/v1/public/events
router.get('/events', async (req, res) => {
  // console.log('=== API Pubblica: /api/v1/public/events chiamata ===');
  try {
    // Usa il metodo statico per query pubbliche
    const eventi = await Event.findPublic().limit(50);
    
    // console.log(`Eventi pubblici trovati: ${eventi.length}`);
    res.json(eventi);
  } catch (err) {
    console.error('Errore API pubblica:', err);
    res.status(500).json({ 
      error: err.message,
      errorCode: 'PUBLIC_EVENTS_FETCH_ERROR'
    });
  }
});

module.exports = router;