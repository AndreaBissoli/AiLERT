const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['incidente', 'ingorgo'], 
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
    },
    status:  {
        type: String,
        enum: ['pending', 'solved', 'unsolved', 'false_alarm'],
        //default: 'pending',
        required: true,
    },
    cameraId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Camera', // Questo ID fa riferimento a un documento nella collection chiamata Camera, non definitivo
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
        ref: 'Sorvegliante', // non definitivo
        required: function() { return this.confirmed; } // solo se è stato confermato
    },
    notifiedServices: [{
        service: {
            type: String,
            enum: ['polizia', 'carabinieri', 'vigili_del_fuoco', 'ambulanza', 'protezione_civile'],
        },
        notifiedAt: {
            type: Date,
            default: Date.now
        },
        responseTime: {
            type: Number, // in minuti
            required: false
        }
    }],
    severity: {
        type: String,
        enum: ['bassa', 'media', 'alta'],
        required: false,
    },
});

// Metodo per ottenere la versione pubblica
eventSchema.methods.toPublicJSON = function() {
    return {
        _id: this._id,
        type: this.type,
        title: this.title,
        description: this.description,
        eventDate: this.eventDate,
        location: this.location,
        status: this.status,
        severity: this.severity
    };
};

// Metodo statico per query pubbliche
eventSchema.statics.findPublic = function(filters = {}) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    return this.find({
        eventDate: { $gte: twoHoursAgo },
        status: { $in: ['solved', 'unsolved'] },
        ...filters
    })
    .select('title type eventDate location status severity description')
    .sort({ eventDate: -1 });
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;