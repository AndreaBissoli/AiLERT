<script setup>
import { ref, onMounted, computed } from 'vue';

const streams = ref([]);
const error = ref(null);
const loading = ref(true);
const currentPage = ref(0);
const streamsPerPage = 6;

// Calcola il numero di pagine in base agli stream totali
const totalPages = computed(() => {
  return Math.ceil(streams.value.length / streamsPerPage);
});

// Ottieni gli stream per la pagina corrente
const currentStreams = computed(() => {
  const start = currentPage.value * streamsPerPage;
  const end = start + streamsPerPage;
  return streams.value.slice(start, end);
});

// Funzione per cambiare pagina
const changePage = (newPage) => {
  if (newPage >= 0 && newPage < totalPages.value) {
    currentPage.value = newPage;
  }
};

// Recupera tutti gli stream attivi
onMounted(async () => {
  const token = localStorage.getItem('token');
  loading.value = true;

  try {
    const res = await fetch('http://localhost:8080/api/v1/stream/list', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error('Errore nel recupero degli stream');
    
    const data = await res.json();
    streams.value = data.streams || [];
  } catch (err) {
    console.error('Errore:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

// Funzione per aumentare il contatore di visualizzazioni
const viewStream = async (streamId) => {
  const token = localStorage.getItem('token');
  
  try {
    await fetch(`http://localhost:8080/api/v1/stream/view/${streamId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error('Errore nella registrazione della visualizzazione:', err);
  }
};
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Telecamere di sorveglianza</h1>
    
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      <p class="mt-2">Caricamento stream...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
      {{ error }}
    </div>
    
    <div v-else-if="streams.length === 0" class="text-center py-12">
      <p class="text-gray-500">Nessuno stream disponibile al momento.</p>
    </div>
    
    <div v-else>
      <!-- Grid di telecamere -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="stream in currentStreams" 
          :key="stream._id"
          class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
        >
          <!-- Placeholder per lo stream video (in un'implementazione reale, qui ci sarà il player) -->
          <router-link :to="`/cameras/${stream._id}`">
            <div 
              class="bg-gray-800 h-48 flex items-center justify-center hover:bg-gray-700 transition-colors"
              @click="viewStream(stream._id)"
            >
              <!-- Placeholder per il video -->
              <div class="text-center">
                <div class="text-gray-400 mb-2">Stream RTSP</div>
                <div class="text-sm text-gray-500">{{ stream.streamUrl }}</div>
              </div>
            </div>
          </router-link>
          
          <!-- Info sullo stream -->
          <div class="p-4">
            <h3 class="font-semibold">{{ stream.streamKey }}</h3>
            <div class="text-sm text-gray-600 mt-1">ID: {{ stream._id }}</div>
            <div class="text-sm text-gray-600">Camera ID: {{ stream.cameraId }}</div>
            <div class="text-sm text-gray-600">
              Attivo dal: {{ new Date(stream.startTime).toLocaleString() }}
            </div>
            <div class="text-sm text-gray-600">Visualizzazioni: {{ stream.viewCount }}</div>
          </div>
        </div>
      </div>
      
      <!-- Paginazione -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <div class="flex space-x-2">
          <button 
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 0"
            class="px-4 py-2 rounded border"
            :class="currentPage === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'"
          >
            Precedente
          </button>
          
          <div class="px-4 py-2">
            Pagina {{ currentPage + 1 }} di {{ totalPages }}
          </div>
          
          <button 
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages - 1"
            class="px-4 py-2 rounded border"
            :class="currentPage === totalPages - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'"
          >
            Successiva
          </button>
        </div>
      </div>
    </div>
  </div>
</template>