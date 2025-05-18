<!-- src/components/map/EventCard.vue -->
<script setup>
defineProps({
  event: {
    type: Object,
    required: true
  }
});

// Formatta la data in formato italiano
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Traduce il tipo di evento in italiano
const translateEventType = (type) => {
  return type === 'incidente' ? 'Incidente' : 
         type === 'ingorgo' ? 'Ingorgo' : 
         type.charAt(0).toUpperCase() + type.slice(1);
};

// Traduce lo stato dell'evento in italiano
const translateStatus = (status) => {
  return status === 'solved' ? 'Risolto' : 
         status === 'pending' ? 'In corso' : 
         status === 'unsolved' ? 'Non risolto' : 
         status === 'false_alarm' ? 'Falso allarme' : 
         status;
};
</script>

<template>
  <div 
    class="p-4 rounded-lg shadow-sm border"
    :class="{
      'bg-red-50 border-red-200': event.type === 'incidente',
      'bg-orange-50 border-orange-200': event.type === 'ingorgo'
    }"
  >
    <h3 class="font-bold text-gray-900 mb-1">{{ event.title }}</h3>
    <p v-if="event.description" class="text-sm text-gray-600 mb-2">{{ event.description }}</p>
    <p v-else class="text-sm text-gray-500 italic mb-2">Nessuna descrizione</p>
    
    <div class="flex flex-wrap gap-2 mb-2">
      <span class="px-2 py-0.5 rounded-full text-xs font-medium"
        :class="{
          'bg-red-100 text-red-800 border border-red-200': event.type === 'incidente',
          'bg-orange-100 text-orange-800 border border-orange-200': event.type === 'ingorgo'
        }"
      >
        {{ translateEventType(event.type) }}
      </span>
      
      <span class="px-2 py-0.5 rounded-full text-xs font-medium"
        :class="{
          'bg-green-100 text-green-800 border border-green-200': event.status === 'solved',
          'bg-yellow-100 text-yellow-800 border border-yellow-200': event.status === 'pending',
          'bg-red-100 text-red-800 border border-red-200': event.status === 'unsolved',
          'bg-gray-100 text-gray-800 border border-gray-200': event.status === 'false_alarm'
        }"
      >
        {{ translateStatus(event.status) }}
      </span>
    </div>
    
    <div class="flex items-center text-sm text-gray-600">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {{ formatDate(event.eventDate) }}
    </div>
    
    <div v-if="event.location?.address" class="flex items-center text-sm text-gray-600 mt-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {{ event.location.address }}
    </div>
  </div>
</template>