const express = require("express");
const router = express.Router();
const Event = require("./models/event");

// GET tutti gli eventi
router.get("/", async (req, res) => {
    try {
        const eventi = await Event.find().sort({ eventDate: -1 });
        res.json(eventi);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST nuovo evento
router.post("/", async (req, res) => {
    try {
        const nuovoEvento = new Event(req.body);
        await nuovoEvento.save();
        res.status(201).json(nuovoEvento);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET evento per ID
router.get("/:id", async (req, res) => {
    try {
        const evento = await Event.findById(req.params.id);
        if (!evento) {
            return res.status(404).json({ error: "Event not found", errorCode: "EVENT_NOT_FOUND" });
        }
        res.json(evento);
    } catch (err) {
        res.status(500).json({ error: "Internal server errror", errorCode: "INTERNAL_SERVER_ERROR" });
    }
});

// PUT aggiorna evento per ID
router.put("/:id", async (req, res) => {
    try {
        const eventoAggiornato = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!eventoAggiornato) {
            return res.status(404).json({ error: "Event not found", errorCode: "EVENT_NOT_FOUND" });
        }
        res.json(eventoAggiornato);
    } catch (err) {
        res.status(500).json({ error: "Internal server error", errorCode: "INTERNAL_SERVER_ERROR" });
    }
});

// DELETE evento per ID
router.delete("/:id", async (req, res) => {
    try {
        const eventoEliminato = await Event.findByIdAndDelete(req.params.id);
        if (!eventoEliminato) {
            return res.status(404).json({ error: "Event not found", errorCode: "EVENT_NOT_FOUND" });
        }
        res.json({ success: true, message: "Event deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Internal server error", errorCode: "INTERNAL_SERVER_ERROR" });
    }
});

module.exports = router;
