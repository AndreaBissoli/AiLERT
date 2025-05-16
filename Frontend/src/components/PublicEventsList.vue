<!-- Frontend/src/components/PublicEventsList.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import AlertMessage from './AlertMessage.vue'

const events = ref([])           
const loading = ref(true)        
const error = ref(null)          

const fetchPublicEvents = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await fetch('/api/v1/public/events')
    
    if (!response.ok) {
      throw new Error('Errore nel caricamento degli eventi')
    }
    
    const data = await response.json()
    events.value = data
    
  } catch (err) {
    console.error('Errore:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPublicEvents()
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEventTypeStyle = (type) => {
  if (type === 'incidente') {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: '🚨'
    }
  }
  if (type === 'ingorgo') {
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: '🚧'
    }
  }
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    icon: '📍'
  }
}

const getStatusStyle = (status) => {
  if (status === 'solved') {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    }
  }
  if (status === 'pending') {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    }
  }
  if (status === 'unsolved') {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200'
    }
  }
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  }
}

const translateEventType = (type) => {
  if (type === 'incidente') return 'Incidente'
  if (type === 'ingorgo') return 'Ingorgo'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const translateStatus = (status) => {
  if (status === 'solved') return 'Risolto'
  if (status === 'pending') return 'In corso'
  if (status === 'unsolved') return 'Non risolto'
  if (status === 'false_alarm') return 'Falso allarme'
  return status
}
</script>

<template>
  <div class="py-8">
    <div class="text-center mb-12">
      <h2 class="text-4xl font-bold text-gray-900 mb-4">
        Situazione Traffico
      </h2>
      <p class="text-lg text-gray-600">Eventi degli ultimi 120 minuti a Trento</p>
    </div>
    
    <!-- Loading State con animazione moderna -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
        <div class="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <p class="mt-6 text-gray-600 font-medium">Aggiornamento in corso...</p>
    </div>
    
    <!-- Error State -->
    <AlertMessage 
      v-else-if="error" 
      :message="error"
      type="error"
      class="mb-8"
    />
    
    <!-- Empty State Migliorato -->
    <div v-else-if="events.length === 0" class="text-center py-16">
      <div class="max-w-md mx-auto">
        <div class="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-3">
          Tutto tranquillo! 🚗✨
        </h3>
        <p class="text-gray-600 text-lg">
          Nessun incidente o problema di traffico rilevato nel centro di Trento
        </p>
      </div>
    </div>
    
    <!-- Events Grid Modernizzato -->
    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="event in events" 
        :key="event._id"
        class="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200"
      >
        <!-- Header con Badge Moderni -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-2">
            <span class="text-lg">{{ getEventTypeStyle(event.type).icon }}</span>
            <span 
              class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border"
              :class="[
                getEventTypeStyle(event.type).bg,
                getEventTypeStyle(event.type).text,
                getEventTypeStyle(event.type).border
              ]"
            >
              {{ translateEventType(event.type) }}
            </span>
          </div>
          
          <span 
            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border"
            :class="[
              getStatusStyle(event.status).bg,
              getStatusStyle(event.status).text,
              getStatusStyle(event.status).border
            ]"
          >
            {{ translateStatus(event.status) }}
          </span>
        </div>
        
        <!-- Contenuto Card -->
        <h3 class="font-bold text-xl text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {{ event.title }}
        </h3>
        
        <p v-if="event.description" class="text-gray-600 mb-6 leading-relaxed">
          {{ event.description }}
        </p>
        
        <!-- Info Details con Icone Moderne -->
        <div class="space-y-3 text-sm">
          <div class="flex items-center text-gray-600">
            <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="font-medium">{{ formatDate(event.eventDate) }}</span>
          </div>
          
          <div v-if="event.location?.address" class="flex items-center text-gray-600">
            <div class="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span>{{ event.location.address }}</span>
          </div>
          
          <div v-if="event.severity" class="flex items-center text-gray-600">
            <div class="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span>Livello: <span class="font-semibold">{{ event.severity }}</span></span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Refresh Button Moderno -->
    <div class="text-center mt-12">
      <button 
        @click="fetchPublicEvents" 
        class="group bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 font-semibold py-3 px-8 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 transform hover:scale-105"
        :disabled="loading"
      >
        <div class="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" 
               class="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" 
               :class="{ 'animate-spin': loading }"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ loading ? 'Aggiornamento...' : 'Aggiorna Situazione' }}</span>
        </div>
      </button>
    </div>
  </div>
</template>