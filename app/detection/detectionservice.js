const Event = require("../models/event");
const Stream = require("../models/stream");
const Camera = require("../models/camera");

const CameraIds = [
    "68266cd1683978f9108a7393",
    "68266da2683978f9108a7395",
    "68266da2683978f9108a7396",
    "68266da2683978f9108a7397",
    "682880cf683978f9108a739b",
    "682880cf683978f9108a739c",
    "682880cf683978f9108a739d",
    "682880cf683978f9108a739e",
    "682880cf683978f9108a739f",
    "682880cf683978f9108a73a0",
    "682880cf683978f9108a73a1",
    "682880cf683978f9108a73a2",
    "682880cf683978f9108a73a3",
    "682880cf683978f9108a73a4",
    "60c72b2f9b1e8c001c8e4d5a",
    "60c72b2f9b1e8c001c8e4d5a",
    "60c72b2f9b1e8c001c8e4d5a",
];

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
                const notification = detected.toJSON();
                const camera = notification.cameraId;
                // Get the stream id from the camera ID, making a connection to the database
                const streamId = await Stream.findOne({ cameraId: camera }).select("_id").lean();
                notification.streamId = streamId ? streamId._id : null;
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
        const randomCameraId = CameraIds[Math.floor(Math.random() * CameraIds.length)];
        const randomAddress = await Camera.findOne({ _id: randomCameraId })
            .select("location.address")
            .lean();

        return new Event({
            type: "incidente",
            title: "Test Event",
            description: "This is a test event for detection service.",
            createdAt: new Date(),
            updatedAt: new Date(),
            eventDate: new Date(),
            location: {
                address: randomAddress ? randomAddress.location.address : "Unknown Location",
            },
            status: "unsolved",
            cameraId: randomCameraId,
            videoUrl: null,
            confirmed: false,
            confirmedBy: null,
            notifiedServices: [],
            severity: "media",
        });
    }
}

module.exports = DetectionService;
