// scripts/create-realistic-events.js
const mongoose = require('mongoose');
const Camera = require('../app/models/camera');
const Event = require('../app/models/event');
require('dotenv').config();

const INCIDENT_TEMPLATES = [
    {
        titles: [
            "Tamponamento tra due auto",
            "Incidente stradale con feriti",
            "Scontro frontale",
            "Auto contro scooter",
            "Incidente in rotatoria",
            "Tamponamento a catena",
            "Auto ribaltata",
            "Scontro tra auto e bicicletta"
        ],
        descriptions: [
            "Incidente rilevato dal sistema di sorveglianza automatico",
            "Collisione tra veicoli, verificare necessità intervento sanitario",
            "Impatto significativo, possibili feriti",
            "Incidente in corso di valutazione",
            "Scontro rilevato, richiedere intervento forze dell'ordine",
            "Incidente con blocco del traffico",
            "Collisione con potenziali danni a persone",
            "Incidente stradale in zona trafficata"
        ]
    }
];

const TRAFFIC_TEMPLATES = [
    {
        titles: [
            "Ingorgo da lavori stradali",
            "Traffico intenso ora di punta",
            "Rallentamenti per evento",
            "Coda per semaforo guasto",
            "Traffico da manifestazione",
            "Rallentamenti zona centro",
            "Ingorgo da blocco stradale",
            "Traffico intenso zona università"
        ],
        descriptions: [
            "Rallentamenti segnalati dal sistema di monitoraggio traffico",
            "Congestione rilevata dai sensori comunali",
            "Traffico intenso in corso",
            "Rallentamenti superiori alla media",
            "Situazione traffico sotto controllo",
            "Monitoraggio traffico attivo",
            "Flusso veicolare rallentato",
            "Congestione temporanea"
        ]
    }
];

const TRAFFIC_HOTSPOTS = [
    { name: "Centro Storico", lat: 46.0670, lng: 11.1200 },
    { name: "Zona Stazione", lat: 46.0715, lng: 11.1190 },
    { name: "Zona Università", lat: 46.0650, lng: 11.1230 },
    { name: "Via del Brennero", lat: 46.0750, lng: 11.1200 },
    { name: "Rotatoria Sud", lat: 46.0580, lng: 11.1150 },
    { name: "Ponte Adige", lat: 46.0690, lng: 11.1180 },
    { name: "Zona Industriale", lat: 46.0680, lng: 11.1150 },
    { name: "Circumvallazione", lat: 46.0720, lng: 11.1300 },
    { name: "Via Milano", lat: 46.0580, lng: 11.1150 },
    { name: "Zona Ospedale", lat: 46.0620, lng: 11.1280 }
];

function generateRealisticTimestamp() {
    const now = new Date();
    const scenarios = [
        { weight: 15, hours: () => Math.random() * 2 },
        { weight: 25, hours: () => 2 + Math.random() * 22 },
        { weight: 35, hours: () => 24 + Math.random() * 144 },
        { weight: 25, hours: () => 168 + Math.random() * 552 }
    ];
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const scenario of scenarios) {
        cumulative += scenario.weight;
        if (random <= cumulative) {
            const hoursAgo = scenario.hours();
            const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
            const hour = timestamp.getHours();
            if (hour < 6 || hour > 22) {
                if (Math.random() < 0.3) {
                    timestamp.setHours(7 + Math.floor(Math.random() * 12));
                }
            }
            return timestamp;
        }
    }
    return new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
}

function generateIncidentEvent(camera) {
    const template = INCIDENT_TEMPLATES[0];
    const title = template.titles[Math.floor(Math.random() * template.titles.length)];
    const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
    const statuses = ['pending', 'solved', 'unsolved', 'false_alarm'];
    const statusWeights = [10, 60, 25, 5];
    const severities = ['bassa', 'media', 'alta'];
    const severityWeights = [20, 60, 20];
    const status = weightedRandom(statuses, statusWeights);
    const severity = weightedRandom(severities, severityWeights);
    const eventDate = generateRealisticTimestamp();
    return {
        type: "incidente",
        title: title,
        description: description,
        eventDate: eventDate,
        createdAt: eventDate,
        updatedAt: eventDate,
        location: {
            address: camera.location.address
        },
        status: status,
        severity: severity,
        cameraId: camera._id,
        confirmed: false,
        videoUrl: `https://storage.ailert.com/videos/${camera._id}_${eventDate.getTime()}.mp4`
    };
}

function generateTrafficEvent() {
    const template = TRAFFIC_TEMPLATES[0];
    const title = template.titles[Math.floor(Math.random() * template.titles.length)];
    const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
    const hotspot = TRAFFIC_HOTSPOTS[Math.floor(Math.random() * TRAFFIC_HOTSPOTS.length)];
    const lat = hotspot.lat + (Math.random() - 0.5) * 0.005;
    const lng = hotspot.lng + (Math.random() - 0.5) * 0.005;
    const statuses = ['solved', 'unsolved', 'pending'];
    const statusWeights = [70, 20, 10];
    const severities = ['bassa', 'media', 'alta'];
    const severityWeights = [50, 40, 10];
    const status = weightedRandom(statuses, statusWeights);
    const severity = weightedRandom(severities, severityWeights);
    const eventDate = generateRealisticTimestamp();
    return {
        type: "ingorgo",
        title: title,
        description: description,
        eventDate: eventDate,
        createdAt: eventDate,
        updatedAt: eventDate,
        location: {
            address: hotspot.name,
            coordinates: {
                lat: Number(lat.toFixed(6)),
                lng: Number(lng.toFixed(6))
            }
        },
        status: status,
        severity: severity
    };
}

function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    return items[items.length - 1];
}

async function createRealisticEvents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const existingCameras = await Camera.countDocuments();
        const existingEvents = await Event.countDocuments();

        if (existingCameras === 0) {
            return;
        }

        const cameras = await Camera.find({});
        const config = {
            totalEvents: 80,
            incidentRatio: 0.4,
            recentEventsRatio: 0.15
        };

        const incidentsToCreate = Math.floor(config.totalEvents * config.incidentRatio);
        const trafficToCreate = config.totalEvents - incidentsToCreate;

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < incidentsToCreate; i++) {
            try {
                const randomCamera = cameras[Math.floor(Math.random() * cameras.length)];
                const eventData = generateIncidentEvent(randomCamera);
                await Event.create(eventData);
                successCount++;
            } catch (error) {
                errorCount++;
            }
        }

        for (let i = 0; i < trafficToCreate; i++) {
            try {
                const eventData = generateTrafficEvent();
                await Event.create(eventData);
                successCount++;
            } catch (error) {
                errorCount++;
            }
        }
    } catch (error) {
        console.error('Errore durante la creazione:', error);
    } finally {
        await mongoose.connection.close();
    }
}

function getTimeInfo(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 2) {
        return `${Math.round(diffHours * 60)} min fa`;
    } else if (diffHours < 24) {
        return `${Math.round(diffHours)} ore fa`;
    } else {
        return `${Math.round(diffHours / 24)} giorni fa`;
    }
}

async function getEventStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const totalEvents = await Event.countDocuments();
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const publicEvents = await Event.countDocuments({
            eventDate: { $gte: twoHoursAgo },
            status: { $in: ["solved", "unsolved"] }
        });

        const recentSamples = await Event.find({
            eventDate: { $gte: twoHoursAgo },
            status: { $in: ["solved", "unsolved"] }
        }).limit(5).sort({ eventDate: -1 });

    } catch (error) {
        console.error('Errore:', error);
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    const command = process.argv[2];
    switch (command) {
        case 'stats':
            getEventStats();
            break;
        case 'create':
        default:
            createRealisticEvents();
            break;
    }
}

module.exports = { createRealisticEvents, getEventStats };
