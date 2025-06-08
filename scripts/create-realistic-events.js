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
        { title: "Incidente multiplo", description: "Coinvolti 3 veicoli", severity: "alta" }
    ],
    ingorghi: [
        { title: "Ingorgo traffico intenso", description: "Code dovute all'ora di punta", severity: "media" },
        { title: "Rallentamenti lavori", description: "Cantiere stradale", severity: "bassa" },
        { title: "Blocco stradale", description: "Strada temporaneamente chiusa", severity: "alta" },
        { title: "Ingorgo centro città", description: "Traffico intenso zona centrale", severity: "media" }
    ]
};

function generateRecentTimestamp() {
    const hoursAgo = Math.random() * 2;
    return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
}

function generateNearbyCoordinates(cameraCoords) {
    const latOffset = (Math.random() - 0.5) * 0.003;
    const lngOffset = (Math.random() - 0.5) * 0.004;
    
    return {
        lat: parseFloat((cameraCoords.lat + latOffset).toFixed(6)),
        lng: parseFloat((cameraCoords.lng + lngOffset).toFixed(6))
    };
}

async function createRealisticEvents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('CREAZIONE EVENTI REALISTICI');
        console.log('============================');
        
        // Cancella eventi esistenti
        const deletedEvents = await Event.deleteMany({});
        console.log(`Eventi cancellati: ${deletedEvents.deletedCount}`);
        
        // Ottieni telecamere con coordinate
        const cameras = await Camera.find({
            'location.coordinates.lat': { $exists: true, $ne: null }
        });
        
        if (cameras.length === 0) {
            console.log('ERRORE: Nessuna telecamera con coordinate trovata');
            return;
        }
        
        console.log(`Telecamere disponibili: ${cameras.length}`);
        
        const results = { incidenti: 0, ingorghi: 0, errori: 0 };
        
        // CREA 8 INCIDENTI (con cameraId, middleware assegna coordinate)
        console.log('\nCreazione incidenti:');
        for (let i = 0; i < 8; i++) {
            try {
                const camera = cameras[i % cameras.length];
                const template = EVENT_TEMPLATES.incidenti[i % EVENT_TEMPLATES.incidenti.length];
                
                const eventData = {
                    type: 'incidente',
                    title: template.title,
                    description: template.description,
                    severity: template.severity,
                    status: Math.random() > 0.5 ? 'solved' : 'unsolved',
                    eventDate: generateRecentTimestamp(),
                    cameraId: camera._id,
                    location: {
                        address: camera.location.address  // REQUIRED field
                        // coordinates saranno assegnate dal middleware
                    }
                };
                
                const savedEvent = await Event.create(eventData);
                results.incidenti++;
                
                console.log(`  ${i+1}. ${template.title} - ${camera.name} (${camera.location.address})`);
                
                // Verifica middleware
                if (savedEvent.location?.coordinates?.lat) {
                    console.log(`     Coordinate: ${savedEvent.location.coordinates.lat}, ${savedEvent.location.coordinates.lng}`);
                } else {
                    console.log(`     WARNING: Middleware non ha assegnato coordinate`);
                }
                
            } catch (error) {
                console.log(`  ERRORE ${i+1}: ${error.message}`);
                results.errori++;
            }
        }
        
        // CREA 7 INGORGHI (coordinate manuali)
        console.log('\nCreazione ingorghi:');
        for (let i = 0; i < 7; i++) {
            try {
                const camera = cameras[i % cameras.length];
                const template = EVENT_TEMPLATES.ingorghi[i % EVENT_TEMPLATES.ingorghi.length];
                const nearbyCoords = generateNearbyCoordinates(camera.location.coordinates);
                
                const eventData = {
                    type: 'ingorgo',
                    title: template.title,
                    description: template.description,
                    severity: template.severity,
                    status: Math.random() > 0.5 ? 'solved' : 'unsolved',
                    eventDate: generateRecentTimestamp(),
                    // NO cameraId per ingorghi
                    location: {
                        address: `Zona ${camera.location.address}`,
                        coordinates: nearbyCoords
                    }
                };
                
                await Event.create(eventData);
                results.ingorghi++;
                
                console.log(`  ${i+1}. ${template.title} - Zona ${camera.location.address}`);
                console.log(`     Coordinate: ${nearbyCoords.lat}, ${nearbyCoords.lng}`);
                
            } catch (error) {
                console.log(`  ERRORE ${i+1}: ${error.message}`);
                results.errori++;
            }
        }
        
        // VERIFICA FINALE
        console.log('\nVERIFICA FINALE');
        console.log('===============');
        
        const totalEvents = await Event.countDocuments();
        const eventsWithCoords = await Event.countDocuments({
            'location.coordinates.lat': { $exists: true, $ne: null }
        });
        const publicEvents = await Event.countDocuments({
            eventDate: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            status: { $in: ["solved", "unsolved"] }
        });
        
        console.log(`Incidenti creati: ${results.incidenti}`);
        console.log(`Ingorghi creati: ${results.ingorghi}`);
        console.log(`Errori: ${results.errori}`);
        console.log(`Eventi totali: ${totalEvents}`);
        console.log(`Eventi con coordinate: ${eventsWithCoords}`);
        console.log(`Eventi pubblici (API): ${publicEvents}`);
        
        if (eventsWithCoords === totalEvents && results.errori === 0) {
            console.log('\nSUCCESSO: Tutti gli eventi hanno coordinate!');
            console.log('Il sistema è pronto per la mappa.');
        } else {
            console.log('\nPROBLEMI: Alcuni eventi non hanno coordinate o ci sono stati errori.');
        }
        
        // ESEMPIO EVENTI CREATI
        console.log('\nESEMPI EVENTI:');
        const sampleIncident = await Event.findOne({ type: 'incidente' });
        const sampleTraffic = await Event.findOne({ type: 'ingorgo' });
        
        if (sampleIncident) {
            console.log('Incidente esempio:');
            console.log(`  Titolo: ${sampleIncident.title}`);
            console.log(`  Camera: ${sampleIncident.cameraId}`);
            console.log(`  Indirizzo: ${sampleIncident.location.address}`);
            console.log(`  Coordinate: ${sampleIncident.location?.coordinates?.lat || 'N/A'}, ${sampleIncident.location?.coordinates?.lng || 'N/A'}`);
        }
        
        if (sampleTraffic) {
            console.log('Ingorgo esempio:');
            console.log(`  Titolo: ${sampleTraffic.title}`);
            console.log(`  Indirizzo: ${sampleTraffic.location.address}`);
            console.log(`  Coordinate: ${sampleTraffic.location.coordinates.lat}, ${sampleTraffic.location.coordinates.lng}`);
        }
        
        console.log('\nPROSSIMI PASSI:');
        console.log('- npm start (avvia server)');
        console.log('- http://localhost:3000/map (testa mappa)');
        
    } catch (error) {
        console.error('ERRORE GENERALE:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    createRealisticEvents();
}

module.exports = { createRealisticEvents };