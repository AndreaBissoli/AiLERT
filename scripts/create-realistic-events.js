// scripts/create-realistic-events.js
const mongoose = require('mongoose');
const Camera = require('../app/models/camera');
const Event = require('../app/models/event');
require('dotenv').config();

const EVENT_TEMPLATES = {
    incidenti: [
        { title: "Incidente stradale", description: "Tamponamento tra due veicoli", severity: "media" },
        { title: "Incidente con feriti", description: "Scontro con intervento ambulanza", severity: "alta" },
        { title: "Incidente lieve", description: "Collisione senza feriti", severity: "bassa" },
        { title: "Incidente moto-auto", description: "Urto tra motociclo e automobile", severity: "media" },
        { title: "Incidente multiplo", description: "Coinvolti 3 veicoli", severity: "alta" },
        { title: "Fuoriuscita autonoma", description: "Veicolo finito fuori carreggiata", severity: "bassa" },
        { title: "Incidente con mezzi pesanti", description: "Camion coinvolto", severity: "alta" },
        { title: "Scontro frontale", description: "Impatto frontale tra due auto", severity: "alta" },
        { title: "Tamponamento a catena", description: "Coinvolti 4 veicoli", severity: "media" },
        { title: "Incidente bici-auto", description: "Ciclista coinvolto", severity: "media" }
    ],
    ingorghi: [
        { title: "Ingorgo traffico intenso", description: "Code dovute all'ora di punta", severity: "media" },
        { title: "Rallentamenti lavori", description: "Cantiere stradale causa rallentamenti", severity: "bassa" },
        { title: "Blocco stradale", description: "Strada temporaneamente chiusa", severity: "alta" },
        { title: "Ingorgo centro città", description: "Traffico intenso zona centrale", severity: "media" },
        { title: "Code per evento", description: "Rallentamenti per manifestazione", severity: "bassa" },
        { title: "Ingorgo zona commerciale", description: "Traffico intenso centro commerciale", severity: "media" },
        { title: "Rallentamenti pioggia", description: "Traffico lento per condizioni meteo", severity: "bassa" },
        { title: "Code uscita autostrada", description: "Rallentamenti casello autostradale", severity: "media" },
        { title: "Ingorgo zona universitaria", description: "Traffico intenso orario lezioni", severity: "media" },
        { title: "Blocco trasporto pubblico", description: "Interruzione linea autobus", severity: "alta" }
    ]
};

function generateRecentTimestamp() {
    // Eventi distribuiti nelle ultime 2 ore (per API pubblica)
    const hoursAgo = Math.random() * 2;
    return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
}

function generateNearbyCoordinates(cameraCoords) {
    // Coordinate entro 200m dalla telecamera per ingorghi
    const latOffset = (Math.random() - 0.5) * 0.003; // ~150m
    const lngOffset = (Math.random() - 0.5) * 0.004; // ~150m
    
    return {
        lat: parseFloat((cameraCoords.lat + latOffset).toFixed(6)),
        lng: parseFloat((cameraCoords.lng + lngOffset).toFixed(6))
    };
}

function selectRandomTemplate(templates) {
    return templates[Math.floor(Math.random() * templates.length)];
}

function selectRandomStatus() {
    const statuses = ["solved", "unsolved"];
    const weights = [0.3, 0.7]; // 30% risolti, 70% non risolti
    return Math.random() < weights[0] ? statuses[0] : statuses[1];
}

async function createRealisticEvents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('CREAZIONE EVENTI CON 30 TELECAMERE');
        console.log('==================================');
        
        // Cancella eventi esistenti
        const deletedEvents = await Event.deleteMany({});
        console.log(`Eventi cancellati: ${deletedEvents.deletedCount}`);
        
        // Ottieni telecamere con coordinate valide
        const cameras = await Camera.find({
            'location.coordinates.lat': { $exists: true, $ne: null },
            'location.coordinates.lng': { $exists: true, $ne: null }
        }).sort({ name: 1 });
        
        if (cameras.length === 0) {
            console.log('ERRORE: Nessuna telecamera con coordinate trovata');
            return;
        }
        
        console.log(`Telecamere disponibili: ${cameras.length}`);
        console.log(`Prima: ${cameras[0].name} - ${cameras[0].location.address}`);
        console.log(`Ultima: ${cameras[cameras.length-1].name} - ${cameras[cameras.length-1].location.address}`);
        
        // Configurazione eventi: più eventi con più telecamere
        const NUM_INCIDENTS = 15;  // Aumentato da 8
        const NUM_TRAFFIC = 12;    // Aumentato da 7
        
        const results = { 
            incidenti: 0, 
            ingorghi: 0, 
            errori: 0,
            camerasUsed: new Set(),
            eventsWithCoords: 0 
        };
        
        // CREA INCIDENTI (con cameraId, middleware assegna coordinate)
        console.log(`\nCreazione ${NUM_INCIDENTS} incidenti:`);
        console.log('-'.repeat(40));
        
        for (let i = 0; i < NUM_INCIDENTS; i++) {
            try {
                // Seleziona telecamera casuale
                const camera = cameras[Math.floor(Math.random() * cameras.length)];
                const template = selectRandomTemplate(EVENT_TEMPLATES.incidenti);
                
                const eventData = {
                    type: 'incidente',
                    title: template.title,
                    description: template.description,
                    severity: template.severity,
                    status: selectRandomStatus(),
                    eventDate: generateRecentTimestamp(),
                    cameraId: camera._id,
                    location: {
                        address: camera.location.address  // Required field
                        // coordinates saranno assegnate dal middleware
                    }
                };
                
                const savedEvent = await Event.create(eventData);
                results.incidenti++;
                results.camerasUsed.add(camera.name);
                
                console.log(`${i+1}. ${template.title}`);
                console.log(`   Camera: ${camera.name} - ${camera.location.address}`);
                console.log(`   Status: ${eventData.status} | Severity: ${eventData.severity}`);
                
                // Verifica middleware
                if (savedEvent.location?.coordinates?.lat) {
                    results.eventsWithCoords++;
                    console.log(`   Coordinate: ${savedEvent.location.coordinates.lat.toFixed(4)}, ${savedEvent.location.coordinates.lng.toFixed(4)}`);
                } else {
                    console.log(`   WARNING: Middleware non ha assegnato coordinate`);
                }
                
            } catch (error) {
                console.log(`ERRORE incidente ${i+1}: ${error.message}`);
                results.errori++;
            }
        }
        
        // CREA INGORGHI (coordinate manuali vicine alle telecamere)
        console.log(`\nCreazione ${NUM_TRAFFIC} ingorghi:`);
        console.log('-'.repeat(40));
        
        for (let i = 0; i < NUM_TRAFFIC; i++) {
            try {
                // Seleziona telecamera casuale (può essere riusata)
                const camera = cameras[Math.floor(Math.random() * cameras.length)];
                const template = selectRandomTemplate(EVENT_TEMPLATES.ingorghi);
                const nearbyCoords = generateNearbyCoordinates(camera.location.coordinates);
                
                const eventData = {
                    type: 'ingorgo',
                    title: template.title,
                    description: template.description,
                    severity: template.severity,
                    status: selectRandomStatus(),
                    eventDate: generateRecentTimestamp(),
                    // NO cameraId per ingorghi
                    location: {
                        address: `Zona ${camera.location.address}`,
                        coordinates: nearbyCoords
                    }
                };
                
                const savedEvent = await Event.create(eventData);
                results.ingorghi++;
                results.eventsWithCoords++;
                results.camerasUsed.add(camera.name);
                
                console.log(`${i+1}. ${template.title}`);
                console.log(`   Zona: ${camera.location.address}`);
                console.log(`   Status: ${eventData.status} | Severity: ${eventData.severity}`);
                console.log(`   Coordinate: ${nearbyCoords.lat.toFixed(4)}, ${nearbyCoords.lng.toFixed(4)}`);
                
            } catch (error) {
                console.log(`ERRORE ingorgo ${i+1}: ${error.message}`);
                results.errori++;
            }
        }
        
        // VERIFICA FINALE
        console.log('\n' + '='.repeat(50));
        console.log('VERIFICA FINALE');
        console.log('='.repeat(50));
        
        const finalEvents = await Event.countDocuments();
        const eventsWithCoords = await Event.countDocuments({
            'location.coordinates.lat': { $exists: true, $ne: null }
        });
        const publicEvents = await Event.countDocuments({
            eventDate: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            status: { $in: ["solved", "unsolved"] }
        });
        
        console.log(`Incidenti creati: ${results.incidenti}/${NUM_INCIDENTS}`);
        console.log(`Ingorghi creati: ${results.ingorghi}/${NUM_TRAFFIC}`);
        console.log(`Errori: ${results.errori}`);
        console.log(`Eventi totali: ${finalEvents}`);
        console.log(`Eventi con coordinate: ${eventsWithCoords}/${finalEvents}`);
        console.log(`Eventi pubblici (API): ${publicEvents}`);
        console.log(`Telecamere utilizzate: ${results.camerasUsed.size}/${cameras.length}`);
        
        // Distribuzione per severity
        const severityStats = await Event.aggregate([
            { $group: { _id: "$severity", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        console.log('\nDistribuzione severity:');
        severityStats.forEach(stat => {
            console.log(`  ${stat._id}: ${stat.count} eventi`);
        });
        
        // Distribuzione per status
        const statusStats = await Event.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        console.log('\nDistribuzione status:');
        statusStats.forEach(stat => {
            console.log(`  ${stat._id}: ${stat.count} eventi`);
        });
        
        if (eventsWithCoords === finalEvents && results.errori === 0) {
            console.log('\nSUCCESSO: Tutti gli eventi hanno coordinate!');
            console.log('Sistema pronto per la mappa con auto-refresh.');
        } else {
            console.log('\nAVVISO: Alcuni eventi non hanno coordinate o ci sono stati errori.');
        }
        
        // ESEMPI EVENTI CREATI
        console.log('\n' + '='.repeat(50));
        console.log('ESEMPI EVENTI CREATI');
        console.log('='.repeat(50));
        
        const sampleIncident = await Event.findOne({ type: 'incidente' }).populate('cameraId');
        const sampleTraffic = await Event.findOne({ type: 'ingorgo' });
        
        if (sampleIncident) {
            console.log('INCIDENTE esempio:');
            console.log(`  Titolo: ${sampleIncident.title}`);
            console.log(`  Camera: ${sampleIncident.cameraId?.name || 'N/A'}`);
            console.log(`  Indirizzo: ${sampleIncident.location.address}`);
            console.log(`  Coordinate: ${sampleIncident.location?.coordinates?.lat || 'N/A'}, ${sampleIncident.location?.coordinates?.lng || 'N/A'}`);
            console.log(`  Severity: ${sampleIncident.severity} | Status: ${sampleIncident.status}`);
        }
        
        if (sampleTraffic) {
            console.log('\nINGORGO esempio:');
            console.log(`  Titolo: ${sampleTraffic.title}`);
            console.log(`  Indirizzo: ${sampleTraffic.location.address}`);
            console.log(`  Coordinate: ${sampleTraffic.location.coordinates.lat}, ${sampleTraffic.location.coordinates.lng}`);
            console.log(`  Severity: ${sampleTraffic.severity} | Status: ${sampleTraffic.status}`);
        }
        
        console.log('\nPROSSIMI PASSI:');
        console.log('1. npm start (avvia server)');
        console.log('2. http://localhost:3000/map (testa mappa)');
        console.log('3. Implementa auto-refresh mappa (ogni 30 secondi)');
        
    } catch (error) {
        console.error('ERRORE GENERALE:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

// Funzione per analizzare distribuzione eventi per zona
async function analyzeEventDistribution() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('ANALISI DISTRIBUZIONE EVENTI');
        console.log('============================');
        
        const events = await Event.find({}).populate('cameraId');
        const cameras = await Camera.find({});
        
        console.log(`Eventi totali: ${events.length}`);
        console.log(`Telecamere totali: ${cameras.length}`);
        
        // Eventi per telecamera
        const eventsByCamera = {};
        events.forEach(event => {
            if (event.cameraId) {
                const cameraName = event.cameraId.name;
                if (!eventsByCamera[cameraName]) {
                    eventsByCamera[cameraName] = { incidenti: 0, total: 0 };
                }
                if (event.type === 'incidente') {
                    eventsByCamera[cameraName].incidenti++;
                }
                eventsByCamera[cameraName].total++;
            }
        });
        
        console.log('\nTelecamere con più incidenti:');
        Object.entries(eventsByCamera)
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, 10)
            .forEach(([camera, stats]) => {
                console.log(`  ${camera}: ${stats.total} eventi (${stats.incidenti} incidenti)`);
            });
        
    } catch (error) {
        console.error('Errore analisi:', error);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'analyze':
            analyzeEventDistribution();
            break;
            
        case 'create':
        default:
            createRealisticEvents();
            break;
    }
}

module.exports = { createRealisticEvents, analyzeEventDistribution };