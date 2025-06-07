const Event = require("../models/event");
const Stream = require("../models/stream");
const Camera = require("../models/camera");



const CameraIds = [
    '68443c5d2d56f26e2678b173', // CAM-001 Piazza Duomo - Piazza Duomo
    '68443c5d2d56f26e2678b175', // CAM-002 Via San Marco - Via San Marco
    '68443c5e2d56f26e2678b178', // CAM-003 Via Roma Centro - Via Roma
    '68443c5e2d56f26e2678b17a', // CAM-004 Corso 3 Novembre - Corso 3 Novembre
    '68443c5e2d56f26e2678b17c', // CAM-005 Via Belenzani - Via Belenzani
    '68443c5e2d56f26e2678b17e', // CAM-006 Ponte San Lorenzo - Ponte San Lorenzo
    '68443c5e2d56f26e2678b180', // CAM-007 Via Verdi - Via Verdi
    '68443c5e2d56f26e2678b182', // CAM-008 Via Calepina Università - Via Calepina
    '68443c5e2d56f26e2678b184', // CAM-009 Via Oss Mazzurana - Via Oss Mazzurana
    '68443c5e2d56f26e2678b186', // CAM-010 Piazza Fiera - Piazza Fiera
    '68443c5e2d56f26e2678b188', // CAM-011 Via Brennero Nord - Via Brennero
    '68443c5e2d56f26e2678b18a', // CAM-012 Via Milano Sud - Via Milano
    '68443c5e2d56f26e2678b18c', // CAM-013 Via Venezia Industriale - Via Venezia
    '68443c5e2d56f26e2678b18e', // CAM-014 Rotatoria Spini Gardolo - Rotatoria Spini di Gardolo
    '68443c5e2d56f26e2678b190', // CAM-015 Via del Ponte - Via del Ponte
    '68443c5e2d56f26e2678b192', // CAM-016 Via Segantini Ospedale - Via Segantini
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
                const streamId = await Stream.findOne({ cameraId: camera }).select('_id').lean();
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
        const randomAddress = await Camera.findOne({ _id: randomCameraId }).select('location.address').lean();

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
