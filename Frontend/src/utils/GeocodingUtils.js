export const TRENTO_CENTER = [46.0667, 11.1167];

// Mappatura delle vie di Trento con coordinate
export const TRENTO_ADDRESSES = {
    "Piazza Duomo": [46.0667, 11.1167],
    "Stazione Trento": [46.0719, 11.1203],
    "Piazza Fiera": [46.0659, 11.124],
    MUSE: [46.0612, 11.1142],
    "Piazza Dante": [46.0703, 11.1219],
    "Università di Trento": [46.0652, 11.1208],
    "Castello del Buonconsiglio": [46.0713, 11.1246],
    "Via San Marco": [46.0685, 11.12],
    "Via Roma": [46.067, 11.1199],
    "Via Belenzani": [46.0673, 11.1218],
    "Via Manci": [46.0681, 11.1211],
    "Via Verdi": [46.064, 11.119],
    "Piazza Venezia": [46.0682, 11.1151],
    "Corso 3 Novembre": [46.0649, 11.1168],
    "Via Calepina": [46.0662, 11.1233],
    "Via Oss Mazzurana": [46.0663, 11.121],
};

// Converte un indirizzo testuale in coordinate geografiche
export const getCoordinates = address => {
    if (!address) return TRENTO_CENTER;

    // Cerca corrispondenze esatte
    if (TRENTO_ADDRESSES[address]) {
        return TRENTO_ADDRESSES[address];
    }

    // Cerca corrispondenze parziali
    for (const [key, value] of Object.entries(TRENTO_ADDRESSES)) {
        if (address.includes(key)) {
            return value;
        }
    }

    // Genera coordinate casuali vicino al centro di Trento come fallback
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;
    return [TRENTO_CENTER[0] + latOffset, TRENTO_CENTER[1] + lngOffset];
};

// Ottiene coordinate per un evento in base al suo tipo e attributi
export const getEventCoordinates = event => {
    // Per ora utilizziamo direttamente l'indirizzo dell'evento
    // In futuro potremmo implementare una logica più complessa
    // che consideri il cameraId per gli incidenti
    return getCoordinates(event.location?.address);
};
