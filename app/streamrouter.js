const express = require("express");
const router = express.Router();
const Stream = require("./models/stream");

// Ottieni tutti gli stream attivi
router.get("/", async (req, res) => {
    try {
        const streams = await Stream.find({ isActive: true });

        const formattedStreams = streams.map(stream => ({
            _id: stream._id,
            cameraId: stream.cameraId,
            streamKey: stream.streamKey,
            streamUrl: stream.streamUrl,
            startTime: stream.startTime,
            viewCount: stream.viewCount,
        }));

        return res.status(200).json({
            success: true,
            streams: formattedStreams,
        });
    } catch (error) {
        console.error("Errore nel recupero degli stream:", error);
        return res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

// Ottieni dettagli di uno stream specifico per ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Cerca lo stream per ID
        const stream = await Stream.findById(id);

        if (!stream) {
            return res.status(404).json({
                error: "Stream not found",
                errorCode: "STREAM_NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            stream: {
                _id: stream._id,
                cameraId: stream.cameraId,
                streamKey: stream.streamKey,
                streamUrl: stream.streamUrl,
                isActive: stream.isActive,
                startTime: stream.startTime,
                endTime: stream.endTime,
                streamType: stream.streamType,
                viewCount: stream.viewCount,
            },
        });
    } catch (error) {
        console.error("Errore nel recupero dello stream:", error);

        // Verifica se l'errore è dovuto a un ID non valido
        if (error.name === "CastError" && error.kind === "ObjectId") {
            return res.status(400).json({
                error: "Specified ID is not valid format",
                errorCode: "INVALID_ID",
            });
        }

        return res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

// Crea un nuovo stream
router.post("/", async (req, res) => {
    try {
        const { cameraId, streamKey, streamUrl, streamType } = req.body;

        // Validazione dei campi obbligatori
        if (!cameraId || !streamUrl || !streamType) {
            return res.status(400).json({
                error: "Missing required fields",
                errorCode: "MISSING_FIELDS",
            });
        }

        // Crea un nuovo stream
        const newStream = new Stream({
            cameraId,
            streamKey,
            streamUrl,
            streamType,
            isActive: false,
            startTime: new Date(),
            viewCount: 0,
        });

        // Salva lo stream nel database
        await newStream.save();

        return res.status(201).json({
            success: true,
            stream: newStream,
        });
    } catch (error) {
        console.error("Errore nella creazione dello stream:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                error: "Dati di input non validi",
                errorCode: "INVALID_DATA",
                details: error.message,
            });
        }

        return res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

// Aggiorna un stream esistente
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: "Input update data not valid",
                errorCode: "INVALID_UPDATE_DATA",
            });
        }

        // Cerca e aggiorna lo stream
        const updatedStream = await Stream.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedStream) {
            return res.status(404).json({
                error: "Stream not found",
                errorCode: "STREAM_NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            stream: updatedStream,
        });
    } catch (error) {
        console.error("Errore nell'aggiornamento dello stream:", error);

        // Verifica se l'errore è dovuto a un ID non valido
        if (error.name === "CastError" && error.kind === "ObjectId") {
            return res.status(400).json({
                error: "Specified ID is not valid format",
                errorCode: "INVALID_ID",
            });
        }

        // Verifica se l'errore è legato alla validazione dello schema
        if (error.name === "ValidationError") {
            return res.status(400).json({
                error: "Dati di aggiornamento non validi",
                errorCode: "INVALID_UPDATE_DATA",
                details: error.message,
            });
        }

        return res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

// Termina uno stream (imposta isActive = false e aggiunge endTime)
router.patch("/:id/end", async (req, res) => {
    try {
        const { id } = req.params;

        // Cerca e aggiorna lo stream per terminarlo
        const endedStream = await Stream.findByIdAndUpdate(
            id,
            {
                $set: {
                    isActive: false,
                    endTime: new Date(),
                },
            },
            { new: true }
        );

        if (!endedStream) {
            return res.status(404).json({
                error: "Stream not found",
                errorCode: "STREAM_NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            stream: endedStream,
        });
    } catch (error) {
        console.error("Errore nella terminazione dello stream:", error);

        // Verifica se l'errore è dovuto a un ID non valido
        if (error.name === "CastError" && error.kind === "ObjectId") {
            return res.status(400).json({
                error: "Specified ID is not valid format",
                errorCode: "INVALID_ID",
            });
        }

        return res.status(500).json({
            error: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
});

module.exports = router;
