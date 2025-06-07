// scripts/setup-complete-database.js
const mongoose = require('mongoose');
const { cleanDatabase } = require('./clean-database');
const { createRealisticCameras } = require('./create-realistic-cameras');
const { createRealisticStreams } = require('./create-realistic-streams');
const { createRealisticEvents } = require('./create-realistic-events');
const { analyzeDatabase } = require('./analyze-database');
require('dotenv').config();

async function setupCompleteDatabase() {
    console.log('🎯 AiLERT - Setup Completo Database');
    console.log('=====================================');
    console.log('Questo script creerà un database completo con dati realistici:');
    console.log('📹 16 telecamere di Trento con coordinate precise');
    console.log('📺 16 stream collegati 1:1 alle telecamere');  
    console.log('📋 80 eventi vari (incidenti + ingorghi)');
    console.log('🔗 Relazioni perfette Camera-Stream-Event\n');

    const startTime = Date.now();

    try {
        // ==================== STEP 1: PULIZIA ====================
        console.log('🧹 STEP 1/4: Pulizia database...');
        console.log('───────────────────────────────────────');
        await cleanDatabase();
        console.log('✅ Database pulito\n');

        // ==================== STEP 2: TELECAMERE ====================
        console.log('📹 STEP 2/4: Creazione telecamere realistiche...');
        console.log('──────────────────────────────────────────────────');
        await createRealisticCameras();
        console.log('✅ Telecamere create\n');

        // ==================== STEP 3: STREAM ====================
        console.log('📺 STEP 3/4: Creazione stream 1:1...');
        console.log('─────────────────────────────────────────');
        await createRealisticStreams();
        console.log('✅ Stream creati\n');

        // ==================== STEP 4: EVENTI ====================
        console.log('📋 STEP 4/4: Creazione eventi vari...');
        console.log('────────────────────────────────────────');
        await createRealisticEvents();
        console.log('✅ Eventi creati\n');

        // ==================== ANALISI FINALE ====================
        console.log('📊 ANALISI FINALE...');
        console.log('─────────────────────');
        
        await mongoose.connect(process.env.MONGODB_URI);
        
        const finalStats = {
            cameras: await mongoose.model('Camera').countDocuments(),
            streams: await mongoose.model('Stream').countDocuments(),
            events: await mongoose.model('Event').countDocuments(),
            publicEvents: await mongoose.model('Event').countDocuments({
                eventDate: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
                status: { $in: ["solved", "unsolved"] }
            })
        };

        await mongoose.connection.close();

        const elapsedTime = Math.round((Date.now() - startTime) / 1000);

        console.log('🎉 SETUP COMPLETATO CON SUCCESSO!');
        console.log('════════════════════════════════════');
        console.log(`⏱️  Tempo impiegato: ${elapsedTime} secondi`);
        console.log(`📹 Telecamere: ${finalStats.cameras}`);
        console.log(`📺 Stream: ${finalStats.streams}`);
        console.log(`📋 Eventi: ${finalStats.events}`);
        console.log(`🌍 Eventi pubblici (2h): ${finalStats.publicEvents}`);

        console.log('\n✅ IL DATABASE È PRONTO!');
        console.log('🗺️  La mappa dovrebbe mostrare eventi realistici');
        console.log('📱 Frontend dovrebbe funzionare perfettamente');
        console.log('🔄 Auto-refresh ogni 30 secondi attivo');

        console.log('\n🎯 PROSSIMI STEP:');
        console.log('1. Sostituisci gli schemi Event e Camera con quelli aggiornati');
        console.log('2. Aggiorna DetectionService con i nuovi ID telecamere'); 
        console.log('3. Sostituisci i file frontend (GeocodingUtils, EventsMap)');
        console.log('4. Testa la mappa su http://localhost:3000/map');

        console.log('\n📋 Per vedere gli ID delle telecamere create:');
        console.log('node scripts/get-camera-ids.js');

    } catch (error) {
        console.error('\n❌ ERRORE DURANTE IL SETUP:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Verifica connessione MongoDB');
        console.log('2. Controlla file .env');
        console.log('3. Esegui singoli script per identificare il problema');
    }
}

// Funzione per recovery parziale
async function recoverPartialSetup() {
    try {
        console.log('🔧 Analisi stato attuale database...');
        const analysis = await analyzeDatabase();
        
        console.log('🎯 Stato attuale:');
        console.log(`📹 Telecamere: ${analysis.summary.cameras}`);
        console.log(`📺 Stream: ${analysis.summary.streams}`);
        console.log(`📋 Eventi: ${analysis.summary.events}`);

        const missing = [];
        
        if (analysis.summary.cameras === 0) {
            missing.push('telecamere');
        }
        if (analysis.summary.streams === 0) {
            missing.push('stream');
        }
        if (analysis.summary.events === 0) {
            missing.push('eventi');
        }

        if (missing.length === 0) {
            console.log('✅ Database sembra completo!');
            return;
        }

        console.log(`⚠️  Mancano: ${missing.join(', ')}`);
        console.log('\n🔧 Suggerimenti recovery:');
        
        if (missing.includes('telecamere')) {
            console.log('📹 node scripts/create-realistic-cameras.js');
        }
        if (missing.includes('stream')) {
            console.log('📺 node scripts/create-realistic-streams.js');
        }
        if (missing.includes('eventi')) {
            console.log('📋 node scripts/create-realistic-events.js');
        }

    } catch (error) {
        console.error('❌ Errore analisi:', error);
    }
}

// Script per ottenere ID telecamere per DetectionService
async function getCameraIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const cameras = await mongoose.model('Camera').find({})
            .select('_id name location.address')
            .sort({ name: 1 });

        if (cameras.length === 0) {
            console.log('❌ Nessuna telecamera trovata!');
            return;
        }

        console.log('📹 ID Telecamere per DetectionService:');
        console.log('=====================================');
        console.log('// Copia questo array nel detectionservice.js');
        console.log('const CameraIds = [');
        
        cameras.forEach((camera, index) => {
            const isLast = index === cameras.length - 1;
            console.log(`    '${camera._id}'${isLast ? '' : ','} // ${camera.name} - ${camera.location.address}`);
        });
        
        console.log('];');
        console.log(`\n📊 Totale ID: ${cameras.length}`);

    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Esecuzione script con argomenti
if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'recover':
            recoverPartialSetup();
            break;
        case 'camera-ids':
            getCameraIds();
            break;
        case 'setup':
        default:
            setupCompleteDatabase();
            break;
    }
}

module.exports = { 
    setupCompleteDatabase, 
    recoverPartialSetup, 
    getCameraIds 
};