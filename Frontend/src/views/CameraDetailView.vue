<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const streamId = route.params.id;
const stream = ref(null);
const error = ref(null);
const loading = ref(true);
const events = ref([]);
const loadingEvents = ref(true);

// Calcola se c'è un incidente attivo su questa telecamera
const hasActiveIncident = computed(() => {
  return events.value.some(event => 
    event.cameraId === stream.value?.cameraId && 
    event.type === 'incidente' && 
    ['pending', 'unsolved'].includes(event.status)
  );
});

// Filtra gli eventi per questa telecamera
const cameraEvents = computed(() => {
  if (!stream.value) return [];
  return events.value.filter(event => event.cameraId === stream.value.cameraId)
    .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
});

// Formatta la data
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Traduce il tipo di evento
const translateEventType = (type) => {
  if (type === 'incidente') return 'Incidente';
  if (type === 'ingorgo') return 'Ingorgo';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Traduce lo stato dell'evento
const translateStatus = (status) => {
  if (status === 'solved') return 'Risolto';
  if (status === 'pending') return 'In corso';
  if (status === 'unsolved') return 'Non risolto';
  if (status === 'false_alarm') return 'Falso allarme';
  return status;
};

// Recupera gli eventi
const fetchEvents = async () => {
  const token = localStorage.getItem('token');
  loadingEvents.value = true;

  try {
    const res = await fetch('http://localhost:8080/api/v1/events', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error('Errore nel recupero degli eventi');
    
    events.value = await res.json();
  } catch (err) {
    console.error('Errore nel recupero degli eventi:', err);
  } finally {
    loadingEvents.value = false;
  }
};

// Recupera lo stream
const fetchStream = async () => {
  const token = localStorage.getItem('token');
  loading.value = true;

  try {
    const res = await fetch(`http://localhost:8080/api/v1/stream/${streamId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error('Errore nel recupero dello stream');
    
    const data = await res.json();
    stream.value = data.stream;
    
    // Registra la visualizzazione
    await fetch(`http://localhost:8080/api/v1/stream/view/${streamId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error('Errore:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Funzione per aggiornare manualmente i dati
const refreshData = async () => {
  await fetchEvents();
};

// Torna alla lista delle telecamere
const goBack = () => {
  router.push('/cameras');
};

onMounted(async () => {
  await fetchStream();
  await fetchEvents();
  
  // RIMOSSO: il timer di aggiornamento automatico
  // const refreshInterval = setInterval(async () => {
  //   await fetchEvents();
  // }, 15000);
  
  // RIMOSSO: pulizia dell'intervallo
  // onBeforeUnmount(() => {
  //   clearInterval(refreshInterval);
  // });
});
</script>

<template>
  <div>
    <!-- Header con Gradiente -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 mb-8">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center">
          <button @click="goBack" class="mr-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 class="text-3xl font-bold mb-2">{{ stream ? stream.streamKey : 'Dettaglio Telecamera' }}</h1>
            <p class="opacity-80">Visualizzazione live e dettagli della telecamera</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="max-w-7xl mx-auto px-4">
      <!-- Pulsante di aggiornamento manuale -->
      <div v-if="!loading && stream" class="flex justify-end mb-6">
        <button 
          @click="refreshData" 
          class="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          :disabled="loadingEvents"
        >
          <svg v-if="loadingEvents" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loadingEvents ? 'Aggiornamento...' : 'Aggiorna eventi' }}
        </button>
      </div>
      
      <div v-if="loading" class="bg-white rounded-2xl shadow-md p-12 text-center mb-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p class="text-lg text-gray-600">Caricamento stream...</p>
      </div>
      
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-8">
        {{ error }}
      </div>
      
      <div v-else-if="!stream" class="bg-white rounded-2xl shadow-md p-12 text-center mb-8">
        <p class="text-lg text-gray-600">Stream non trovato.</p>
      </div>
      
      <div v-else>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <!-- Player video (occupa 2/3 dello spazio su desktop) -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-md overflow-hidden">
              <!-- Contenitore video con stile moderno -->
              <div class="relative bg-black h-96 flex items-center justify-center">
                <!-- Indicatore di incidente -->
                <div 
                  v-if="hasActiveIncident" 
                  class="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center animate-pulse"
                >
                  <span class="mr-2">⚠️</span> Incidente attivo su questa telecamera
                </div>
                
                <!-- Placeholder per il player video -->
                <div class="text-center text-white">
                  <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl inline-block mb-4">
                    Stream RTSP
                  </div>
                  <div class="text-sm text-gray-400 mb-4">{{ stream.streamUrl }}</div>
                  <p class="max-w-md mx-auto text-gray-400 text-sm bg-gray-800/50 p-4 rounded-xl">
                    In un'implementazione reale, qui ci sarebbe il lettore video che mostra il flusso RTSP dalla telecamera selezionata.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Dettagli stream con stile moderno -->
          <div class="bg-white rounded-2xl shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
              Dettagli Stream
            </h2>
            
            <div class="space-y-4">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">ID Stream</div>
                  <div class="font-mono">{{ stream._id }}</div>
                </div>
              </div>
              
              <div class="flex items-center">
                <div class="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">ID Camera</div>
                  <div class="font-mono">{{ stream.cameraId }}</div>
                </div>
              </div>
              
              <div class="flex items-center">
                <div class="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Stream Key</div>
                  <div>{{ stream.streamKey }}</div>
                </div>
              </div>
              
              <div class="flex items-center">
                <div class="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">URL</div>
                  <div class="text-sm text-gray-700 break-all">{{ stream.streamUrl }}</div>
                </div>
              </div>
              
              <div class="flex items-center">
                <div class="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Tipo</div>
                  <div>{{ stream.streamType }}</div>
                </div>
              </div>
              
              <div class="flex items-center">
                <div class="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Attivo</div>
                  <div class="flex items-center">
                    <span 
                      class="inline-block w-3 h-3 rounded-full mr-2"
                      :class="stream.isActive ? 'bg-green-500' : 'bg-red-500'"
                    ></span>
                    {{ stream.isActive ? 'Sì' : 'No' }}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center">
                <div class="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Inizio</div>
                  <div>{{ formatDate(stream.startTime) }}</div>
                </div>
              </div>
              
              <div v-if="stream.endTime" class="flex items-center">
                <div class="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Fine</div>
                  <div>{{ formatDate(stream.endTime) }}</div>
                </div>
              </div>
              
              <div class="flex items-center">
                <div class="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Visualizzazioni</div>
                  <div>{{ stream.viewCount }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Eventi della telecamera -->
        <div class="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
            Eventi recenti su questa telecamera
          </h2>
          
          <div v-if="loadingEvents" class="text-center py-6">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
            <p class="text-gray-600">Caricamento eventi...</p>
          </div>
          
          <div v-else-if="cameraEvents.length === 0" class="text-center py-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-lg text-gray-500">Nessun evento recente per questa telecamera</p>
          </div>
          
          <div v-else class="space-y-4">
            <div 
              v-for="event in cameraEvents" 
              :key="event._id" 
              class="p-4 rounded-xl bg-gray-50 border"
              :class="{
                'border-red-200 bg-red-50': event.type === 'incidente' && ['pending', 'unsolved'].includes(event.status),
                'border-orange-200 bg-orange-50': event.type === 'ingorgo' && ['pending', 'unsolved'].includes(event.status),
                'border-green-200 bg-green-50': event.status === 'solved',
                'border-gray-200': event.status === 'false_alarm'
              }"
            >
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-bold text-gray-900">{{ event.title }}</h3>
                <div 
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                  :class="{
                    'bg-red-100 text-red-800 border border-red-200': event.type === 'incidente',
                    'bg-orange-100 text-orange-800 border border-orange-200': event.type === 'ingorgo'
                  }"
                >
                  {{ translateEventType(event.type) }}
                </div>
              </div>
              
              <p v-if="event.description" class="text-gray-600 mb-3 text-sm">{{ event.description }}</p>
              
              <div class="flex items-center justify-between text-sm">
                <div class="text-gray-500">
                  {{ formatDate(event.eventDate) }}
                </div>
                
                <div 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold"
                  :class="{
                    'bg-green-100 text-green-800 border border-green-200': event.status === 'solved',
                    'bg-yellow-100 text-yellow-800 border border-yellow-200': event.status === 'pending',
                    'bg-red-100 text-red-800 border border-red-200': event.status === 'unsolved',
                    'bg-gray-100 text-gray-800 border border-gray-200': event.status === 'false_alarm'
                  }"
                >
                  {{ translateStatus(event.status) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>