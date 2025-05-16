<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const streamId = route.params.id;
const stream = ref(null);
const error = ref(null);
const loading = ref(true);

onMounted(async () => {
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
});
</script>

<template>
  <div class="p-6">
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      <p class="mt-2">Caricamento stream...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
      {{ error }}
    </div>
    
    <div v-else-if="!stream" class="text-center py-12">
      <p class="text-gray-500">Stream non trovato.</p>
    </div>
    
    <div v-else>
      <h1 class="text-2xl font-bold mb-6">{{ stream.streamKey }}</h1>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Player video (occupa 2/3 dello spazio su desktop) -->
        <div class="lg:col-span-2">
          <div class="bg-black rounded-lg overflow-hidden h-96 flex items-center justify-center">
            <!-- Placeholder per il player video -->
            <div class="text-center text-white">
              <div class="mb-2">Stream RTSP</div>
              <div class="text-sm text-gray-400">{{ stream.streamUrl }}</div>
              <p class="mt-4 text-gray-400 text-sm">
                In un'implementazione reale, qui ci sarebbe il lettore video che mostra il flusso RTSP
              </p>
            </div>
          </div>
        </div>
        
        <!-- Dettagli stream (occupa 1/3 dello spazio su desktop) -->
        <div class="bg-white rounded-lg shadow-md p-4">
          <h2 class="text-lg font-semibold mb-4">Dettagli Stream</h2>
          
          <div class="space-y-2">
            <div>
              <span class="text-gray-600">ID Stream:</span>
              <span class="font-mono text-sm ml-2">{{ stream._id }}</span>
            </div>
            
            <div>
              <span class="text-gray-600">ID Camera:</span>
              <span class="font-mono text-sm ml-2">{{ stream.cameraId }}</span>
            </div>
            
            <div>
              <span class="text-gray-600">Stream Key:</span>
              <span class="ml-2">{{ stream.streamKey }}</span>
            </div>
            
            <div>
              <span class="text-gray-600">URL:</span>
              <span class="text-sm text-gray-700 ml-2">{{ stream.streamUrl }}</span>
            </div>
            
            <div>
              <span class="text-gray-600">Tipo:</span>
              <span class="ml-2">{{ stream.streamType }}</span>
            </div>
            
            <div>
              <span class="text-gray-600">Attivo:</span>
              <span class="ml-2" :class="stream.isActive ? 'text-green-600' : 'text-red-600'">
                {{ stream.isActive ? 'Sì' : 'No' }}
              </span>
            </div>
            
            <div>
              <span class="text-gray-600">Inizio:</span>
              <span class="ml-2">{{ new Date(stream.startTime).toLocaleString() }}</span>
            </div>
            
            <div v-if="stream.endTime">
              <span class="text-gray-600">Fine:</span>
              <span class="ml-2">{{ new Date(stream.endTime).toLocaleString() }}</span>
            </div>
            
            <div>
              <span class="text-gray-600">Visualizzazioni:</span>
              <span class="ml-2">{{ stream.viewCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>