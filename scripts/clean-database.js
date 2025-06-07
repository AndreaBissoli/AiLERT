// scripts/clean-database.js
const mongoose = require('mongoose');
const Camera = require('../app/models/camera');
const Stream = require('../app/models/stream');
const Event = require('../app/models/event');
require('dotenv').config();

async function cleanDatabase() {
    try {
        console.log('Connessione a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connesso a MongoDB');

        // Statistiche prima della pulizia
        const beforeStats = {
            cameras: await Camera.countDocuments(),
            streams: await Stream.countDocuments(),
            events: await Event.countDocuments()
        };

        console.log('\nStato database PRIMA della pulizia:');
        console.log(`   Telecamere: ${beforeStats.cameras}`);
        console.log(`   Stream: ${beforeStats.streams}`);
        console.log(`   Eventi: ${beforeStats.events}`);
        console.log(`   Totale documenti: ${beforeStats.cameras + beforeStats.streams + beforeStats.events}`);

        if (beforeStats.cameras + beforeStats.streams + beforeStats.events === 0) {
            console.log('\nDatabase già vuoto!');
            return;
        }

        // Conferma sicurezza
        console.log('\nATTENZIONE: Questa operazione cancellerà TUTTI i dati!');
        console.log('   Tutte le telecamere');
        console.log('   Tutti gli stream');  
        console.log('   Tutti gli eventi');
        console.log('\nProcedendo con la cancellazione in 3 secondi...');
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Pulizia sistematica
        console.log('\nPulizia in corso...');

        // 1. Cancella eventi (per primi, hanno references)
        console.log('Cancellazione eventi...');
        const eventsResult = await Event.deleteMany({});
        console.log(`   Cancellati ${eventsResult.deletedCount} eventi`);

        // 2. Cancella stream (hanno reference a camera)
        console.log('Cancellazione stream...');
        const streamsResult = await Stream.deleteMany({});
        console.log(`   Cancellati ${streamsResult.deletedCount} stream`);

        // 3. Cancella telecamere (per ultimi)
        console.log('Cancellazione telecamere...');
        const camerasResult = await Camera.deleteMany({});
        console.log(`   Cancellate ${camerasResult.deletedCount} telecamere`);

        // Verifica finale
        const afterStats = {
            cameras: await Camera.countDocuments(),
            streams: await Stream.countDocuments(),
            events: await Event.countDocuments()
        };

        console.log('\nStato database DOPO la pulizia:');
        console.log(`   Telecamere: ${afterStats.cameras}`);
        console.log(`   Stream: ${afterStats.streams}`);
        console.log(`   Eventi: ${afterStats.events}`);

        if (afterStats.cameras === 0 && afterStats.streams === 0 && afterStats.events === 0) {
            console.log('\n Database completamente pulito!');
            console.log(' Pronto per la ripopolazione con dati realistici');
        } else {
            console.log('\n  Alcuni documenti non sono stati cancellati');
        }

        // Riassunto operazione
        console.log('\nRiassunto operazione:');
        console.log(`   Eventi cancellati: ${eventsResult.deletedCount}`);
        console.log(`   Stream cancellati: ${streamsResult.deletedCount}`);
        console.log(`   Telecamere cancellate: ${camerasResult.deletedCount}`);
        console.log(`   Totale cancellati: ${eventsResult.deletedCount + streamsResult.deletedCount + camerasResult.deletedCount}`);

    } catch (error) {
        console.error('Errore durante la pulizia:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n Connessione chiusa');
    }
}

// Funzione per verificare stato database
async function checkDatabaseStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const stats = {
            cameras: await Camera.countDocuments(),
            streams: await Stream.countDocuments(),
            events: await Event.countDocuments()
        };

        console.log('Stato attuale database:');
        console.log(`   Telecamere: ${stats.cameras}`);
        console.log(`   Stream: ${stats.streams}`);
        console.log(`   Eventi: ${stats.events}`);
        console.log(`   Totale: ${stats.cameras + stats.streams + stats.events}`);

        if (stats.cameras + stats.streams + stats.events === 0) {
            console.log('Database vuoto - pronto per popolazione');
        } else {
            console.log('Database contiene dati');
        }

    } catch (error) {
        console.error('Errore:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Esecuzione script con argomenti
if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'check':
            checkDatabaseStatus();
            break;
        case 'clean':
        default:
            cleanDatabase();
            break;
    }
}

module.exports = { cleanDatabase, checkDatabaseStatus };