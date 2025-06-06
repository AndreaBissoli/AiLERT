const Event = require("../models/event");

class DetectionService {
    constructor(io) {
        this.io = io;
        this.isRunning = false;
        this.detectionInterval = null;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log("Detection service started");

        this.detectionInterval = setInterval(() => {
            this.runDetection();
        }, 7000);
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        console.log("Detection service stopped");
    }

    async runDetection() {
        try {
            console.log("Running detection...");

            const detected = await this.performDetection();

            if (detected) {
                const notification = detected.toPublicJSON();
                // TODO: Save the detected event to the database
                this.io.emit("notification", notification);
                console.log("Detection notification sent:", notification);
            }
        } catch (error) {
            console.error("Detection error:", error);
        }
    }

    async performDetection() {
        // TODO: Implement actual detection logic here
        await new Promise(resolve => setTimeout(resolve, 1000));

        return new Event({
            type: "incidente",
            title: "Test Event",
            description: "This is a test event for detection service.",
            createdAt: new Date(),
            updatedAt: new Date(),
            eventDate: new Date(),
            location: {
                address: "Via Verdi, 123 Trento",
            },
            status: "unsolved",
            cameraId: null,
            videoUrl: null,
            confirmed: false,
            confirmedBy: null,
            notifiedServices: [],
            severity: "media",
        });
    }
}

module.exports = DetectionService;
