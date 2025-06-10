const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["incidente", "ingorgo"],
        required: true,
    },
    title: {
        type: String,
        required: true,
        maxlength: 100,
    },
    description: {
        type: String,
        required: false,
        maxlength: 500,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    eventDate: {
        type: Date,
        required: true,
    },
    location: {
        address: {
            type: String,
            required: true,
        },
        coordinates: {
            lat: {
                type: Number,
                required: false,
            },
            lng: {
                type: Number,
                required: false,
            },
        },
    },
    status: {
        type: String,
        enum: ["pending", "solved", "unsolved", "false_alarm"],
        required: true,
    },
    cameraId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Camera",
        required: false,
    },
    videoUrl: {
        type: String, // URL del video registrato
        required: false,
    },
    confirmed: {
        type: Boolean,
        default: false, // confermato da sorvegliante
    },
    confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sorvegliante",
        required: function () {
            return this.confirmed;
        }, // solo se è stato confermato
    },
    notifiedServices: [
        {
            service: {
                type: String,
                enum: [
                    "polizia",
                    "carabinieri",
                    "vigili_del_fuoco",
                    "ambulanza",
                    "protezione_civile",
                ],
            },
            notifiedAt: {
                type: Date,
                default: Date.now,
            },
            responseTime: {
                type: Number, // in minuti
                required: false,
            },
        },
    ],
    severity: {
        type: String,
        enum: ["bassa", "media", "alta"],
        required: false,
    },
});

// Middleware per aggiornare updatedAt prima di salvare
eventSchema.pre("save", async function (next) {
    // Solo per incidenti con cameraId ma senza coordinates
    if (this.type === "incidente" && this.cameraId && !this.location.coordinates?.lat) {
        try {
            const Camera = mongoose.model("Camera");
            const camera = await Camera.findById(this.cameraId).select("location.coordinates");

            if (camera && camera.location && camera.location.coordinates) {
                this.location.coordinates = {
                    lat: camera.location.coordinates.lat,
                    lng: camera.location.coordinates.lng,
                };
                // console.log(`Auto-populated coordinates for event ${this._id} from camera ${this.cameraId}`);
            }
        } catch (error) {
            console.error("Error auto-populating coordinates:", error);
        }
    }
    next();
});

// Metodo per ottenere la versione pubblica
eventSchema.methods.toPublicJSON = function () {
    return {
        _id: this._id,
        type: this.type,
        title: this.title,
        description: this.description,
        eventDate: this.eventDate,
        location: this.location,
        status: this.status,
        severity: this.severity,
        cameraId: this.cameraId,
    };
};

// Metodo statico per query pubbliche
eventSchema.statics.findPublic = function (filters = {}) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const now = new Date(); // Momento attuale

    return this.find({
        eventDate: {
            $gte: twoHoursAgo, // Eventi non più vecchi di 2 ore
            $lte: now, // Eventi non futuri (massimo ora)
        },
        status: { $in: ["solved", "unsolved"] },
        ...filters,
    })
        .select("title type eventDate location status severity description cameraId")
        .sort({ eventDate: -1 });
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
