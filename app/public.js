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
        res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

module.exports = router;
