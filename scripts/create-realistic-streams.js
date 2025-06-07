// scripts/create-realistic-streams.js
const mongoose = require('mongoose');
const Camera = require('../app/models/camera');
const Stream = require('../app/models/stream');
require('dotenv').config();

async function createRealisticStreams() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const existingCameras = await Camera.countDocuments();
        const existingStreams = await Stream.countDocuments();

        if (existingCameras === 0) {
            return;
        }

        const cameras = await Camera.find({}).sort({ name: 1 });
        let successCount = 0;

        for (const camera of cameras) {
            try {
                const existingStream = await Stream.findOne({ cameraId: camera._id });
                if (existingStream) {
                    continue;
                }

                const streamKey = `stream_${camera.name.toLowerCase()
                    .replace(/cam-\d+\s/, '')
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '')
                }`;

                const streamUrl = camera.streamUrl || `rtsp://${camera.ipAddress}:8554/live/${streamKey}`;

                const startTime = new Date(camera.installationDate);
                startTime.setHours(startTime.getHours() + Math.floor(Math.random() * 24));

                const streamData = {
                    cameraId: camera._id,
                    streamKey: streamKey,
                    streamUrl: streamUrl,
                    streamType: 'rtsp',
                    isActive: true,
                    startTime: startTime,
                    viewCount: Math.floor(Math.random() * 1000),
                    lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                };

                await Stream.create(streamData);
                successCount++;

            } catch (error) {
                // Silenzio sugli errori per singole camere
            }
        }

        const totalStreams = await Stream.countDocuments();
        console.log(`Stream creati con successo: ${successCount}. Totale stream nel database: ${totalStreams}`);
    } catch (error) {
        console.error('Errore durante la creazione:', error);
    } finally {
        await mongoose.connection.close();
    }
}

async function checkCameraStreamRelations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const cameras = await Camera.countDocuments();
        const streams = await Stream.countDocuments();

        if (cameras === 0 || streams === 0) {
            return;
        }

        const relations = await Camera.aggregate([
            {
                $lookup: {
                    from: "streams",
                    localField: "_id",
                    foreignField: "cameraId",
                    as: "streams"
                }
            },
            {
                $project: {
                    name: 1,
                    'location.address': 1,
                    streamCount: { $size: "$streams" },
                    streamKey: { $arrayElemAt: ["$streams.streamKey", 0] },
                    isActive: { $arrayElemAt: ["$streams.isActive", 0] }
                }
            }
        ]);
        // Nessun log, funzione silenziosa come richiesto
    } catch (error) {
        console.error('Errore:', error);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    const command = process.argv[2];
    switch (command) {
        case 'check':
            checkCameraStreamRelations();
            break;
        case 'create':
        default:
            createRealisticStreams();
            break;
    }
}

module.exports = { createRealisticStreams, checkCameraStreamRelations };
