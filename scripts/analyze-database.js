const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Camera = require('../app/models/camera');
const Stream = require('../app/models/stream');
const Event = require('../app/models/event');

// ID del DetectionService da verificare
const DETECTION_SERVICE_IDS = [
    '68266cd1683978f9108a7393', '68266da2683978f9108a7395',
    '68266da2683978f9108a7396', '68266da2683978f9108a7397',
    '682880cf683978f9108a739b', '682880cf683978f9108a739c',
    '682880cf683978f9108a739d', '682880cf683978f9108a739e',
    '682880cf683978f9108a739f', '682880cf683978f9108a73a0',
    '682880cf683978f9108a73a1', '682880cf683978f9108a73a2',
    '682880cf683978f9108a73a3', '682880cf683978f9108a73a4',
    '60c72b2f9b1e8c001c8e4d5a', '60c72b2f9b1e8c001c8e4d5a',
    '60c72b2f9b1e8c001c8e4d5a'
];

async function analyzeDatabase() {
    const analysis = {
        timestamp: new Date().toISOString(),
        mongodb_uri: process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Hide credentials
        summary: {},
        cameras: {},
        streams: {},
        events: {},
        relationships: {},
        detectionService: {},
        recommendations: []
    };

    try {
        console.log('Connessione a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connesso al database');

        console.log('Analisi conteggi generali...');
        analysis.summary = {
            cameras: await Camera.countDocuments(),
            streams: await Stream.countDocuments(),
            events: await Event.countDocuments(),
            activeStreams: await Stream.countDocuments({ isActive: true }),
            incidentEvents: await Event.countDocuments({ type: 'incidente' }),
            trafficEvents: await Event.countDocuments({ type: 'ingorgo' })
        };

        // ==================== CAMERAS ====================
        console.log('Analisi telecamere...');
        
        // Campioni telecamere
        const cameraSamples = await Camera.find({}).limit(5).lean();
        analysis.cameras.samples = cameraSamples;
        analysis.cameras.count = cameraSamples.length;
        
        // Telecamere con/senza coordinates
        const camerasWithCoords = await Camera.countDocuments({
            'location.coordinates.lat': { $exists: true, $ne: null },
            'location.coordinates.lng': { $exists: true, $ne: null }
        });
        analysis.cameras.withCoordinates = camerasWithCoords;
        analysis.cameras.withoutCoordinates = analysis.summary.cameras - camerasWithCoords;

        // Indirizzi più comuni
        const commonAddresses = await Camera.aggregate([
            { $group: { _id: '$location.address', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        analysis.cameras.commonAddresses = commonAddresses;

        // ==================== STREAMS ====================
        console.log('Analisi stream...');
        
        // Campioni stream
        const streamSamples = await Stream.find({}).limit(5).lean();
        analysis.streams.samples = streamSamples;
        analysis.streams.count = streamSamples.length;

        // Stream per tipo
        const streamTypes = await Stream.aggregate([
            { $group: { _id: '$streamType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        analysis.streams.byType = streamTypes;

        // Stream attivi vs inattivi
        analysis.streams.active = await Stream.countDocuments({ isActive: true });
        analysis.streams.inactive = await Stream.countDocuments({ isActive: false });

        // ==================== EVENTS ====================
        console.log('Analisi eventi...');
        
        // Campioni eventi
        const eventSamples = await Event.find({}).limit(5).lean();
        analysis.events.samples = eventSamples;
        analysis.events.count = eventSamples.length;

        // Eventi per tipo e status
        const eventsByType = await Event.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        analysis.events.byType = eventsByType;

        const eventsByStatus = await Event.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        analysis.events.byStatus = eventsByStatus;

        // Eventi con/senza cameraId
        const eventsWithCamera = await Event.countDocuments({ 
            cameraId: { $exists: true, $ne: null } 
        });
        analysis.events.withCameraId = eventsWithCamera;
        analysis.events.withoutCameraId = analysis.summary.events - eventsWithCamera;

        // Eventi con/senza coordinates
        const eventsWithCoords = await Event.countDocuments({
            'location.coordinates.lat': { $exists: true, $ne: null },
            'location.coordinates.lng': { $exists: true, $ne: null }
        });
        analysis.events.withCoordinates = eventsWithCoords;
        analysis.events.withoutCoordinates = analysis.summary.events - eventsWithCoords;

        // Eventi pubblici (ultime 2 ore)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const publicEvents = await Event.countDocuments({
            eventDate: { $gte: twoHoursAgo },
            status: { $in: ["solved", "unsolved"] }
        });
        analysis.events.publicEventsLast2Hours = publicEvents;

        // ==================== RELATIONSHIPS ====================
        console.log('Analisi relazioni...');

        // Camera-Stream relationship
        const cameraStreamRelation = await Camera.aggregate([
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
                    hasStream: { $gt: [{ $size: "$streams" }, 0] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCameras: { $sum: 1 },
                    camerasWithStream: { $sum: { $cond: ["$hasStream", 1, 0] } },
                    camerasWithMultipleStreams: { 
                        $sum: { $cond: [{ $gt: ["$streamCount", 1] }, 1, 0] } 
                    }
                }
            }
        ]);
        analysis.relationships.cameraStream = cameraStreamRelation[0] || {};

        // Event-Camera relationship  
        const eventCameraRelation = await Event.aggregate([
            { $match: { type: 'incidente' } },
            {
                $lookup: {
                    from: "cameras",
                    localField: "cameraId",
                    foreignField: "_id",
                    as: "camera"
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncidents: { $sum: 1 },
                    incidentsWithValidCamera: { 
                        $sum: { $cond: [{ $gt: [{ $size: "$camera" }, 0] }, 1, 0] } 
                    }
                }
            }
        ]);
        analysis.relationships.eventCamera = eventCameraRelation[0] || {};

        // Stream orfani (senza telecamera)
        const orphanStreams = await Stream.aggregate([
            {
                $lookup: {
                    from: "cameras",
                    localField: "cameraId",
                    foreignField: "_id",
                    as: "camera"
                }
            },
            { $match: { "camera": { $size: 0 } } },
            { $count: "orphanStreams" }
        ]);
        analysis.relationships.orphanStreams = orphanStreams[0]?.orphanStreams || 0;

        // ==================== DETECTION SERVICE ====================
        console.log('Analisi DetectionService...');

        // Converte string ID in ObjectId per query
        const detectionObjectIds = DETECTION_SERVICE_IDS.map(id => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch (e) {
                return null;
            }
        }).filter(id => id !== null);

        // Telecamere usate dal DetectionService
        const detectionCameras = await Camera.find({
            _id: { $in: detectionObjectIds }
        }).lean();
        
        analysis.detectionService.configuredIds = DETECTION_SERVICE_IDS.length;
        analysis.detectionService.validIds = detectionObjectIds.length;
        analysis.detectionService.existingCameras = detectionCameras.length;
        analysis.detectionService.cameraSamples = detectionCameras.slice(0, 3);

        // Stream associati alle telecamere DetectionService
        const detectionStreams = await Stream.find({
            cameraId: { $in: detectionObjectIds }
        }).lean();
        
        analysis.detectionService.existingStreams = detectionStreams.length;
        analysis.detectionService.streamSamples = detectionStreams.slice(0, 3);

        // ==================== RECOMMENDATIONS ====================
        console.log('Generazione raccomandazioni...');

        // Genera raccomandazioni basate sull'analisi
        if (analysis.summary.cameras === 0) {
            analysis.recommendations.push({
                priority: 'HIGH',
                category: 'Setup',
                message: 'Database vuoto - eseguire script populate-cameras-trento.js'
            });
        }

        if (analysis.cameras.withoutCoordinates > 0) {
            analysis.recommendations.push({
                priority: 'HIGH', 
                category: 'Data',
                message: `${analysis.cameras.withoutCoordinates} telecamere senza coordinates - aggiornare schema Camera`
            });
        }

        if (analysis.events.withoutCoordinates > 0) {
            analysis.recommendations.push({
                priority: 'MEDIUM',
                category: 'Data', 
                message: `${analysis.events.withoutCoordinates} eventi senza coordinates - eseguire middleware o script migrazione`
            });
        }

        if (analysis.relationships.cameraStream.camerasWithStream < analysis.summary.cameras) {
            const missing = analysis.summary.cameras - (analysis.relationships.cameraStream.camerasWithStream || 0);
            analysis.recommendations.push({
                priority: 'MEDIUM',
                category: 'Relationships',
                message: `${missing} telecamere senza stream - creare stream mancanti`
            });
        }

        if (analysis.detectionService.existingCameras < analysis.detectionService.configuredIds) {
            const missing = analysis.detectionService.configuredIds - analysis.detectionService.existingCameras;
            analysis.recommendations.push({
                priority: 'HIGH',
                category: 'DetectionService', 
                message: `${missing} ID DetectionService non corrispondono a telecamere esistenti`
            });
        }

        if (analysis.relationships.orphanStreams > 0) {
            analysis.recommendations.push({
                priority: 'LOW',
                category: 'Cleanup',
                message: `${analysis.relationships.orphanStreams} stream orfani da pulire`
            });
        }

        console.log('Analisi completata');

    } catch (error) {
        console.error('Errore durante l\'analisi:', error);
        analysis.error = {
            message: error.message,
            stack: error.stack
        };
    } finally {
        await mongoose.connection.close();
        console.log('Connessione chiusa');
    }

    return analysis;
}

async function saveAnalysis() {
    try {
        const analysis = await analyzeDatabase();
        
        // Salva file JSON completo
        const jsonPath = path.join(__dirname, '..', 'database-analysis.json');
        fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
        
        // Crea anche un riassunto leggibile
        const summary = `
ANALISI DATABASE AiLERT
==========================
Data: ${analysis.timestamp}

RIASSUNTO:
- Telecamere: ${analysis.summary.cameras}
- Stream: ${analysis.summary.streams} (${analysis.streams?.active || 0} attivi)
- Eventi: ${analysis.summary.events} (${analysis.summary.incidentEvents} incidenti, ${analysis.summary.trafficEvents} ingorghi)

TELECAMERE:
- Con coordinates: ${analysis.cameras.withCoordinates}/${analysis.summary.cameras}
- Senza coordinates: ${analysis.cameras.withoutCoordinates}

STREAM:
- Con telecamera: ${(analysis.relationships.cameraStream?.camerasWithStream || 0)}/${analysis.summary.cameras}
- Orfani: ${analysis.relationships.orphanStreams}

EVENTI:
- Con cameraId: ${analysis.events.withCameraId}/${analysis.summary.events}
- Con coordinates: ${analysis.events.withCoordinates}/${analysis.summary.events}
- Pubblici (2h): ${analysis.events.publicEventsLast2Hours}

DETECTION SERVICE:
- ID configurati: ${analysis.detectionService.configuredIds}
- Telecamere esistenti: ${analysis.detectionService.existingCameras}
- Stream disponibili: ${analysis.detectionService.existingStreams}

RACCOMANDAZIONI:
${analysis.recommendations.map(r => `- [${r.priority}] ${r.message}`).join('\n')}

Dettagli completi in: database-analysis.json
`;

        const summaryPath = path.join(__dirname, '..', 'database-analysis-summary.txt');
        fs.writeFileSync(summaryPath, summary);

        console.log('Analisi salvata:');
        console.log(`   Completa: ${jsonPath}`);
        console.log(`   Riassunto: ${summaryPath}`);
        console.log('\n' + summary);

    } catch (error) {
        console.error('Errore nel salvataggio:', error);
    }
}

// Esegui se script chiamato direttamente
if (require.main === module) {
    saveAnalysis();
}

module.exports = { analyzeDatabase, saveAnalysis };