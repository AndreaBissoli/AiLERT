<script setup>
import { computed } from 'vue';

const props = defineProps({
  events: {
    type: Array,
    required: true
  }
});

// Calcola la distribuzione oraria degli eventi
const hourlyData = computed(() => {
  // Inizializza un array di 24 ore con conteggi a zero
  const hourCounts = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    incidenti: 0,
    ingorghi: 0,
    total: 0,

    label: `${i.toString().padStart(2, '0')}:00`
  }));
  
  // Conta gli eventi per ora del giorno
  props.events.forEach(event => {
    if (event.eventDate) {
      const date = new Date(event.eventDate);
      const hour = date.getHours();
      
      if (event.type === 'incidente') {
        hourCounts[hour].incidenti++;
      } else if (event.type === 'ingorgo') {
        hourCounts[hour].ingorghi++;
      }
      hourCounts[hour].total++;
    }
  });
  
  return hourCounts;
});

// Identifica le ore di punta (ore con più eventi)
const peakHours = computed(() => {
  const sortedHours = [...hourlyData.value].sort((a, b) => b.total - a.total);
  return sortedHours.slice(0, 3).map(h => h.hour);
});

// Calcola il valore massimo per scalare il grafico
const maxValue = computed(() => {
  return Math.max(...hourlyData.value.map(h => h.total), 1);
});
</script>

<template>
  <div class="bg-white rounded-2xl shadow-md p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-6">Distribuzione Oraria degli Eventi</h2>
    
    <div v-if="events.length === 0" class="flex items-center justify-center h-64">
      <p class="text-gray-500 text-lg">Nessun dato disponibile</p>
    </div>
    
    <div v-else>
      <!-- Grafico a barre personalizzato -->
      <div class="h-64 relative pt-8 pb-8 px-4 flex items-end justify-between border-b border-l">
        <!-- Assi e griglie -->
        <div class="absolute left-0 top-0 bottom-0 w-px bg-gray-300"></div>
        <div class="absolute left-0 right-0 bottom-0 h-px bg-gray-300"></div>
        
        <!-- Linee orizzontali della griglia -->
        <div class="absolute left-0 right-0 top-1/4 h-px bg-gray-100"></div>
        <div class="absolute left-0 right-0 top-1/2 h-px bg-gray-100"></div>
        <div class="absolute left-0 right-0 top-3/4 h-px bg-gray-100"></div>
        
        <!-- Barre per ogni ora -->
        <div 
          v-for="item in hourlyData" 
          :key="item.hour"
          class="w-2 mx-px h-full flex flex-col-reverse justify-start items-center"
        >
          <!-- Barra per incidenti -->
          <div 
            v-if="item.incidenti > 0"
            class="w-full bg-red-500"
            :style="{ height: `${(item.incidenti / maxValue) * 100}%` }"
          ></div>
          
          <!-- Barra per ingorghi -->
          <div 
            v-if="item.ingorghi > 0"
            class="w-full bg-orange-500"
            :style="{ height: `${(item.ingorghi / maxValue) * 100}%` }" 
          ></div>
          
          <!-- Etichetta dell'ora -->
          <div 
            v-if="item.hour % 2 === 0" 
            class="absolute -bottom-6 text-xs text-gray-600"
            :style="{ left: `calc(${item.hour / 23 * 100}%)` }"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
      
      <!-- Legenda -->
      <div class="flex justify-center space-x-6 mt-8">
        <div class="flex items-center">
          <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span class="text-sm">Incidenti</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
          <span class="text-sm">Ingorghi</span>
        </div>
      </div>
      
      <!-- Ore di punta -->
      <div class="mt-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Ore di punta:</h3>
        <div class="flex flex-wrap gap-2">
          <div 
            v-for="hour in peakHours" 
            :key="hour"
            class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
          >
            {{ hour.toString().padStart(2, '0') }}:00
          </div>
        </div>
      </div>
    </div>
  </div>
</template>