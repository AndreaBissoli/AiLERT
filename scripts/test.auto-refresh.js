// scripts/simple-timeline-test.js
const mongoose = require('mongoose');
const Event = require('../app/models/event');
const Camera = require('../app/models/camera');
require('dotenv').config();

const EVENTI_TEST = [
    // Incidenti
    { title: "Incidente Via Roma", description: "Tamponamento auto-moto", severity: "alta", type: "incidente" },
    { title: "Scontro Corso Italia", description: "Collisione tra due auto", severity: "media", type: "incidente" },
    { title: "Incidente Via Kennedy", description: "Auto fuori strada", severity: "alta", type: "incidente" },
    { title: "Tamponamento Tangenziale", description: "Catena di tamponamenti", severity: "alta", type: "incidente" },
    { title: "Investimento Duomo", description: "Pedone investito sulle strisce", severity: "alta", type: "incidente" },
    { title: "Ribaltamento A22", description: "Auto ribaltata in autostrada", severity: "alta", type: "incidente" },
    { title: "Scontro Via Manci", description: "Incidente tra moto e bici", severity: "media", type: "incidente" },
    { title: "Uscita strada SS12", description: "Auto finita nel fossato", severity: "media", type: "incidente" },
    { title: "Collisione Stazione", description: "Incidente davanti alla stazione", severity: "alta", type: "incidente" },
    { title: "Tamponamento Centro", description: "Scontro in centro città", severity: "bassa", type: "incidente" },
    
    // Ingorghi
    { title: "Ingorgo Ponte San Lorenzo", description: "Traffico intenso sul ponte", severity: "media", type: "ingorgo" },
    { title: "Rallentamenti Centro", description: "Traffico da evento", severity: "bassa", type: "ingorgo" },
    { title: "Blocco Via Brennero", description: "Lavori stradali in corso", severity: "media", type: "ingorgo" },
    { title: "Coda Autostrada A22", description: "Code al casello Trento Sud", severity: "alta", type: "ingorgo" },
    { title: "Traffico Università", description: "Orario di punta studenti", severity: "bassa", type: "ingorgo" },
    { title: "Blocco Piazza Fiera", description: "Evento in corso, traffico deviato", severity: "alta", type: "ingorgo" },
    { title: "Rallentamenti Tangenziale", description: "Code in tangenziale", severity: "media", type: "ingorgo" },
    { title: "Ingorgo Via Pranzelores", description: "Traffico intenso zona commerciale", severity: "media", type: "ingorgo" },
    { title: "Blocco Trasporto Pubblico", description: "Autobus fermo per guasto", severity: "alta", type: "ingorgo" },
    { title: "Code Centro Storico", description: "ZTL attiva, traffico lento", severity: "bassa", type: "ingorgo" }
];

function generateNearbyCoordinates(cameraCoords) {
    const latOffset = (Math.random() - 0.5) * 0.003;
    const lngOffset = (Math.random() - 0.5) * 0.004;
    
    return {
        lat: parseFloat((cameraCoords.lat + latOffset).toFixed(6)),
        lng: parseFloat((cameraCoords.lng + lngOffset).toFixed(6))
    };
}

async function createSimpleTimeline() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const now = new Date();
        console.log('TIMELINE SEMPLICE PER TEST AUTO-REFRESH');
        console.log('========================================');
        console.log(`Ora creazione: ${now.toLocaleTimeString()}`);
        console.log('');
        
        // Cancella tutto
        const deleted = await Event.deleteMany({});
        console.log(`Eventi cancellati: ${deleted.deletedCount}`);
        
        // Ottieni telecamere
        const cameras = await Camera.find({
            'location.coordinates.lat': { $exists: true, $ne: null },
            'location.coordinates.lng': { $exists: true, $ne: null }
        }).sort({ name: 1 });
        
        if (cameras.length === 0) {
            console.log('ERRORE: Nessuna telecamera trovata');
            console.log('Esegui prima: node scripts/create-realistic-cameras.js');
            return;
        }
        
        console.log(`Telecamere disponibili: ${cameras.length}`);
        console.log('');
        
        // Crea timeline di eventi - VERSIONE CORRETTA: 2 PASSATI + 18 FUTURI
        console.log('CREAZIONE TIMELINE (2 subito + 18 progressivi):');
        console.log('-'.repeat(45));
        
        for (let i = 0; i < EVENTI_TEST.length; i++) {
            const evento = EVENTI_TEST[i];
            
            let eventTime;
            if (i < 2) {
                // PRIMI 2 EVENTI: Nel passato (visibili subito)
                const minutesAgo = 5 + i; // 5 e 6 minuti fa
                eventTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
            } else {
                // ALTRI 18 EVENTI: Nel futuro (ogni 25 secondi)
                const delaySeconds = (i - 1) * 25; // 25s, 50s, 75s, etc.
                eventTime = new Date(now.getTime() + delaySeconds * 1000);
            }
            
            let eventData;
            
            if (evento.type === "incidente") {
                const camera = cameras[i % cameras.length];
                eventData = {
                    type: evento.type,
                    title: evento.title,
                    description: evento.description,
                    severity: evento.severity,
                    status: "unsolved",
                    eventDate: eventTime,
                    cameraId: camera._id,
                    location: {
                        address: camera.location.address
                    }
                };
            } else {
                const camera = cameras[Math.floor(Math.random() * cameras.length)];
                const nearbyCoords = generateNearbyCoordinates(camera.location.coordinates);
                eventData = {
                    type: evento.type,
                    title: evento.title,
                    description: evento.description,
                    severity: evento.severity,
                    status: "unsolved",
                    eventDate: eventTime,
                    location: {
                        address: `Zona ${camera.location.address}`,
                        coordinates: nearbyCoords
                    }
                };
            }
            
            await Event.create(eventData);
            
            if (i < 2) {
                const minutesAgo = Math.round((now.getTime() - eventTime.getTime()) / 60000);
                console.log(`${i+1}. ${evento.title} (${evento.type}) - SUBITO VISIBILE`);
                console.log(`   Timestamp: ${eventTime.toLocaleTimeString()} (${minutesAgo} min fa)`);
            } else {
                const delayMinutes = Math.round((eventTime.getTime() - now.getTime()) / 60000);
                console.log(`${i+1}. ${evento.title} (${evento.type}) - FUTURO`);
                console.log(`   Timestamp: ${eventTime.toLocaleTimeString()} (tra ${delayMinutes} min)`);
            }
        }
        
        console.log('');
        console.log('VERIFICA:');
        console.log('-'.repeat(15));
        
        const totalEvents = await Event.countDocuments();
        const pastEvents = await Event.countDocuments({
            eventDate: { $lte: new Date() }
        });
        const futureEvents = await Event.countDocuments({
            eventDate: { $gt: new Date() }
        });
        
        // Test dell'API pubblica (dovrebbe trovare solo i 2 eventi passati)
        const publicEventsTest = await Event.find({
            eventDate: { 
                $gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
                $lte: new Date() // NO eventi futuri
            },
            status: { $in: ["solved", "unsolved"] }
        });
        
        console.log(`Eventi totali creati: ${totalEvents}`);
        console.log(`Eventi passati (visibili ora): ${pastEvents}`);
        console.log(`Eventi futuri (appariranno): ${futureEvents}`);
        console.log(`Eventi API pubblica ora: ${publicEventsTest.length}`);
        
        console.log('');
        console.log('TEST:');
        console.log('='.repeat(10));
        console.log('1. npm start');
        console.log('2. http://localhost:3000/map');
        console.log(`3. Dovresti vedere ${publicEventsTest.length} eventi subito`);
        console.log('4. Auto-refresh ogni 30s dovrebbe mostrare NUOVI eventi');
        console.log('5. Eventi futuri appariranno progressivamente!');
        
        console.log('');
        console.log('PROSSIMI EVENTI (appariranno):');
        console.log('-'.repeat(35));
        
        const nextEvents = await Event.find({ 
            eventDate: { $gt: new Date() } 
        }).sort({ eventDate: 1 }).limit(5);
        
        nextEvents.forEach((event, index) => {
            const secondi = Math.round((event.eventDate.getTime() - new Date().getTime()) / 1000);
            const minuti = Math.round(secondi / 60);
            console.log(`${index + 1}. ${event.title} - tra ${secondi}s (~${minuti}min) - ${event.eventDate.toLocaleTimeString()}`);
        });
        
    } catch (error) {
        console.error('ERRORE:', error);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    createSimpleTimeline();
}

module.exports = { createSimpleTimeline };