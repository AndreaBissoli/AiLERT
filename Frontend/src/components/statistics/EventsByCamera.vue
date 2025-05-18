<script setup>
import { computed } from 'vue';

const props = defineProps({
  events: {
    type: Array,
    required: true
  },
  cameras: {
    type: Array,
    required: true
  }
});

// Calcola gli eventi per telecamera
const eventsByCamera = computed(() => {
  // Crea una mappa di camerasId => cameraKey per riferimento veloce
  const cameraMap = {};
  props.cameras.forEach(camera => {
    if (camera.cameraId) {
      cameraMap[camera.cameraId] = camera.streamKey || `Camera ${camera.cameraId.substring(0, 6)}`;
    }
  });
  
  // Conta gli eventi per ogni telecamera
  const counts = {};
  props.events.forEach(event => {
    if (event.cameraId) {
      const cameraKey = cameraMap[event.cameraId] || `Camera ${event.cameraId.substring(0, 6)}`;
      if (!counts[cameraKey]) {
        counts[cameraKey] = { name: cameraKey, incidenti: 0, ingorghi: 0, total: 0 };
      }
      
      if (event.type === 'incidente') {
        counts[cameraKey].incidenti++;
      } else if (event.type === 'ingorgo') {
        counts[cameraKey].ingorghi++;
      }
      counts[cameraKey].total++;
    }
  });
  
  // Converti in array e ordina per numero totale di eventi (decrescente)
  return Object.values(counts).sort((a, b) => b.total - a.total);
});

// Calcola le telecamere più attive
const topCameras = computed(() => {
  return eventsByCamera.value.slice(0, 5);
});

// Calcola il valore massimo per scalare le barre
const maxTotal = computed(() => {
  return Math.max(...eventsByCamera.value.map(item => item.total), 1);
});
</script>

<template>
  <div>
    <div v-if="events.length === 0 || !eventsByCamera.length" class="flex items-center justify-center h-64">
      <p class="text-gray-500 text-lg">Nessun dato disponibile per le telecamere</p>
    </div>
    
    <div v-else>
      <!-- Top telecamere per numero di eventi in card organizzate -->
      <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          v-for="(camera, index) in topCameras" 
          :key="index"
          class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {{ index + 1 }}
              </div>
              <div>
                <div class="font-medium text-gray-700 truncate max-w-[150px]">{{ camera.name }}</div>
                <div class="text-sm text-gray-500">Totale: {{ camera.total }}</div>
              </div>
            </div>
            
            <!-- Grafico a barra orizzontale miniaturizzato -->
            <div class="w-24 h-8 bg-gray-100 rounded-lg overflow-hidden flex">
              <div 
                v-if="camera.incidenti > 0"
                class="h-full bg-red-500" 
                :style="{ width: `${(camera.incidenti / camera.total) * 100}%` }"
              ></div>
              <div 
                v-if="camera.ingorghi > 0"
                class="h-full bg-orange-500" 
                :style="{ width: `${(camera.ingorghi / camera.total) * 100}%` }"
              ></div>
            </div>
          </div>
          
          <!-- Dettagli per tipo di evento -->
          <div class="flex justify-between mt-3 text-sm">
            <span class="bg-red-100 text-red-700 px-2 py-1 rounded-full">Incidenti: {{ camera.incidenti }}</span>
            <span class="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Ingorghi: {{ camera.ingorghi }}</span>
          </div>
        </div>
      </div>
      
      <!-- Miglioramento del grafico a barre per tutte le telecamere -->
      <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Distribuzione Eventi per Telecamera</h3>
        
        <div class="space-y-4">
          <div v-for="(camera, index) in eventsByCamera" :key="index" class="mb-4">
            <div class="flex justify-between items-center mb-1">
              <div class="font-medium truncate max-w-md flex items-center">
                <span class="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                  {{ index + 1 }}
                </span>
                {{ camera.name }}
              </div>
              <div class="text-gray-500 text-sm">{{ camera.total }}</div>
            </div>
            
            <!-- Barra colorata migliorata -->
            <div class="h-7 bg-gray-100 rounded-lg overflow-hidden flex relative">
              <!-- Progress bar per incidenti -->
              <div
                v-if="camera.incidenti > 0"
                class="h-full bg-red-500 flex items-center justify-center transition-all duration-300"
                :style="{
                  width: `${(camera.incidenti / maxTotal) * 100}%`,
                  minWidth: camera.incidenti > 0 ? '40px' : '0'
                }"
              >
                <span v-if="camera.incidenti > 1" class="text-white text-xs font-semibold px-2 z-10">{{ camera.incidenti }}</span>
              </div>
              
              <!-- Progress bar per ingorghi -->
              <div
                v-if="camera.ingorghi > 0"
                class="h-full bg-orange-500 flex items-center justify-center transition-all duration-300"
                :style="{
                  width: `${(camera.ingorghi / maxTotal) * 100}%`,
                  minWidth: camera.ingorghi > 0 ? '40px' : '0'
                }"
              >
                <span v-if="camera.ingorghi > 1" class="text-white text-xs font-semibold px-2 z-10">{{ camera.ingorghi }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Legenda -->
        <div class="flex items-center justify-center space-x-6 mt-6">
          <div class="flex items-center">
            <div class="w-4 h-4 bg-red-500 rounded-md mr-2"></div>
            <span class="text-sm">Incidenti</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 bg-orange-500 rounded-md mr-2"></div>
            <span class="text-sm">Ingorghi</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>