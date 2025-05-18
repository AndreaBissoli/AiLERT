<script setup>
import { computed } from 'vue';

const props = defineProps({
  events: {
    type: Array,
    required: true
  }
});

// Dati per il grafico: conteggi e colori
const chartData = computed(() => {
  const incidentiCount = props.events.filter(e => e.type === 'incidente').length;
  const ingorghiCount  = props.events.filter(e => e.type === 'ingorgo').length;
  return [
    { name: 'Incidenti', value: incidentiCount, color: '#F44336' },
    { name: 'Ingorghi',  value: ingorghiCount,  color: '#FF9800' }
  ];
});

// Totale e frazioni
const total = computed(() => chartData.value.reduce((sum, i) => sum + i.value, 0));
const fractions = computed(() =>
  total.value === 0
    ? chartData.value.map(() => 0)
    : chartData.value.map(i => i.value / total.value)
);

/**
 * Genera il path SVG per un segmento di torta
 * @param {Number} index  indice della fetta
 * @param {Number[]} fracs frazioni che sommano a 1
 * @returns {String} percorso SVG
 */
function getPieSegment(index, fracs) {
  const startAngle = fracs.slice(0, index).reduce((s, f) => s + f, 0) * 2 * Math.PI;
  const angle      = fracs[index] * 2 * Math.PI;
  const endAngle   = startAngle + angle;

  const x1 = 50 + 50 * Math.sin(startAngle);
  const y1 = 50 - 50 * Math.cos(startAngle);
  const x2 = 50 + 50 * Math.sin(endAngle);
  const y2 = 50 - 50 * Math.cos(endAngle);

  const largeArc = angle > Math.PI ? 1 : 0;
  return `M50 50 L${x1} ${y1} A50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-md p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-6">Distribuzione per Tipo di Evento</h2>
    <div v-if="events.length === 0" class="flex items-center justify-center h-64">
      <p class="text-gray-500 text-lg">Nessun dato disponibile</p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Statistiche testuali -->
      <div class="flex flex-col justify-center space-y-4">
        <div class="p-4 bg-red-50 rounded-xl">
          <div class="text-sm font-medium text-red-800">Incidenti</div>
          <div class="flex items-end justify-between mt-1">
            <div class="text-2xl font-bold text-red-600">{{ chartData[0].value }}</div>
            <div class="text-sm font-medium text-red-600">{{ Math.round(fractions[0]*100) }}%</div>
          </div>
        </div>
        <div class="p-4 bg-orange-50 rounded-xl">
          <div class="text-sm font-medium text-orange-800">Ingorghi</div>
          <div class="flex items-end justify-between mt-1">
            <div class="text-2xl font-bold text-orange-600">{{ chartData[1].value }}</div>
            <div class="text-sm font-medium text-orange-600">{{ Math.round(fractions[1]*100) }}%</div>
          </div>
        </div>
      </div>

      <!-- Grafico a torta SVG -->
      <div class="md:col-span-2 flex justify-center items-center">
        <div class="relative w-40 h-40 flex justify-center items-center">
          <!-- Totale eventi al centro -->
          <div class="absolute z-10 flex flex-col items-center justify-center">
            <div class="text-sm text-gray-600">Totale</div>
            <div class="text-2xl font-bold text-gray-800">{{ total }}</div>
            <div class="text-xs text-gray-500">eventi</div>
          </div>

          <!-- SVG del grafico -->
          <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full">
            <circle cx="50" cy="50" r="50" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="1"/>
            <template v-for="(slice, i) in chartData" :key="slice.name">
              <path
                v-if="fractions[i] > 0"
                :d="getPieSegment(i, fractions)"
                :fill="slice.color"
              />
            </template>
            <!-- Donut hole -->
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
        </div>
      </div>

      <!-- Legenda -->
      <div class="md:col-span-3 flex justify-center space-x-8 mt-4">
        <div class="flex items-center">
          <div class="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span>Incidenti</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
          <span>Ingorghi</span>
        </div>
      </div>
    </div>
  </div>
</template>
