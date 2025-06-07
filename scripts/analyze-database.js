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
    '68443c5d2d56f26e2678b173', // CAM-001 Piazza Duomo - Piazza Duomo
    '68443c5d2d56f26e2678b175', // CAM-002 Via San Marco - Via San Marco
    '68443c5e2d56f26e2678b178', // CAM-003 Via Roma Centro - Via Roma
    '68443c5e2d56f26e2678b17a', // CAM-004 Corso 3 Novembre - Corso 3 Novembre
    '68443c5e2d56f26e2678b17c', // CAM-005 Via Belenzani - Via Belenzani
    '68443c5e2d56f26e2678b17e', // CAM-006 Ponte San Lorenzo - Ponte San Lorenzo
    '68443c5e2d56f26e2678b180', // CAM-007 Via Verdi - Via Verdi
    '68443c5e2d56f26e2678b182', // CAM-008 Via Calepina Università - Via Calepina
    '68443c5e2d56f26e2678b184', // CAM-009 Via Oss Mazzurana - Via Oss Mazzurana
    '68443c5e2d56f26e2678b186', // CAM-010 Piazza Fiera - Piazza Fiera
    '68443c5e2d56f26e2678b188', // CAM-011 Via Brennero Nord - Via Brennero
    '68443c5e2d56f26e2678b18a', // CAM-012 Via Milano Sud - Via Milano
    '68443c5e2d56f26e2678b18c', // CAM-013 Via Venezia Industriale - Via Venezia
    '68443c5e2d56f26e2678b18e', // CAM-014 Rotatoria Spini Gardolo - Rotatoria Spini di Gardolo
    '68443c5e2d56f26e2678b190', // CAM-015 Via del Ponte - Via del Ponte
    '68443c5e2d56f26e2678b192' // CAM-016 Via Segantini Ospedale - Via Segantini
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