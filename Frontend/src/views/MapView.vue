<!-- src/views/MapView.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import EventsMap from '../components/map/EventsMap.vue';
import EventCard from '../components/map/EventCard.vue';
import EventService from '../services/EventService';

// Riferimenti per gli stati dell'applicazione
const events = ref([]);
const loading = ref(true);
const error = ref(null);

// Funzione per recuperare gli eventi
const fetchEvents = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    events.value = await EventService.getPublicEvents();
  } catch (err) {
    console.error('Errore:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Inizializza i dati al caricamento del componente
onMounted(() => {
  fetchEvents();
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
      <EventsMap 
        :events="events" 
        :isLoading="loading"
        @refresh="fetchEvents"
      />
      
      <!-- Lista eventi sotto la mappa -->
      <div v-if="events.length > 0" class="mt-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Eventi recenti</h2>
        <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <EventCard 
            v-for="event in events" 
            :key="event._id"
            :event="event"
          />
        </div>
      </div>
    </div>
  </div>
</template>