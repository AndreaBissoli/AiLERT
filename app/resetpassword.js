const express = require("express");
const router = express.Router();
const User = require("./models/user");

router.post("", async function (req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            error: "Email is required",
            errorCode: "MISSING_EMAIL",
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: "Invalid email format",
            errorCode: "INVALID_EMAIL_FORMAT",
        });
    }

    try {
        const user = await User.findOne({ email: email });

        if (user) {
            // User trovato - log dettagli della richiesta di reset
            console.log("Password reset requested for user:", {
                userId: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                requestTime: new Date().toISOString(),
                requestIP: req.ip || req.socket.remoteAddress,
            });

            // TODO: In una implementazione reale qui si dovrebbe:
            // 1. Generare un token di reset della password
            // 2. Archiviarlo nel database con un timestamp di scadenza
            // 3. Inviare un'email all'utente con le istruzioni per il reset della password
        } else {
            // User non trovato - log dettagli della richiesta
            console.log("Password reset requested for non-existent email:", {
                email: email,
                requestTime: new Date().toISOString(),
                requestIP: req.ip || req.socket.remoteAddress,
                result: "EMAIL_NOT_FOUND",
            });
        }

        // Ritornare sempre una risposta positiva per evitare di rivelare se l'email esiste o meno nel sistema
        res.json({
            success: true,
            message:
                "If the email exists in our system, you will receive password reset instructions",
        });
    } catch (error) {
        console.error("Error processing password reset request:", error);
        res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

module.exports = router;
