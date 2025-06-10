// scripts/clean-orphan-streams.js
const mongoose = require("mongoose");
const Stream = require("../app/models/stream");
const Camera = require("../app/models/camera");
require("dotenv").config();

async function cleanOrphanStreams() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const orphanStreams = await Stream.aggregate([
            {
                $lookup: {
                    from: "cameras",
                    localField: "cameraId",
                    foreignField: "_id",
                    as: "camera",
                },
            },
            { $match: { camera: { $size: 0 } } },
        ]);

        console.log(`Stream orfani trovati: ${orphanStreams.length}`);

        if (orphanStreams.length > 0) {
            const orphanIds = orphanStreams.map(s => s._id);
            const result = await Stream.deleteMany({ _id: { $in: orphanIds } });
            console.log(`Stream orfani cancellati: ${result.deletedCount}`);
        }

        const finalCount = await Stream.countDocuments();
        console.log(`Stream rimanenti: ${finalCount}`);
    } catch (error) {
        console.error("Errore:", error.message);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    cleanOrphanStreams();
}

module.exports = { cleanOrphanStreams };
