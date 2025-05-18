<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import 'leaflet/dist/leaflet.css';

// Riferimenti per elementi DOM e dati
const mapContainer = ref(null);
let map = null;
const events = ref([]);
const loading = ref(true);
const error = ref(null);
const markers = [];

// Coordinate del centro di Trento
const TRENTO_CENTER = [46.0667, 11.1167];
const DEFAULT_ZOOM = 13;

// Mappatura delle vie di Trento con coordinate (base iniziale - da espandere)
const TRENTO_ADDRESSES = {
  'Piazza Duomo': [46.0667, 11.1167],
  'Stazione Trento': [46.0719, 11.1203],
  'Piazza Fiera': [46.0659, 11.1240],
  'MUSE': [46.0612, 11.1142],
  'Piazza Dante': [46.0703, 11.1219],
  'Università di Trento': [46.0652, 11.1208],
  'Castello del Buonconsiglio': [46.0713, 11.1246],
  'Via San Marco': [46.0685, 11.1200],
  'Via Roma': [46.0670, 11.1199],
  'Via Belenzani': [46.0673, 11.1218],
  'Via Manci': [46.0681, 11.1211],
  'Via Verdi': [46.0640, 11.1190],
  'Piazza Venezia': [46.0682, 11.1151],
  'Corso 3 Novembre': [46.0649, 11.1168],
  'Via Calepina': [46.0662, 11.1233],
  'Via Oss Mazzurana': [46.0663, 11.1210]
};

// Funzione per ottenere coordinate da un indirizzo
const getCoordinates = (address) => {
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

// Funzione per recuperare gli eventi dal server
const fetchEvents = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const response = await fetch('/api/v1/public/events');
    
    if (!response.ok) {
      throw new Error('Errore nel caricamento degli eventi');
    }
    
    const data = await response.json();
    events.value = data;
    
    // Aggiorna i marker sulla mappa dopo il recupero dei dati
    if (map) {
      updateMarkers();
    }
  } catch (err) {
    console.error('Errore:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Funzione per aggiungere marker alla mappa
const updateMarkers = async () => {
  // Rimuovi i marker esistenti
  markers.forEach(marker => marker.remove());
  markers.length = 0;
  
  const L = await import('leaflet');
  
  // Crea marker per ogni evento
  events.value.forEach(event => {
    // Ottieni coordinate dall'indirizzo dell'evento
    const coords = getCoordinates(event.location?.address);
    
    // Crea icona personalizzata in base al tipo di evento
    const iconUrl = event.type === 'incidente' 
      ? '/markers/accident-marker.png' 
      : '/markers/traffic-marker.png';
    
    let icon;
    try {
      icon = L.icon({
        iconUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    } catch (e) {
      // Fallback all'icona predefinita in caso di errore
      console.warn('Errore nel caricamento dell\'icona, uso predefinita', e);
      icon = undefined;
    }
    
    // Crea marker
    const marker = L.marker(coords, { icon }).addTo(map);
    
    // Aggiungi popup con informazioni sull'evento
    marker.bindPopup(`
      <div class="event-popup">
        <h3>${event.title}</h3>
        <p>${event.description || ''}</p>
        <p><strong>Tipo:</strong> ${event.type === 'incidente' ? 'Incidente' : 'Ingorgo'}</p>
        <p><strong>Indirizzo:</strong> ${event.location?.address || 'N/A'}</p>
        <p><strong>Data:</strong> ${new Date(event.eventDate).toLocaleString('it-IT')}</p>
        <p><strong>Stato:</strong> ${
          event.status === 'solved' ? 'Risolto' : 
          event.status === 'pending' ? 'In corso' : 
          event.status === 'unsolved' ? 'Non risolto' : 
          event.status
        }</p>
      </div>
    `);
    
    // Salva riferimento per pulizia futura
    markers.push(marker);
  });
};

// Inizializza mappa e recupera eventi
onMounted(async () => {
  // Carica Leaflet dinamicamente
  const L = await import('leaflet');
  
  // Fix per le icone di Leaflet (opzionale)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
  });
  
  // Inizializza mappa
  setTimeout(() => {
    if (mapContainer.value) {
      map = L.map(mapContainer.value).setView(TRENTO_CENTER, DEFAULT_ZOOM);
      
      // Aggiungi layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Recupera eventi
      fetchEvents();
    }
  }, 100);
});

// Pulizia risorse quando il componente viene smontato
onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="map-page">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">Mappa Eventi</h1>
      <p class="text-center text-gray-600 mb-6">
        Visualizza gli eventi recenti a Trento
        <span v-if="events.length === 0 && !loading" class="italic">
          • Nessun evento nelle ultime 2 ore
        </span>
      </p>
      
      <!-- Loading State -->
      <div v-if="loading && events.length === 0" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-8">
        {{ error }}
        <button @click="fetchEvents" class="ml-2 text-blue-600 hover:underline">
          Riprova
        </button>
      </div>
      
      <!-- Mappa -->
      <div class="relative">
        <div ref="mapContainer" class="h-[600px] w-full rounded-xl shadow-md overflow-hidden"></div>
        
        <!-- Legenda -->
        <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md z-[1000]">
          <p class="text-sm font-semibold mb-2">Legenda:</p>
          <div class="flex items-center mb-1">
            <div class="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span class="text-sm">Incidente</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
            <span class="text-sm">Ingorgo</span>
          </div>
        </div>
        
        <!-- Bottone refresh -->
        <button 
          @click="fetchEvents" 
          class="absolute bottom-4 right-4 bg-white shadow-md rounded-full p-3 hover:bg-gray-50 transition-colors z-[1000]"
          :disabled="loading"
          title="Aggiorna dati"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-5 w-5 text-blue-600" 
            :class="{ 'animate-spin': loading }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <!-- Info panel -->
        <div 
          v-if="events.length === 0 && !loading" 
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm py-4 px-6 rounded-lg shadow-lg z-50 text-center"
        >
          <p class="text-gray-700">Non ci sono eventi attivi nelle ultime 2 ore</p>
          <p class="text-sm text-gray-500 mt-2">La mappa è comunque navigabile</p>
        </div>
      </div>
      
      <!-- Lista eventi sotto la mappa -->
      <div v-if="events.length > 0" class="mt-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Eventi recenti</h2>
        <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div 
            v-for="event in events" 
            :key="event._id"
            class="p-4 rounded-lg shadow-sm border"
            :class="{
              'bg-red-50 border-red-200': event.type === 'incidente',
              'bg-orange-50 border-orange-200': event.type === 'ingorgo'
            }"
          >
            <h3 class="font-bold text-gray-900 mb-1">{{ event.title }}</h3>
            <p class="text-sm text-gray-600 mb-2">{{ event.description || 'Nessuna descrizione' }}</p>
            <div class="flex justify-between text-sm">
              <span>{{ new Date(event.eventDate).toLocaleString('it-IT') }}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800': event.status === 'solved',
                  'bg-yellow-100 text-yellow-800': event.status === 'pending',
                  'bg-red-100 text-red-800': event.status === 'unsolved'
                }"
              >
                {{ 
                  event.status === 'solved' ? 'Risolto' : 
                  event.status === 'pending' ? 'In corso' : 
                  event.status === 'unsolved' ? 'Non risolto' : 
                  event.status 
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Stili per i popup */
.leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.event-popup h3 {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 16px;
}

.event-popup p {
  margin: 4px 0;
  font-size: 14px;
}
</style>