<!-- src/components/map/EventsMap.vue -->
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { getEventCoordinates, TRENTO_CENTER } from '../../utils/GeocodingUtils';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  events: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['refresh']);

const mapContainer = ref(null);
let map = null;
const markers = [];

const DEFAULT_ZOOM = 13;

// Inizializza mappa Leaflet
const initMap = async () => {
  try {
    const L = await import('leaflet');
    
    // Fix per le icone di Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
    });
    
    // Inizializza mappa
    if (mapContainer.value && !map) {
      map = L.map(mapContainer.value).setView(TRENTO_CENTER, DEFAULT_ZOOM);
      
      // Aggiungi layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Errore nell\'inizializzazione della mappa:', error);
    return false;
  }
};

// Aggiungi marker sulla mappa per ogni evento
const updateMarkers = async () => {
  if (!map) return;
  
  try {
    // Rimuovi i marker esistenti
    markers.forEach(marker => marker.remove());
    markers.length = 0;
    
    const L = await import('leaflet');
    
    // Crea marker per ogni evento
    props.events.forEach(event => {
      // Ottieni coordinate dall'evento
      const coords = getEventCoordinates(event);
      
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
  } catch (error) {
    console.error('Errore nell\'aggiornamento dei marker:', error);
  }
};

// Monitora cambiamenti negli eventi per aggiornare i marker
watch(() => props.events, () => {
  if (map) {
    updateMarkers();
  }
}, { deep: true });

// Inizializza mappa al mount del componente
onMounted(async () => {
  // Piccolo ritardo per assicurarsi che il container sia effettivamente renderizzato
  setTimeout(async () => {
    const initialized = await initMap();
    if (initialized && props.events.length > 0) {
      updateMarkers();
    }
  }, 100);
});

// Pulizia risorse
onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

// Metodo per aggiornare i dati
const refreshData = () => {
  emit('refresh');
};
</script>

<template>
  <div class="map-wrapper relative z-0">
    <div ref="mapContainer" class="h-[600px] w-full rounded-xl shadow-md overflow-hidden"></div>
    
    <!-- Legenda -->
    <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md z-10">
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
      @click="refreshData" 
      class="absolute bottom-4 right-4 bg-white shadow-md rounded-full p-3 hover:bg-gray-50 transition-colors z-10"
      :disabled="props.isLoading"
      title="Aggiorna dati"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        class="h-5 w-5 text-blue-600" 
        :class="{ 'animate-spin': props.isLoading }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
    
    <!-- Info panel -->
    <div 
      v-if="props.events.length === 0 && !props.isLoading" 
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm py-4 px-6 rounded-lg shadow-lg z-10 text-center"
    >
      <p class="text-gray-700">Non ci sono eventi attivi nelle ultime 2 ore</p>
      <p class="text-sm text-gray-500 mt-2">La mappa è comunque navigabile</p>
    </div>
  </div>
</template>

<style scoped>
/* Stili per i popup */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.event-popup h3) {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 16px;
}

:deep(.event-popup p) {
  margin: 4px 0;
  font-size: 14px;
}

/* Forza i controlli di Leaflet a rispettare il nostro stacking context */
:deep(.leaflet-top),
:deep(.leaflet-bottom) {
  z-index: 9 !important;
}

:deep(.leaflet-pane),
:deep(.leaflet-tile),
:deep(.leaflet-marker-icon),
:deep(.leaflet-marker-shadow),
:deep(.leaflet-tile-container),
:deep(.leaflet-pane > svg),
:deep(.leaflet-map-pane svg),
:deep(.leaflet-zoom-box),
:deep(.leaflet-image-layer),
:deep(.leaflet-layer) {
  z-index: 1 !important;
}

.map-wrapper {
  position: relative;
  isolation: isolate;
}
</style>