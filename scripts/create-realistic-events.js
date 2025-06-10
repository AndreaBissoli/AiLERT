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

function generateHistoricalTimestamp() {
    // Eventi distribuiti nell'ultimo anno (escluse le ultime 2 ore)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const timeRange = twoHoursAgo.getTime() - oneYearAgo.getTime();
    const randomTime = oneYearAgo.getTime() + Math.random() * timeRange;
    
    return new Date(randomTime);
}

function selectRandomTemplate(templates) {
    return templates[Math.floor(Math.random() * templates.length)];
}

function selectRandomStatus() {
    const statuses = ["solved", "unsolved"];
    const weights = [0.3, 0.7]; // 30% risolti, 70% non risolti
    return Math.random() < weights[0] ? statuses[0] : statuses[1];
}

function selectRandomStatusHistorical() {
    // Per eventi storici, più probabilità che siano risolti
    const statuses = ["solved", "unsolved", "false_alarm"];
    const weights = [0.7, 0.25, 0.05]; // 70% risolti, 25% non risolti, 5% falsi allarmi
    
    const random = Math.random();
    if (random < weights[0]) return statuses[0];
    if (random < weights[0] + weights[1]) return statuses[1];
    return statuses[2];
}

async function createHistoricalEvents(cameras) {
    console.log('\n' + '='.repeat(50));
    console.log('CREAZIONE EVENTI STORICI (ULTIMO ANNO)');
    console.log('='.repeat(50));
    
    const NUM_HISTORICAL_INCIDENTS = 60;
    const NUM_HISTORICAL_TRAFFIC = 40;
    
    const results = { 
        incidenti: 0, 
        ingorghi: 0, 
        errori: 0,
        eventsWithCoords: 0 
    };
    
    // CREA INCIDENTI STORICI
    console.log(`\nCreazione ${NUM_HISTORICAL_INCIDENTS} incidenti storici:`);
    console.log('-'.repeat(45));
    
    for (let i = 0; i < NUM_HISTORICAL_INCIDENTS; i++) {
        try {
            const camera = cameras[Math.floor(Math.random() * cameras.length)];
            const template = selectRandomTemplate(EVENT_TEMPLATES.incidenti);
            
            const eventData = {
                type: 'incidente',
                title: template.title,
                description: template.description,
                severity: template.severity,
                status: selectRandomStatusHistorical(),
                eventDate: generateHistoricalTimestamp(),
                cameraId: camera._id,
                location: {
                    address: camera.location.address
                }
            };
            
            const savedEvent = await Event.create(eventData);
            results.incidenti++;
            
            if (savedEvent.location?.coordinates?.lat) {
                results.eventsWithCoords++;
            }
            
            if ((i + 1) % 20 === 0) {
                console.log(`  Creati ${i + 1}/${NUM_HISTORICAL_INCIDENTS} incidenti storici...`);
            }
            
        } catch (error) {
            results.errori++;
        }
    }
    
    // CREA INGORGHI STORICI
    console.log(`\nCreazione ${NUM_HISTORICAL_TRAFFIC} ingorghi storici:`);
    console.log('-'.repeat(45));
    
    for (let i = 0; i < NUM_HISTORICAL_TRAFFIC; i++) {
        try {
            const camera = cameras[Math.floor(Math.random() * cameras.length)];
            const template = selectRandomTemplate(EVENT_TEMPLATES.ingorghi);
            const nearbyCoords = generateNearbyCoordinates(camera.location.coordinates);
            
            const eventData = {
                type: 'ingorgo',
                title: template.title,
                description: template.description,
                severity: template.severity,
                status: selectRandomStatusHistorical(),
                eventDate: generateHistoricalTimestamp(),
                location: {
                    address: `Zona ${camera.location.address}`,
                    coordinates: nearbyCoords
                }
            };
            
            const savedEvent = await Event.create(eventData);
            results.ingorghi++;
            results.eventsWithCoords++;
            
            if ((i + 1) % 15 === 0) {
                console.log(`  Creati ${i + 1}/${NUM_HISTORICAL_TRAFFIC} ingorghi storici...`);
            }
            
        } catch (error) {
            results.errori++;
        }
    }
    
    console.log('\nEventi storici completati:');
    console.log(`  Incidenti: ${results.incidenti}`);
    console.log(`  Ingorghi: ${results.ingorghi}`);
    console.log(`  Con coordinate: ${results.eventsWithCoords}`);
    console.log(`  Errori: ${results.errori}`);
    
    return results;
}

async function createRealisticEvents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('CREAZIONE EVENTI RECENTI + STORICI');
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
        
        // PRIMA: Crea eventi storici
        const historicalResults = await createHistoricalEvents(cameras);
        
        // SECONDO: Crea eventi recenti (per API pubblica)
        console.log('\n' + '='.repeat(50));
        console.log('CREAZIONE EVENTI RECENTI (ULTIME 2 ORE)');
        console.log('='.repeat(50));
        
        // Configurazione eventi recenti
        const NUM_INCIDENTS = 15;
        const NUM_TRAFFIC = 12;
        
        const recentResults = { 
            incidenti: 0, 
            ingorghi: 0, 
            errori: 0,
            camerasUsed: new Set(),
            eventsWithCoords: 0 
        };
        
        // CREA INCIDENTI RECENTI
        console.log(`\nCreazione ${NUM_INCIDENTS} incidenti recenti:`);
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
                recentResults.incidenti++;
                recentResults.camerasUsed.add(camera.name);
                
                console.log(`${i+1}. ${template.title}`);
                console.log(`   Camera: ${camera.name} - ${camera.location.address}`);
                console.log(`   Status: ${eventData.status} | Severity: ${eventData.severity}`);
                
                // Verifica middleware
                if (savedEvent.location?.coordinates?.lat) {
                    recentResults.eventsWithCoords++;
                    console.log(`   Coordinate: ${savedEvent.location.coordinates.lat.toFixed(4)}, ${savedEvent.location.coordinates.lng.toFixed(4)}`);
                } else {
                    console.log(`   WARNING: Middleware non ha assegnato coordinate`);
                }
                
            } catch (error) {
                console.log(`ERRORE incidente ${i+1}: ${error.message}`);
                recentResults.errori++;
            }
        }
        
        // CREA INGORGHI RECENTI
        console.log(`\nCreazione ${NUM_TRAFFIC} ingorghi recenti:`);
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
                recentResults.ingorghi++;
                recentResults.eventsWithCoords++;
                recentResults.camerasUsed.add(camera.name);
                
                console.log(`${i+1}. ${template.title}`);
                console.log(`   Zona: ${camera.location.address}`);
                console.log(`   Status: ${eventData.status} | Severity: ${eventData.severity}`);
                console.log(`   Coordinate: ${nearbyCoords.lat.toFixed(4)}, ${nearbyCoords.lng.toFixed(4)}`);
                
            } catch (error) {
                console.log(`ERRORE ingorgo ${i+1}: ${error.message}`);
                recentResults.errori++;
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
        const historicalEvents = await Event.countDocuments({
            eventDate: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        });
        
        console.log('EVENTI RECENTI (ultime 2 ore):');
        console.log(`  Incidenti: ${recentResults.incidenti}/${NUM_INCIDENTS}`);
        console.log(`  Ingorghi: ${recentResults.ingorghi}/${NUM_TRAFFIC}`);
        console.log(`  Pubblici (API): ${publicEvents}`);
        
        console.log('\nEVENTI STORICI (ultimo anno):');
        console.log(`  Incidenti: ${historicalResults.incidenti}`);
        console.log(`  Ingorghi: ${historicalResults.ingorghi}`);
        console.log(`  Totali storici: ${historicalEvents}`);
        
        console.log('\nTOTALI:');
        console.log(`  Eventi totali: ${finalEvents}`);
        console.log(`  Eventi con coordinate: ${eventsWithCoords}/${finalEvents}`);
        console.log(`  Errori totali: ${recentResults.errori + historicalResults.errori}`);
        console.log(`  Telecamere utilizzate: ${recentResults.camerasUsed.size}/${cameras.length}`);
        
        // Distribuzione temporale
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        const timeDistribution = await Event.aggregate([
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $gte: ["$eventDate", new Date(now.getTime() - 2 * 60 * 60 * 1000)] }, then: "Ultime 2 ore" },
                                { case: { $gte: ["$eventDate", oneWeekAgo] }, then: "Ultima settimana" },
                                { case: { $gte: ["$eventDate", oneMonthAgo] }, then: "Ultimo mese" },
                                { case: { $gte: ["$eventDate", threeMonthsAgo] }, then: "Ultimi 3 mesi" }
                            ],
                            default: "Oltre 3 mesi"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        console.log('\nDistribuzione temporale:');
        timeDistribution.forEach(stat => {
            console.log(`  ${stat._id}: ${stat.count} eventi`);
        });
        
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
        
        if (eventsWithCoords === finalEvents && (recentResults.errori + historicalResults.errori) === 0) {
            console.log('\nSUCCESSO: Tutti gli eventi hanno coordinate!');
            console.log('Sistema pronto con dati storici e recenti.');
        } else {
            console.log('\nAVVISO: Alcuni eventi non hanno coordinate o ci sono stati errori.');
        }
        
        // ESEMPI EVENTI CREATI
        console.log('\n' + '='.repeat(50));
        console.log('ESEMPI EVENTI CREATI');
        console.log('='.repeat(50));
        
        const sampleIncident = await Event.findOne({ type: 'incidente' }).populate('cameraId');
        const sampleTraffic = await Event.findOne({ type: 'ingorgo' });
        const sampleHistorical = await Event.findOne({ 
            eventDate: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        }).populate('cameraId');
        
        if (sampleIncident) {
            console.log('INCIDENTE RECENTE esempio:');
            console.log(`  Titolo: ${sampleIncident.title}`);
            console.log(`  Camera: ${sampleIncident.cameraId?.name || 'N/A'}`);
            console.log(`  Data: ${sampleIncident.eventDate.toLocaleString('it-IT')}`);
            console.log(`  Status: ${sampleIncident.status} | Severity: ${sampleIncident.severity}`);
        }
        
        if (sampleHistorical) {
            console.log('\nEVENTO STORICO esempio:');
            console.log(`  Titolo: ${sampleHistorical.title}`);
            console.log(`  Tipo: ${sampleHistorical.type}`);
            console.log(`  Data: ${sampleHistorical.eventDate.toLocaleString('it-IT')}`);
            console.log(`  Status: ${sampleHistorical.status} | Severity: ${sampleHistorical.severity}`);
        }
        
        console.log('\nVANTAGGI:');
        console.log('✓ Statistiche storiche popolate');
        console.log('✓ Dati per analisi trend');
        console.log('✓ Events recenti per mappa live');
        console.log('✓ Distribuzione realistica nel tempo');
        
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