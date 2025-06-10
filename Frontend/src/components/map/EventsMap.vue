<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import "leaflet/dist/leaflet.css";

const props = defineProps({
  events: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["refresh"]);

const mapContainer = ref(null);
let map = null;
const markers = [];

// Auto-refresh state
const isAutoRefreshEnabled = ref(true);
const refreshCountdown = ref(30);
const lastRefreshTime = ref(null);
let refreshInterval = null;
let countdownInterval = null;

const TRENTO_CENTER = [46.0667, 11.1167];
const DEFAULT_ZOOM = 13;
const REFRESH_INTERVAL = 30000; // 30 secondi

// Funzione per ottenere coordinate evento
const getEventCoordinates = (event) => {
  if (event.location?.coordinates?.lat && event.location?.coordinates?.lng) {
    return [event.location.coordinates.lat, event.location.coordinates.lng];
  }
  
  console.warn('Evento senza coordinate dal backend:', event.title);
  return TRENTO_CENTER;
};

// Inizializza mappa Leaflet
const initMap = async () => {
  try {
    const L = await import("leaflet");

    if (mapContainer.value && !map) {
      map = L.map(mapContainer.value).setView(TRENTO_CENTER, DEFAULT_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      return true;
    }
    return false;
  } catch (error) {
    console.error("Errore nell'inizializzazione della mappa:", error);
    return false;
  }
};

// Aggiorna marker sulla mappa
const updateMarkers = async () => {
  if (!map) return;

  try {
    // Rimuovi marker esistenti
    markers.forEach(marker => marker.remove());
    markers.length = 0;

    const L = await import("leaflet");

    // Filtra eventi con coordinate valide
    const validEvents = props.events.filter(event => 
      event.location?.coordinates?.lat && event.location?.coordinates?.lng
    );

    console.log(`Auto-refresh: ${validEvents.length}/${props.events.length} eventi con coordinate`);

    // Crea marker per ogni evento valido
    validEvents.forEach(event => {
      const coords = getEventCoordinates(event);

      // Icona personalizzata
      const iconUrl = event.type === "incidente" 
        ? "/markers/accident-marker.png" 
        : "/markers/traffic-marker.png";

      let icon;
      try {
        icon = L.icon({
          iconUrl,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
      } catch (e) {
        icon = undefined;
      }

      // Crea marker
      const marker = L.marker(coords, { icon }).addTo(map);

      // Popup con informazioni
      marker.bindPopup(`
        <div class="event-popup">
          <h3>${event.title}</h3>
          <p>${event.description || ""}</p>
          <p><strong>Tipo:</strong> ${event.type === "incidente" ? "Incidente" : "Ingorgo"}</p>
          <p><strong>Indirizzo:</strong> ${event.location?.address || "N/A"}</p>
          <p><strong>Coordinate:</strong> ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}</p>
          <p><strong>Data:</strong> ${new Date(event.eventDate).toLocaleString("it-IT")}</p>
          <p><strong>Stato:</strong> ${
            event.status === "solved" ? "Risolto"
            : event.status === "pending" ? "In corso"
            : event.status === "unsolved" ? "Non risolto"
            : event.status
          }</p>
          <p><strong>Severità:</strong> ${event.severity || "N/A"}</p>
          ${event.cameraId ? `<p><strong>Camera ID:</strong> ${event.cameraId}</p>` : ''}
        </div>
      `);

      markers.push(marker);
    });

  } catch (error) {
    console.error("Errore aggiornamento marker:", error);
  }
};

// Gestione countdown
const startCountdown = () => {
  refreshCountdown.value = 30;
  
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(() => {
    refreshCountdown.value--;
    
    if (refreshCountdown.value <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
};

// Avvia auto-refresh
const startAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // Primo refresh immediato
  refreshData();
  startCountdown();
  lastRefreshTime.value = new Date();
  
  // Poi ogni 30 secondi
  refreshInterval = setInterval(() => {
    if (isAutoRefreshEnabled.value) {
      refreshData();
      startCountdown();
      lastRefreshTime.value = new Date();
    }
  }, REFRESH_INTERVAL);
  
  console.log('Auto-refresh attivato ogni 30 secondi');
};

// Ferma auto-refresh
const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  
  console.log('Auto-refresh fermato');
};

// Toggle auto-refresh
const toggleAutoRefresh = () => {
  isAutoRefreshEnabled.value = !isAutoRefreshEnabled.value;
  
  if (isAutoRefreshEnabled.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

// Refresh manuale
const refreshData = () => {
  emit("refresh");
};

// Watch per aggiornamenti eventi
watch(
  () => props.events,
  () => {
    if (map) {
      updateMarkers();
    }
  },
  { deep: true }
);

onMounted(async () => {
  setTimeout(async () => {
    const initialized = await initMap();
    if (initialized) {
      if (props.events.length > 0) {
        updateMarkers();
      }
      // Avvia auto-refresh dopo inizializzazione mappa
      startAutoRefresh();
    }
  }, 100);
});

onUnmounted(() => {
  stopAutoRefresh();
  
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="map-wrapper relative z-0">
    <div ref="mapContainer" class="h-[600px] w-full rounded-xl shadow-md overflow-hidden"></div>
    
    <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md z-[1000] min-w-[200px]">
      <div class="flex flex-col gap-2">
        <button 
          @click="toggleAutoRefresh"
          :class="{ 
            'bg-green-500 text-white': isAutoRefreshEnabled, 
            'bg-gray-500 text-white': !isAutoRefreshEnabled 
          }"
          class="px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          {{ isAutoRefreshEnabled ? 'Stop Auto-refresh' : 'Start Auto-refresh' }}
        </button>
        
        <button 
          @click="refreshData"
          :disabled="props.isLoading"
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {{ props.isLoading ? 'Caricamento...' : 'Refresh Now' }}
        </button>
        
        <div class="text-xs text-gray-600 mt-1">
          <div v-if="isAutoRefreshEnabled" class="text-green-600">
            Prossimo refresh: {{ refreshCountdown }}s
          </div>
          <div v-else class="text-gray-500">
            Auto-refresh disattivato
          </div>
          
          <div v-if="lastRefreshTime" class="mt-1">
            Ultimo: {{ lastRefreshTime.toLocaleTimeString() }}
          </div>
        </div>
        
        <div class="text-xs text-gray-600 border-t pt-2">
          Eventi: {{ props.events.length }}
        </div>
      </div>
    </div>
    
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
    
    <div
      v-if="props.events.length === 0 && !props.isLoading"
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-md text-center"
    >
      <p class="text-gray-600">Nessun evento nelle ultime 2 ore</p>
    </div>
  </div>
</template>