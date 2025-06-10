const Event = require("../models/event");
const Stream = require("../models/stream");
const Camera = require("../models/camera");
const { exec } = require("child_process");

const CameraIds = [
    "68443c5e2d56f26e2678b182",
    "68443c5e2d56f26e2678b17e",
    "68443c5e2d56f26e2678b17a",
    "68443c5e2d56f26e2678b180",
    "68443c5e2d56f26e2678b188",
    "68443c5e2d56f26e2678b18a",
    "684808368431b5c72ab813d5", // PIAZZA DUOMO
];

class DetectionService {
    constructor(io) {
        this.io = io;
        this.isRunning = false;
        this.detectionInterval = null;
        this.createEventsInterval = null;
        this.rightawaytimeout = null;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log("Detection service started");

        this.detectionInterval = setInterval(() => {
            this.runDetection();
        }, 30000);

        exec("node ./scripts/clean-events-only.js", (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing clean-events-only script: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
                return;
            }
            console.log(`Script stdout: ${stdout}`);
        });
        exec("node ./scripts/create-realistic-events.js", (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing create-realistic-events script: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
                return;
            }
            console.log(`Script stdout: ${stdout}`);
        });
        // Create a separate interval for creating events every two hours,
        // such that there is always something to show
        this.createEventsInterval = setInterval(() => {
            exec("node ./scripts/clean-events-only.js", (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing clean-events-only script: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`Script stderr: ${stderr}`);
                    return;
                }
                console.log(`Script stdout: ${stdout}`);
            });
            exec("node ./scripts/create-realistic-events.js", (error, stdout, stderr) => {
                if (error) {
                    console.error(
                        `Error executing create-realistic-events script: ${error.message}`
                    );
                    return;
                }
                if (stderr) {
                    console.error(`Script stderr: ${stderr}`);
                    return;
                }
                console.log(`Script stdout: ${stdout}`);
            });
        }, 600000); // 10 minutes
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
