const mongoose = require('mongoose');
const Event = require('../app/models/event');
require('dotenv').config();

async function clearAndInsertTestData() {
    try {
        // 1. Connetti al database
        console.log('Connessione al database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connesso al database MongoDB Atlas');
        
        // 2. Cancella tutti gli eventi esistenti
        console.log('Cancellazione eventi esistenti...');
        const deleteResult = await Event.deleteMany({});
        console.log(`Cancellati ${deleteResult.deletedCount} eventi`);
        
        // 3. Inserisci nuovi dati di test
        console.log('Inserimento dati di test...');
        const testEvents = [
            {
                type: 'incidente',
                title: 'Incidente su Via Roma',
                description: 'Lieve tamponamento risolto',
                eventDate: new Date(), // Ora attuale
                location: {
                    address: 'Via Roma 45, Trento'
                },
                status: 'solved', // SOLVED - apparirà nell'API pubblica
                severity: 'bassa'
            },
            {
                type: 'ingorgo',
                title: 'Traffico intenso su Via Manci',
                description: 'Blocco temporaneo in centro città',
                eventDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minuti fa
                location: {
                    address: 'Via Manci, Trento'
                },
                status: 'unsolved', // UNSOLVED - apparirà nell'API pubblica
                severity: 'media'
            },
            {
                type: 'incidente',
                title: 'Incidente minore Piazza Duomo',
                description: 'Tamponamento senza feriti',
                eventDate: new Date(Date.now() - 45 * 60 * 1000), // 45 minuti fa
                location: {
                    address: 'Piazza Duomo, Trento'
                },
                status: 'solved', // SOLVED - apparirà nell'API pubblica
                severity: 'bassa'
            },
            {
                type: 'incidente',
                title: 'Evento vecchio (non apparirà)',
                description: 'Evento di 3 ore fa',
                eventDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 ore fa
                location: {
                    address: 'Via Brennero, Trento'
                },
                status: 'solved',
                severity: 'alta'
            },
            {
                type: 'ingorgo',
                title: 'Evento pending (non apparirà)',
                description: 'Questo non apparirà perché è pending',
                eventDate: new Date(),
                location: {
                    address: 'Via Test, Trento'
                },
                status: 'pending', // PENDING - NON apparirà nell'API pubblica
                severity: 'media'
            }
        ];
        
        const insertResult = await Event.insertMany(testEvents);
        console.log(`Inseriti ${insertResult.length} eventi di test`);
        
        // 4. Verifica cosa restituisce l'API pubblica
        console.log('\nVerifica API pubblica...');
        const publicEvents = await Event.findPublic();
        console.log(`Eventi pubblici (ultime 2 ore, solved/unsolved): ${publicEvents.length}`);
        
        publicEvents.forEach((event, index) => {
            console.log(`  ${index + 1}. ${event.title} (${event.status}) - ${event.type}`);
        });
        
        // 5. Disconnetti
        await mongoose.disconnect();
        console.log('Operazione completata!');
        
    } catch (error) {
        console.error('Errore:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Esegui lo script
clearAndInsertTestData();