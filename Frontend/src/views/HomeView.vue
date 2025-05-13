<script setup>
import AiLertLogo from '../components/AiLertLogo.vue';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

const router = useRouter();
const isLoggedIn = ref(false);

onMounted(() => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
});

const navigateToLogin = () => {
  router.push('/login');
};

const navigateToDashboard = () => {
  router.push('/dashboard');
};
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Hero section -->
    <div class="text-center py-12">
      <AiLertLogo class="mx-auto" />
      
      <h1 class="mt-8 text-4xl md:text-5xl font-extrabold text-gray-900">
        AI-Powered Urban Safety
      </h1>
      
      <p class="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
        AiLERT is an intelligent monitoring system for urban areas that uses
        computer vision to detect incidents and ensure a rapid emergency response.
      </p>
      
      <div class="mt-10">
        <button 
          v-if="!isLoggedIn" 
          @click="navigateToLogin" 
          class="btn btn-primary btn-lg text-white rounded-lg px-8 shadow-md"
        >
          Sign In
        </button>
        <button 
          v-else 
          @click="navigateToDashboard" 
          class="btn btn-primary btn-lg text-white rounded-lg px-8 shadow-md"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
    
    <!-- Features section -->
    <div class="grid md:grid-cols-3 gap-8 py-12">
      <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Real-time Monitoring</h3>
        <p class="text-gray-600">Advanced video analysis for automatic incident detection across urban areas.</p>
      </div>
      
      <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Rapid Response</h3>
        <p class="text-gray-600">Immediate alerts to emergency services for faster incident response times.</p>
      </div>
      
      <div class="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Data Analytics</h3>
        <p class="text-gray-600">Comprehensive statistics and interactive maps for better urban planning.</p>
      </div>
    </div>
  </div>
</template>
