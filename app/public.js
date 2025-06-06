const express = require("express");
const router = express.Router();
const Event = require("./models/event");

// GET eventi pubblici (ultime 2 ore, solo solved/unsolved)
router.get("/events", async (req, res) => {
    try {
        // Usa il metodo statico per query pubbliche
        const eventi = await Event.findPublic().limit(50);
        res.json(eventi);
    } catch (err) {
        console.error("Errore API pubblica:", err);
        res.status(500).json({
            error: err.message,
            errorCode: "PUBLIC_EVENTS_FETCH_ERROR",
        });
    }
});

module.exports = router;
