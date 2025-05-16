<!-- Frontend/src/views/DashboardView.vue -->
<script setup>
import EventsList from '../components/EventsList.vue'
import { ref, onMounted } from 'vue'

const userRole = ref(null)

onMounted(() => {
  // TODO: Recuperare il ruolo dell'utente dal token o API
  // Per ora usiamo un placeholder
  userRole.value = 'sorvegliante' // o 'dipendenteComunale' o 'amministratore'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold mb-2">Dashboard Eventi</h1>
            <p class="text-blue-100 text-lg">Gestione e monitoraggio in tempo reale</p>
          </div>
          <!-- Quick Stats -->
          <div class="hidden md:flex space-x-8">
            <div class="text-center">
              <div class="text-3xl font-bold">24</div>
              <div class="text-blue-100 text-sm">Eventi Oggi</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold">3</div>
              <div class="text-blue-100 text-sm">In Corso</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold">99%</div>
              <div class="text-blue-100 text-sm">Sistema Attivo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Navigation Tabs -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div class="flex flex-wrap gap-4">
          <button class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
            📋 Eventi
          </button>
          <button class="bg-white text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
            📊 Statistiche
          </button>
          <button class="bg-white text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
            📹 Telecamere
          </button>
          <button class="bg-white text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
            📈 Report
          </button>
        </div>
      </div>
      
      <!-- Events List -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <EventsList />
      </div>
    </div>
  </div>
</template>