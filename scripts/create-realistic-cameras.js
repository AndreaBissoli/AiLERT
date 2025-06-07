// scripts/create-realistic-cameras.js
const mongoose = require('mongoose');
const Camera = require('../app/models/camera');
require('dotenv').config();

const REALISTIC_TRENTO_CAMERAS = [
    // ... (array identico a prima)
    // (Qui incolla la lista delle telecamere come da tuo script!)
];

async function createRealisticCameras() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const existingCameras = await Camera.countDocuments();
        if (existingCameras > 0) {
            return;
        }

        let successCount = 0;

        for (const cameraData of REALISTIC_TRENTO_CAMERAS) {
            try {
                const installationDate = new Date();
                installationDate.setMonth(installationDate.getMonth() - Math.floor(Math.random() * 24));
                const cameraToCreate = {
                    ...cameraData,
                    installationDate,
                    lastMaintenance: new Date(installationDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000)
                };
                await Camera.create(cameraToCreate);
                successCount++;
            } catch (error) {
                // Silenzio su errori singoli
            }
        }

        const totalCameras = await Camera.countDocuments();
        console.log(`Telecamere create con successo: ${successCount}. Totale telecamere nel database: ${totalCameras}`);
    } catch (error) {
        console.error('Errore durante la creazione:', error);
    } finally {
        await mongoose.connection.close();
    }
}

async function listCameras() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const cameras = await Camera.find({}).sort({ name: 1 });
        console.log(`Telecamere nel database: ${cameras.length}`);
        cameras.forEach((camera, index) => {
            console.log(`${index + 1}. ${camera.name}`);
        });
    } catch (error) {
        console.error('Errore:', error);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    const command = process.argv[2];
    switch (command) {
        case 'list':
            listCameras();
            break;
        case 'create':
        default:
            createRealisticCameras();
            break;
    }
}

module.exports = { createRealisticCameras, listCameras, REALISTIC_TRENTO_CAMERAS };
