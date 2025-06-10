// scripts/get-camera-ids.js
const mongoose = require("mongoose");
const Camera = require("../app/models/camera");
require("dotenv").config();

async function getCameraIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const cameras = await Camera.find({}).select("_id name location.address").sort({ name: 1 });

        if (cameras.length === 0) {
            console.log("Nessuna telecamera trovata nel database.");
            return;
        }

        // Array per DetectionService
        console.log("// Sostituisci questo array nel file app/detection/detectionservice.js");
        console.log("const CameraIds = [");
        cameras.forEach((camera, index) => {
            const isLast = index === cameras.length - 1;
            const comment = `${camera.name} - ${camera.location.address}`;
            console.log(`    '${camera._id}'${isLast ? "" : ","} // ${comment}`);
        });
        console.log("];");
        console.log(`\nTotale telecamere: ${cameras.length}`);
    } catch (error) {
        console.error("Errore:", error);
    } finally {
        await mongoose.connection.close();
    }
}

async function validateCameraIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const cameras = await Camera.find({}).select("_id name location.coordinates");

        let validCameras = 0;
        let invalidCameras = 0;

        cameras.forEach(camera => {
            const hasCoords =
                camera.location?.coordinates?.lat && camera.location?.coordinates?.lng;
            if (!hasCoords) {
                invalidCameras++;
            } else {
                validCameras++;
            }
        });

        console.log(`Telecamere valide: ${validCameras}`);
        console.log(`Telecamere con problemi: ${invalidCameras}`);
    } catch (error) {
        console.error("Errore:", error);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    const command = process.argv[2];
    switch (command) {
        case "validate":
            validateCameraIds();
            break;
        case "get":
        default:
            getCameraIds();
            break;
    }
}

module.exports = { getCameraIds, validateCameraIds };
