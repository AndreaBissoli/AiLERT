// scripts/add-more-cameras.js
const mongoose = require('mongoose');
const Camera = require('../app/models/camera');
const Stream = require('../app/models/stream');
require('dotenv').config();

// Nuove vie strategiche di Trento per espandere la copertura
const NEW_TRENTO_STREETS = [
    "Via Rosmini, Trento",                    // Zona centro-sud
    "Via Grazioli, Trento",                   // Zona residenziale  
    "Via Torre Franca, Trento",               // Zona nord
    "Via Pedrotti, Trento",                   // Zona università
    "Via Sommarive, Trento",                  // Polo universitario Povo
    "Via Bolghera, Trento",                   // Zona industriale ovest
    "Via Matteo del Ben, Trento",             // Zona servizi
    "Via Santa Margherita, Trento",           // Zona residenziale est
    "Via Stella, Trento",                     // Zona collinare
    "Via Pranzelores, Trento",                // Zona nord-est
    "Via Solteri, Trento",                    // Zona commerciale
    "Via Gocciadoro, Trento",                 // Zona sud-est
    "Via Carlo Esterle, Trento",              // Zona stazione
    "Via Suffragio, Trento",                  // Centro storico alt
    "Via Muredei, Trento"                     // Zona periferia sud
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeStreet(streetQuery) {
    try {
        const encodedQuery = encodeURIComponent(streetQuery);
        const url = `https://nominatim.openstreetmap.org/search` +
                   `?format=json` +
                   `&q=${encodedQuery}` +
                   `&limit=3` +
                   `&countrycodes=it` +
                   `&bounded=1` +
                   `&viewbox=11.05,46.10,11.20,46.02` +
                   `&addressdetails=1`;
        
        console.log(`Geocoding: ${streetQuery}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'AiLERT-Trento-Traffic-System/1.0 (università.trento@studenti.it)'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            // Prendi il risultato migliore
            let bestResult = data[0];
            
            for (const result of data) {
                const isStreet = result.osm_type === 'way' || 
                               result.class === 'highway' ||
                               result.type === 'residential' ||
                               result.type === 'primary' ||
                               result.type === 'secondary' ||
                               result.type === 'tertiary';
                
                if (isStreet) {
                    bestResult = result;
                    break;
                }
            }
            
            const coordinates = {
                lat: parseFloat(bestResult.lat),
                lng: parseFloat(bestResult.lon)
            };
            
            // Verifica che sia in area Trento
            const inTrento = coordinates.lat >= 46.02 && coordinates.lat <= 46.10 &&
                           coordinates.lng >= 11.05 && coordinates.lng <= 11.20;
                           
            if (!inTrento) {
                console.log(`Coordinate fuori Trento: ${coordinates.lat}, ${coordinates.lng}`);
                return null;
            }
            
            console.log(`Trovato: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
            return coordinates;
            
        } else {
            console.log(`Nessun risultato per: ${streetQuery}`);
            return null;
        }
        
    } catch (error) {
        console.error(`Errore geocoding ${streetQuery}:`, error.message);
        return null;
    }
}

async function getNextCameraNumber() {
    // Trova l'ultimo numero di telecamera
    const cameras = await Camera.find({ name: /^CAM-\d+$/ }).sort({ name: -1 }).limit(1);
    
    if (cameras.length === 0) {
        return 1;
    }
    
    const lastCameraName = cameras[0].name;
    const lastNumber = parseInt(lastCameraName.split('-')[1]);
    return lastNumber + 1;
}

async function addMoreCameras() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('AGGIUNTA TELECAMERE AGGIUNTIVE');
        console.log('==============================');
        
        // Ottieni numero telecamera da cui iniziare
        const startNumber = await getNextCameraNumber();
        console.log(`Iniziando da CAM-${String(startNumber).padStart(3, '0')}`);
        
        const existingCameras = await Camera.countDocuments();
        console.log(`Telecamere esistenti: ${existingCameras}`);
        
        const results = {
            camerasAdded: 0,
            streamsAdded: 0,
            geocodingFailed: 0,
            errors: []
        };
        
        // Aggiungi ogni nuova telecamera
        for (let i = 0; i < NEW_TRENTO_STREETS.length; i++) {
            const streetQuery = NEW_TRENTO_STREETS[i];
            const cameraNumber = startNumber + i;
            const cameraName = `CAM-${String(cameraNumber).padStart(3, '0')}`;
            
            console.log(`\n[${i + 1}/${NEW_TRENTO_STREETS.length}] ${cameraName}`);
            console.log(`Via: ${streetQuery}`);
            
            try {
                // Geocodifica la via
                const coordinates = await geocodeStreet(streetQuery);
                
                if (!coordinates) {
                    console.log(`Geocodifica fallita - salto questa telecamera`);
                    results.geocodingFailed++;
                    continue;
                }
                
                // Crea telecamera
                const installationDate = new Date();
                installationDate.setMonth(installationDate.getMonth() - Math.floor(Math.random() * 36));
                
                const cameraData = {
                    name: cameraName,
                    location: {
                        address: streetQuery.replace(', Trento', ''),
                        coordinates: coordinates
                    },
                    installationDate,
                    lastMaintenance: new Date(installationDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000),
                    isActive: true,
                    ipAddress: `192.168.1.${100 + cameraNumber}`,
                    streamUrl: `rtsp://192.168.1.${100 + cameraNumber}:554/stream`,
                    modelInfo: {
                        brand: ['Hikvision', 'Dahua', 'Axis', 'Bosch'][Math.floor(Math.random() * 4)],
                        model: `Model-${Math.floor(Math.random() * 9000) + 1000}`
                    }
                };
                
                const savedCamera = await Camera.create(cameraData);
                results.camerasAdded++;
                
                console.log(`Camera creata: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
                
                // Crea stream associato
                const streamData = {
                    cameraId: savedCamera._id,
                    streamKey: `stream_${cameraName.toLowerCase()}`,
                    streamUrl: `rtsp://192.168.1.${100 + cameraNumber}:554/stream`,
                    streamType: 'rtsp',
                    isActive: true,
                    quality: ['HD', '4K', 'FHD'][Math.floor(Math.random() * 3)],
                    frameRate: [25, 30, 50][Math.floor(Math.random() * 3)]
                };
                
                await Stream.create(streamData);
                results.streamsAdded++;
                
                console.log(`Stream creato: ${streamData.streamKey}`);
                
                // Rate limiting
                if (i < NEW_TRENTO_STREETS.length - 1) {
                    console.log(`Pausa 1.2 secondi...`);
                    await delay(1200);
                }
                
            } catch (error) {
                console.log(`Errore ${cameraName}: ${error.message}`);
                results.errors.push({ camera: cameraName, error: error.message });
            }
        }
        
        // Risultati finali
        console.log('\n' + '='.repeat(40));
        console.log('RISULTATI FINALI');
        console.log('='.repeat(40));
        
        const finalCameraCount = await Camera.countDocuments();
        const finalStreamCount = await Stream.countDocuments();
        
        console.log(`Telecamere aggiunte: ${results.camerasAdded}/${NEW_TRENTO_STREETS.length}`);
        console.log(`Stream aggiunti: ${results.streamsAdded}`);
        console.log(`Geocodifica fallita: ${results.geocodingFailed}`);
        console.log(`Errori: ${results.errors.length}`);
        console.log(`Telecamere totali: ${finalCameraCount}`);
        console.log(`Stream totali: ${finalStreamCount}`);
        
        if (results.errors.length > 0) {
            console.log('\nErrori dettagliati:');
            results.errors.forEach(err => {
                console.log(`  ${err.camera}: ${err.error}`);
            });
        }
        
        // Mostra nuovi ID per DetectionService
        if (results.camerasAdded > 0) {
            console.log('\nNUOVI ID TELECAMERE:');
            console.log('Aggiorna DetectionService con:');
            
            const newCameras = await Camera.find({ name: { $regex: `^CAM-0(${String(startNumber).padStart(2, '0')}|[1-9][0-9])$` } })
                                          .sort({ name: 1 });
            
            newCameras.forEach(camera => {
                console.log(`    '${camera._id}', // ${camera.name} - ${camera.location.address}`);
            });
        }
        
        console.log('\nPROSSIMI PASSI:');
        console.log('1. node scripts/get-camera-ids.js (vedi tutti gli ID)');
        console.log('2. Aggiorna DetectionService con i nuovi ID');
        console.log('3. node scripts/create-realistic-events.js (rigenera eventi)');
        console.log('4. npm start (testa mappa con più telecamere)');
        
    } catch (error) {
        console.error('Errore generale:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Funzione per verificare la distribuzione geografica
async function analyzeDistribution() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const cameras = await Camera.find({}).sort({ name: 1 });
        
        console.log('ANALISI DISTRIBUZIONE TELECAMERE');
        console.log('=================================');
        console.log(`Telecamere totali: ${cameras.length}`);
        
        // Calcola bounding box
        const coords = cameras.map(c => c.location.coordinates).filter(c => c.lat && c.lng);
        
        if (coords.length > 0) {
            const minLat = Math.min(...coords.map(c => c.lat));
            const maxLat = Math.max(...coords.map(c => c.lat));
            const minLng = Math.min(...coords.map(c => c.lng));
            const maxLng = Math.max(...coords.map(c => c.lng));
            
            console.log(`Copertura geografica:`);
            console.log(`  Latitudine: ${minLat.toFixed(4)} - ${maxLat.toFixed(4)}`);
            console.log(`  Longitudine: ${minLng.toFixed(4)} - ${maxLng.toFixed(4)}`);
            
            // Calcola distanza massima
            const latRange = (maxLat - minLat) * 111; // km
            const lngRange = (maxLng - minLng) * 85;  // km (approssimativo per Trento)
            
            console.log(`  Copertura: ~${latRange.toFixed(1)}km x ${lngRange.toFixed(1)}km`);
        }
        
        // Mostra alcune telecamere per verifica
        console.log('\nUltime 5 telecamere aggiunte:');
        cameras.slice(-5).forEach(camera => {
            const coords = camera.location.coordinates;
            console.log(`  ${camera.name}: ${camera.location.address} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
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
            analyzeDistribution();
            break;
            
        case 'add':
        default:
            addMoreCameras();
            break;
    }
}

module.exports = { addMoreCameras, analyzeDistribution };