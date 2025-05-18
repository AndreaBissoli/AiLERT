<script setup>
import { computed } from 'vue';

const props = defineProps({
  events: {
    type: Array,
    required: true
  }
});

// Calcola la distribuzione della gravità degli eventi
const severityData = computed(() => {
  const counts = { bassa: 0, media: 0, alta: 0, undefined: 0 };
  
  props.events.forEach(event => {
    if (event.severity) {
      counts[event.severity]++;
    } else {
      counts.undefined++;
    }
  });
  
  const result = [
    { name: 'Bassa', value: counts.bassa, color: '#4CAF50' },
    { name: 'Media', value: counts.media, color: '#FFC107' },
    { name: 'Alta', value: counts.alta, color: '#F44336' }
  ];
  
  // Se ci sono eventi senza gravità, aggiungerli
  if (counts.undefined > 0) {
    result.push({ name: 'Non specificata', value: counts.undefined, color: '#9E9E9E' });
  }
  
  return result;
});

// Calcola le percentuali per visualizzazione testuale
const severityPercentages = computed(() => {
  const total = severityData.value.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) return {};
  
  return severityData.value.reduce((acc, item) => {
    acc[item.name] = Math.round((item.value / total) * 100);
    return acc;
  }, {});
});

// Calcola il valore totale
const totalSeverity = computed(() => {
  return severityData.value.reduce((acc, item) => acc + item.value, 0);
});
</script>

<template>
  <div class="bg-white rounded-2xl shadow-md p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-6">Distribuzione per Gravità</h2>
    
    <div v-if="events.length === 0" class="flex items-center justify-center h-64">
      <p class="text-gray-500 text-lg">Nessun dato disponibile</p>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Card con statistiche (lato sinistro) -->
      <div class="space-y-4">
        <div 
          v-for="item in severityData" 
          :key="item.name"
          class="rounded-xl p-4"
          :style="{ backgroundColor: item.name === 'Bassa' ? '#e8f5e9' : item.name === 'Media' ? '#fff8e1' : item.name === 'Alta' ? '#ffebee' : '#f5f5f5' }"
        >
          <div class="flex justify-between items-center">
            <div class="font-medium" 
                 :style="{ color: item.name === 'Bassa' ? '#2e7d32' : item.name === 'Media' ? '#ff8f00' : item.name === 'Alta' ? '#c62828' : '#616161' }">
              {{ item.name }}
            </div>
            <div class="text-sm" 
                 :style="{ color: item.name === 'Bassa' ? '#2e7d32' : item.name === 'Media' ? '#ff8f00' : item.name === 'Alta' ? '#c62828' : '#616161' }">
              {{ severityPercentages[item.name] }}%
            </div>
          </div>
          <div class="text-3xl font-bold mt-1"
               :style="{ color: item.name === 'Bassa' ? '#2e7d32' : item.name === 'Media' ? '#ff8f00' : item.name === 'Alta' ? '#c62828' : '#616161' }">
            {{ item.value }}
          </div>
        </div>
      </div>
      
      <!-- Grafico a torta semplice (lato destro) -->
      <div class="flex justify-center items-center">
        <div class="relative w-48 h-48">
          <!-- Totale eventi al centro -->
          <div class="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div class="text-sm text-gray-600">Totale</div>
            <div class="text-2xl font-bold text-gray-800">{{ totalSeverity }}</div>
            <div class="text-xs text-gray-500">eventi</div>
          </div>
          
          <!-- Grafico a torta semplice SVG -->
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <!-- Sfondo circolare -->
            <circle cx="50" cy="50" r="50" fill="white" stroke="#e0e0e0" stroke-width="1" />
            
            <!-- Calcola e disegna le sezioni della torta -->
            <template v-if="totalSeverity > 0">
              <!-- Per ogni item, calcoliamo l'angolo di inizio e la percentuale -->
              <template v-for="(item, index) in severityData" :key="item.name">
                <template v-if="item.value > 0">
                  <path 
                    :d="getPieSegment(index, severityPercentages)" 
                    :fill="item.color"
                  />
                </template>
              </template>
              
              <!-- Cerchio centrale per effetto "donut" -->
              <circle cx="50" cy="50" r="25" fill="white" />
            </template>
          </svg>
        </div>
      </div>
      
      <!-- Legenda -->
      <div class="md:col-span-2 flex justify-center space-x-6 mt-4">
        <div v-for="item in severityData" :key="`legend-${item.name}`" class="flex items-center">
          <div class="w-4 h-4 rounded-full mr-2" :style="{ backgroundColor: item.color }"></div>
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Funzione per generare un segmento di torta
function getPieSegment(index, percentages) {
  const items = Object.entries(percentages);
  if (items.length === 0) return '';
  
  // Calcola l'angolo di inizio (in radianti)
  let startAngle = 0;
  for (let i = 0; i < index; i++) {
    startAngle += (items[i][1] / 100) * 2 * Math.PI;
  }
  
  // Calcola l'angolo finale (in radianti)
  const angle = (items[index][1] / 100) * 2 * Math.PI;
  const endAngle = startAngle + angle;
  
  // Calcola i punti di partenza e fine sull'arco
  const startX = 50 + 50 * Math.sin(startAngle);
  const startY = 50 - 50 * Math.cos(startAngle);
  const endX = 50 + 50 * Math.sin(endAngle);
  const endY = 50 - 50 * Math.cos(endAngle);
  
  // Determina se l'arco è maggiore di 180 gradi (π radianti)
  const largeArcFlag = angle > Math.PI ? 1 : 0;
  
  // Crea il percorso SVG per il segmento
  return `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}
</script>