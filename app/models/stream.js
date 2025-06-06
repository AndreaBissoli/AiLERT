const mongoose = require("mongoose");

const streamSchema = new mongoose.Schema({
    cameraId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Camera", // Riferito al modello Camera
        required: true,
    },
    streamKey: {
        type: String,
        required: true,
        unique: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
    streamUrl: {
        type: String,
        required: true,
    },
    streamType: {
        type: String,
        enum: ["rtsp", "hls", "webrtc"],
        default: "rtsp", //tipo usato per le telecamere a Trento
    },
    viewCount: {
        type: Number,
        default: 0,
    },
    lastAccessed: {
        type: Date,
    },
});

const Stream = mongoose.model("Stream", streamSchema);

module.exports = Stream;
