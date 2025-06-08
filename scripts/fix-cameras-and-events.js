// scripts/fix-cameras-and-events.js
const mongoose = require('mongoose');
const Camera = require('../app/models/camera');
const Event = require('../app/models/event');
require('dotenv').config();

async function fixCamerasAndCreateEvents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('STEP 1: Pulizia nomi telecamere');
        console.log('================================');
        
        const cameras = await Camera.find({});
        let cleanedCameras = 0;
        
        for (const camera of cameras) {
            const currentName = camera.name;
            
            // Estrai solo la parte CAM-XXX dal nome
            const cleanName = currentName.split(' ')[0]; // Prende solo "CAM-001"
            
            if (cleanName !== currentName) {
                await Camera.findByIdAndUpdate(camera._id, {
                    $set: { name: cleanName }
                });
                
                console.log(`Pulito: ${currentName} -> ${cleanName}`);
                cleanedCameras++;
            }
        }
        
        console.log(`Telecamere pulite: ${cleanedCameras}`);
        
        console.log('\nSTEP 2: Cancellazione eventi esistenti');
        console.log('======================================');
        
        const deletedEvents = await Event.deleteMany({});
        console.log(`Eventi cancellati: ${deletedEvents.deletedCount}`);
        
        console.log('\nSTEP 3: Creazione nuovi eventi');
        console.log('==============================');
        
        // Prendi telecamere con coordinate
        const validCameras = await Camera.find({
            'location.coordinates.lat': { $exists: true, $ne: null }
        });
        
        if (validCameras.length === 0) {
            console.log('ERRORE: Nessuna telecamera con coordinate trovata');
            return;
        }
        
        const eventTemplates = {
            incidenti: [
                { title: 'Incidente stradale', description: 'Tamponamento tra due veicoli', severity: 'medio' },
                { title: 'Incidente con feriti', description: 'Scontro con intervento ambulanza', severity: 'alto' },
                { title: 'Incidente lieve', description: 'Collisione senza feriti', severity: 'basso' },
                { title: 'Incidente moto-auto', description: 'Urto tra motociclo e automobile', severity: 'medio' }
            ],
            ingorghi: [
                { title: 'Ingorgo traffico intenso', description: 'Code dovute all\'ora di punta', severity: 'medio' },
                { title: 'Rallentamenti lavori', description: 'Cantiere stradale', severity: 'basso' },
                { title: 'Blocco stradale', description: 'Strada temporaneamente chiusa', severity: 'alto' },
                { title: 'Ingorgo centro città', description: 'Traffico intenso zona centrale', severity: 'medio' }
            ]
        };
        
        let eventsCreated = 0;
        
        // Crea 8 incidenti con cameraId (middleware assegna coordinate)
        for (let i = 0; i < 8; i++) {
            const camera = validCameras[i % validCameras.length];
            const template = eventTemplates.incidenti[i % eventTemplates.incidenti.length];
            
            const eventData = {
                type: 'incidente',
                title: template.title,
                description: template.description,
                severity: template.severity,
                status: Math.random() > 0.5 ? 'solved' : 'unsolved',
                eventDate: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
                cameraId: camera._id
            };
            
            await Event.create(eventData);
            eventsCreated++;
            console.log(`Incidente ${i+1}: ${template.title} - Camera ${camera.name}`);
        }
        
        // Crea 7 ingorghi con coordinate manuali
        for (let i = 0; i < 7; i++) {
            const camera = validCameras[i % validCameras.length];
            const template = eventTemplates.ingorghi[i % eventTemplates.ingorghi.length];
            
            // Coordinate vicine alla camera (±150m)
            const nearbyCoords = {
                lat: parseFloat((camera.location.coordinates.lat + (Math.random() - 0.5) * 0.003).toFixed(6)),
                lng: parseFloat((camera.location.coordinates.lng + (Math.random() - 0.5) * 0.004).toFixed(6))
            };
            
            const eventData = {
                type: 'ingorgo',
                title: template.title,
                description: template.description,
                severity: template.severity,
                status: Math.random() > 0.5 ? 'solved' : 'unsolved',
                eventDate: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
                location: {
                    address: `Zona ${camera.location.address}`,
                    coordinates: nearbyCoords
                }
            };
            
            await Event.create(eventData);
            eventsCreated++;
            console.log(`Ingorgo ${i+1}: ${template.title} - Zona ${camera.location.address}`);
        }
        
        console.log('\nSTEP 4: Verifica finale');
        console.log('=======================');
        
        const finalCameras = await Camera.countDocuments();
        const finalEvents = await Event.countDocuments();
        const eventsWithCoords = await Event.countDocuments({
            'location.coordinates.lat': { $exists: true, $ne: null }
        });
        const publicEvents = await Event.countDocuments({
            eventDate: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            status: { $in: ["solved", "unsolved"] }
        });
        
        console.log(`Telecamere: ${finalCameras}`);
        console.log(`Eventi totali: ${finalEvents}`);
        console.log(`Eventi con coordinate: ${eventsWithCoords}`);
        console.log(`Eventi pubblici (API): ${publicEvents}`);
        
        if (eventsWithCoords === finalEvents) {
            console.log('\nSUCCESSO: Tutti gli eventi hanno coordinate!');
            console.log('Sistema pronto per la mappa.');
        } else {
            console.log('\nAVVISO: Alcuni eventi non hanno coordinate.');
        }
        
        console.log('\nComandi successivi:');
        console.log('- node scripts/get-camera-ids.js (verifica nomi puliti)');
        console.log('- npm start (testa mappa su http://localhost:3000/map)');
        
    } catch (error) {
        console.error('Errore:', error);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    fixCamerasAndCreateEvents();
}

module.exports = { fixCamerasAndCreateEvents };