<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { jwtDecode } from 'jwt-decode'

const router = useRouter()
const route = useRoute()
const userRole = ref(null)

onMounted(() => {
  let jwt = localStorage.getItem('token')
  userRole.value = jwtDecode(jwt).role
})

// Funzioni di navigazione
const navigateToDashboard = () => {
  router.push('/dashboard')
}

const navigateToStatistics = () => {
  router.push('/statistics')
}

const navigateToCameras = () => {
  router.push('/cameras')
}

// Compute active route for highlighting
const currentPath = computed(() => route.path)

// Check if a specific route is active
const isActive = (path) => {
  return currentPath.value.includes(path)
}
</script>

<template>
    <!-- Navigation Tabs -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div class="flex flex-wrap gap-4">
        <button
          @click="navigateToDashboard"
          :class="[
            isActive('/dashboard') ? 
              'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 
              'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
            'px-6 py-3 rounded-xl font-semibold transition-colors'
          ]">
          📋 Eventi
        </button>
        <button 
          @click="navigateToStatistics"
          :class="[
            isActive('/statistics') ? 
              'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 
              'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
            'px-6 py-3 rounded-xl font-semibold transition-colors'
          ]">
          📊 Statistiche
        </button>
        <button 
          @click="navigateToCameras"
          :class="[
            isActive('/cameras') ? 
              'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 
              'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
            'px-6 py-3 rounded-xl font-semibold transition-colors'
          ]">
          📹 Telecamere
        </button>
        <button
          class="bg-white text-gray-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
          📈 Report
        </button>
      </div>
    </div>
</template>
