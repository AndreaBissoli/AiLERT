<script setup>
import { computed } from "vue";

const props = defineProps({
  events: {
    type: Array,
    required: true,
  },
});

const statusCounts = computed(() => {
  const counts = {
    solved: { incidente: 0, ingorgo: 0 },
    unsolved: { incidente: 0, ingorgo: 0 },
    pending: { incidente: 0, ingorgo: 0 },
    false_alarm: { incidente: 0, ingorgo: 0 },
  };

  props.events.forEach(event => {
    if (counts[event.status] && (event.type === "incidente" || event.type === "ingorgo")) {
      counts[event.status][event.type]++;
    }
  });

  return counts;
});

const chartData = computed(() => [
  {
    name: "Risolti",
    incidenti: statusCounts.value.solved.incidente,
    ingorghi: statusCounts.value.solved.ingorgo,
  },
  {
    name: "Non Risolti",
    incidenti: statusCounts.value.unsolved.incidente,
    ingorghi: statusCounts.value.unsolved.ingorgo,
  },
  {
    name: "In Corso",
    incidenti: statusCounts.value.pending.incidente,
    ingorghi: statusCounts.value.pending.ingorgo,
  },
  {
    name: "Falsi Allarmi",
    incidenti: statusCounts.value.false_alarm.incidente,
    ingorghi: statusCounts.value.false_alarm.ingorgo,
  },
]);

// Calcola i totali per ogni stato
const totalsByStatus = computed(() => {
  return chartData.value.map(item => ({
    name: item.name,
    total: item.incidenti + item.ingorghi,
  }));
});

// Calcola la percentuale più alta per creare barre proporzionate
const maxTotal = computed(() => {
  return Math.max(...totalsByStatus.value.map(item => item.total), 1);
});
</script>

<template>
   <div class="bg-white rounded-2xl shadow-md p-6"
    > <h2 class="text-xl font-bold text-gray-900 mb-6">Distribuzione per Stato degli Eventi</h2>
    <div v-if="events.length === 0" class="flex items-center justify-center h-64"
      > <p class="text-gray-500 text-lg">Nessun dato disponibile</p> </div
    > <div v-else class="space-y-6"
      > <div v-for="(item, index) in chartData" :key="index" class="mb-4"
        > <div class="flex justify-between items-center mb-1"
          > <div class="font-medium">{{ item.name }}</div
          > <div class="text-gray-500 text-sm">Totale: {{ item.incidenti + item.ingorghi }}</div
          > </div
        > <div class="h-8 bg-gray-100 rounded-lg overflow-hidden flex"
          > <div
            v-if="item.incidenti > 0"
            class="h-full bg-red-500 flex items-center justify-center"
            :style="{
              width: `${(item.incidenti / maxTotal) * 100}%`,
              minWidth: item.incidenti > 0 ? '2rem' : '0',
            }"
            > <span v-if="item.incidenti > 1" class="text-white text-xs font-semibold">{{
              item.incidenti
            }}</span
            > </div
          > <div
            v-if="item.ingorghi > 0"
            class="h-full bg-orange-500 flex items-center justify-center"
            :style="{
              width: `${(item.ingorghi / maxTotal) * 100}%`,
              minWidth: item.ingorghi > 0 ? '2rem' : '0',
            }"
            > <span v-if="item.ingorghi > 1" class="text-white text-xs font-semibold">{{
              item.ingorghi
            }}</span
            > </div
          > </div
        > </div
      > <div class="flex items-center justify-center space-x-6 mt-4"
        > <div class="flex items-center"
          > <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div> <span class="text-sm"
            >Incidenti</span
          > </div
        > <div class="flex items-center"
          > <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div> <span class="text-sm"
            >Ingorghi</span
          > </div
        > </div
      > </div
    > </div
  >
</template>

