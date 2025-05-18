<script setup>
import { computed } from 'vue';

const props = defineProps({
  events: {
    type: Array,
    required: true
  },
  dateRange: {
    type: String,
    default: 'month',
    validator: (value) => ['week', 'month', 'year'].includes(value)
  }
});

const timeRangeLabels = {
  week: 'Ultimi 7 giorni',
  month: 'Ultimo mese',
  year: 'Ultimo anno'
};

// Funzione per preparare i dati del trend temporale
const trendData = computed(() => {
  // Determina l'intervallo di tempo in base al range selezionato
  const now = new Date();
  let startDate, interval, format, days;
  
  if (props.dateRange === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    interval = 'day';
    format = 'dd/MM';
    days = 7;
  } else if (props.dateRange === 'month') {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
    interval = 'day';
    format = 'dd/MM';
    days = 30;
  } else if (props.dateRange === 'year') {
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
    interval = 'month';
    format = 'MM/yyyy';
    days = 12;
  }
  
  // Filtra gli eventi nel range di date
  const filteredEvents = props.events.filter(event => {
    const eventDate = new Date(event.eventDate);
    return eventDate >= startDate;
  });
  
  // Raggruppa gli eventi per intervallo di tempo
  const groupedEvents = {};
  
  if (interval === 'day') {
    // Inizializza tutti i giorni nell'intervallo
    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const key = formatDate(currentDate, format);
      groupedEvents[key] = { date: key, incidenti: 0, ingorghi: 0, total: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Conta gli eventi per giorno
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.eventDate);
      const key = formatDate(eventDate, format);
      
      if (groupedEvents[key]) {
        if (event.type === 'incidente') {
          groupedEvents[key].incidenti++;
        } else if (event.type === 'ingorgo') {
          groupedEvents[key].ingorghi++;
        }
        groupedEvents[key].total++;
      }
    });
  } else if (interval === 'month') {
    // Inizializza tutti i mesi nell'intervallo
    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const key = formatDate(currentDate, format);
      groupedEvents[key] = { date: key, incidenti: 0, ingorghi: 0, total: 0 };
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Conta gli eventi per mese
    filteredEvents.forEach(event => {
      const eventDate = new Date(event.eventDate);
      const key = formatDate(eventDate, format);
      
      if (groupedEvents[key]) {
        if (event.type === 'incidente') {
          groupedEvents[key].incidenti++;
        } else if (event.type === 'ingorgo') {
          groupedEvents[key].ingorghi++;
        }
        groupedEvents[key].total++;
      }
    });
  }
  
  // Converti l'oggetto in array
  return Object.values(groupedEvents);
});

// Calcola il valore massimo per scalare il grafico
const maxValue = computed(() => {
  return Math.max(...trendData.value.map(item => item.total), 5);
});

// Genera intervalli di valori Y per il grafico
const yAxisTicks = computed(() => {
  const max = maxValue.value;
  const tickCount = 5;
  const ticks = [];
  
  // Calcola il valore di incremento arrotondato
  let increment = Math.ceil(max / (tickCount - 1));
  
  // Arrotonda l'incremento a un numero più leggibile
  if (increment < 1) increment = 1;
  else if (increment < 5) increment = Math.ceil(increment / 2) * 2;
  else if (increment < 10) increment = 5;
  else increment = Math.ceil(increment / 10) * 10;
  
  // Genera i tick dall'alto verso il basso
  for (let i = 0; i < tickCount; i++) {
    const value = increment * (tickCount - 1 - i);
    ticks.push(value);
  }
  
  return ticks;
});

// Funzione di utilità per formattare le date
function formatDate(date, format) {
  if (format === 'dd/MM') {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  } else if (format === 'MM/yyyy') {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
  return date.toLocaleDateString();
}

// Funzione per generare i punti del grafico a linee
function getLinePoints(data, field) {
  if (!data || data.length === 0) return '';
  
  // Trova il valore massimo per normalizzare
  const max = maxValue.value;
  
  // Genera i punti per la linea
  return data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    // Invertiamo la Y perché l'asse Y in SVG va dall'alto verso il basso
    const y = 100 - ((item[field] / max) * 100);
    return `${x},${y}`;
  }).join(' ');
}
</script>

<template>
  <div>
    <div class="mb-4 text-right">
      <span class="text-sm text-gray-600">{{ timeRangeLabels[dateRange] }}</span>
    </div>
    
    <div v-if="events.length === 0" class="flex items-center justify-center h-64">
      <p class="text-gray-500 text-lg">Nessun dato disponibile</p>
    </div>
    
    <div v-else class="h-64 relative pt-4 px-12 pb-12 border-b border-l bg-white rounded-xl shadow-sm">
      <!-- Etichette asse Y con valori -->
      <div class="absolute left-0 top-0 bottom-12 w-10 flex flex-col justify-between">
        <div v-for="(tick, i) in yAxisTicks" :key="i" class="flex items-center">
          <span class="text-xs text-gray-500 mr-1">{{ tick }}</span>
          <div class="w-2 h-px bg-gray-300"></div>
        </div>
      </div>
      
      <!-- Linee orizzontali della griglia -->
      <div v-for="(tick, i) in yAxisTicks" :key="`grid-${i}`" 
           class="absolute left-10 right-0 h-px bg-gray-100" 
           :style="{ top: `${i * (100 / (yAxisTicks.length - 1))}%` }">
      </div>
      
      <!-- Assi principale -->
      <div class="absolute left-10 top-0 bottom-0 w-px bg-gray-300"></div>
      <div class="absolute left-10 right-0 bottom-0 h-px bg-gray-300"></div>
      
      <!-- Grafico lineare -->
      <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- Area sotto la linea "total" per effetto riempimento -->
        <path 
          :d="`M0,100 ${getLinePoints(trendData, 'total')} 100,100 Z`" 
          fill="rgba(63, 81, 181, 0.1)"
        />
        
        <!-- Linea per il totale -->
        <polyline 
          :points="getLinePoints(trendData, 'total')" 
          fill="none" 
          stroke="#3F51B5" 
          stroke-width="2"
        />
        
        <!-- Punti per il totale -->
        <template v-for="(item, index) in trendData" :key="`dot-total-${index}`">
          <circle 
            v-if="item.total > 0"
            :cx="(index / (trendData.length - 1)) * 100" 
            :cy="100 - ((item.total / maxValue) * 100)" 
            r="2" 
            fill="#3F51B5"
          />
        </template>
        
        <!-- Linea per incidenti -->
        <polyline 
          :points="getLinePoints(trendData, 'incidenti')" 
          fill="none" 
          stroke="#F44336" 
          stroke-width="1.5"
          stroke-dasharray="3,3"
        />
        
        <!-- Linea per ingorghi -->
        <polyline 
          :points="getLinePoints(trendData, 'ingorghi')" 
          fill="none" 
          stroke="#FF9800" 
          stroke-width="1.5"
          stroke-dasharray="3,3"
        />
      </svg>
      
      <!-- Etichette sull'asse X (date) -->
      <div class="absolute bottom-0 left-10 right-0 flex justify-between">
        <div 
          v-for="(item, index) in trendData" 
          :key="`label-${index}`"
          class="text-xs text-gray-600 -mb-6 transform -translate-x-1/2"
          :style="{ 
            left: `${(index / (trendData.length - 1)) * 100}%`, 
            display: index % Math.ceil(trendData.length / 7) === 0 ? 'block' : 'none'
          }"
        >
          {{ item.date }}
        </div>
      </div>
    </div>
    
    <!-- Legenda -->
    <div class="flex justify-center space-x-6 mt-8">
      <div class="flex items-center">
        <div class="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
        <span class="text-sm">Totale</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
        <span class="text-sm">Incidenti</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
        <span class="text-sm">Ingorghi</span>
      </div>
    </div>
    
    <!-- Statistiche riassuntive -->
    <div class="grid grid-cols-3 gap-4 mt-8">
      <div class="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
        <div class="text-sm text-gray-600">Totale eventi</div>
        <div class="text-xl font-bold text-blue-700">
          {{ trendData.reduce((acc, curr) => acc + curr.total, 0) }}
        </div>
      </div>
      <div class="bg-red-50 rounded-lg p-3 text-center border border-red-100">
        <div class="text-sm text-gray-600">Incidenti</div>
        <div class="text-xl font-bold text-red-700">
          {{ trendData.reduce((acc, curr) => acc + curr.incidenti, 0) }}
        </div>
      </div>
      <div class="bg-orange-50 rounded-lg p-3 text-center border border-orange-100">
        <div class="text-sm text-gray-600">Ingorghi</div>
        <div class="text-xl font-bold text-orange-700">
          {{ trendData.reduce((acc, curr) => acc + curr.ingorghi, 0) }}
        </div>
      </div>
    </div>
  </div>
</template>