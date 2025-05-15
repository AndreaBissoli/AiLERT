const express = require('express');
const router = express.Router();
const Stream = require('./models/stream'); // Assicurati che il percorso sia corretto

// Ottieni tutti gli stream attivi
router.get('/list', async (req, res) => {
    try {
        const streams = await Stream.find({isActive: true});

        console.log("Stream trovati:", streams);

        const formattedStreams = streams.map(stream => ({
            _id: stream._id,
            cameraId: stream.cameraId,
            streamKey: stream.streamKey,
            streamUrl: stream.streamUrl,
            startTime: stream.startTime,
            viewCount: stream.viewCount
        }));
      
      return res.status(200).json({
        success: true,
        streams: formattedStreams
      });

    } catch (error) {
        console.error('Errore nel recupero degli stream:', error);
        return res.status(500).json({
          error: 'Errore interno del server',
          errorCode: 'SERVER_ERROR'
        });

    }
});

// Ottieni dettagli di uno stream specifico per ID
router.get('/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params;

        // Cerca lo stream per ID
        const stream = await Stream.findById(streamId);

        if (!stream) {
            return res.status(404).json({
                error: 'Stream not found',
                errorCode: 'STREAM_NOT_FOUND'
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
                viewCount: stream.viewCount
            }
        });
    } catch (error) {
        console.error('Errore nel recupero dello stream:', error);

        // Verifica se l'errore è dovuto a un ID non valido
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({
                error: 'ID dello stream non valido',
                errorCode: 'INVALID_ID'
            });
        }

        return res.status(500).json({
            error: 'Errore interno del server',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Crea un nuovo stream
router.post('/', async (req, res) => {
    try {
        const { cameraId, streamKey, streamUrl, streamType } = req.body;

        // Validazione dei campi obbligatori
        if (!cameraId || !streamUrl || !streamType) {
            return res.status(400).json({
                error: 'Campi obbligatori mancanti',
                errorCode: 'MISSING_FIELDS'
            });
        }

        // Crea un nuovo stream
        const newStream = new Stream({
            cameraId,
            streamKey,
            streamUrl,
            streamType,
            isActive: true,
            startTime: new Date(),
            viewCount: 0
        });

        // Salva lo stream nel database
        await newStream.save();

        return res.status(201).json({
            success: true,
            stream: newStream
        });
    } catch (error) {
        console.error('Errore nella creazione dello stream:', error);
        return res.status(500).json({
            error: 'Errore interno del server',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Aggiorna un stream esistente
router.put('/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params;
        const updateData = req.body;

        // Cerca e aggiorna lo stream
        const updatedStream = await Stream.findByIdAndUpdate(
            streamId,
            { $set: updateData },
            { new: true } // Restituisce il documento aggiornato
        );

        if (!updatedStream) {
            return res.status(404).json({
                error: 'Stream not found',
                errorCode: 'STREAM_NOT_FOUND'
            });
        }

        return res.status(200).json({
            success: true,
            stream: updatedStream
        });
    } catch (error) {
        console.error('Errore nell\'aggiornamento dello stream:', error);
        return res.status(500).json({
            error: 'Errore interno del server',
            errorCode: 'SERVER_ERROR'
        });
    }
});

// Termina uno stream (imposta isActive = false e aggiunge endTime)
router.put('/:streamId/end', async (req, res) => {
    try {
        const { streamId } = req.params;

        // Cerca e aggiorna lo stream per terminarlo
        const endedStream = await Stream.findByIdAndUpdate(
            streamId,
            {
                $set: {
                    isActive: false,
                    endTime: new Date()
                }
            },
            { new: true }
        );

        if (!endedStream) {
            return res.status(404).json({
                error: 'Stream not found',
                errorCode: 'STREAM_NOT_FOUND'
            });
        }

        return res.status(200).json({
            success: true,
            stream: endedStream
        });
    } catch (error) {
        console.error('Errore nella terminazione dello stream:', error);
        return res.status(500).json({
            error: 'Errore interno del server',
            errorCode: 'SERVER_ERROR'
        });
    }
});

module.exports = router;