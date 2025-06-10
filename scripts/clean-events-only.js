// scripts/clean-events-only.js
const mongoose = require("mongoose");
const Event = require("../app/models/event");
require("dotenv").config();

async function cleanEventsOnly() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const beforeCount = await Event.countDocuments();
        console.log(`Eventi da cancellare: ${beforeCount}`);

        if (beforeCount > 0) {
            const result = await Event.deleteMany({});
            console.log(`Cancellati: ${result.deletedCount} eventi`);
        }

        const afterCount = await Event.countDocuments();
        console.log(`Eventi rimanenti: ${afterCount}`);
    } catch (error) {
        console.error("Errore:", error.message);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    cleanEventsOnly();
}

module.exports = { cleanEventsOnly };
