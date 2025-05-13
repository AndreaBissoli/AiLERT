const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        address: {
            type: String,
            required: true
        },
    },
    installationDate: {
        type: Date,
        default: Date.now
    },
    lastMaintenance: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    ipAddress: {
        type: String
    },
    streamUrl: {
        type: String
    },
    modelInfo: {
        brand: String,
        model: String
    },
});

const Camera = mongoose.model('Camera', cameraSchema);

module.exports = Camera;