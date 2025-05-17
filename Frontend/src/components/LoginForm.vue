<!-- Frontend/src/components/LoginForm.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import FormInput from './FormInput.vue';
import AlertMessage from './AlertMessage.vue';
import { isAdmin } from '../utils/auth';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function login() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Inserisci email e password';
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;

  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login fallito');
    }

    // Store token in localStorage for future API calls
    localStorage.setItem('token', data.token);
    
    // Dispatch event to notify other components (especially Header)
    window.dispatchEvent(new Event('auth-changed'));
    
    // Small delay to ensure token is processed
    setTimeout(() => {
      // Check if user is admin to redirect to appropriate page
      if (isAdmin()) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }, 100);
    
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <!-- Login Form con Glassmorphism -->
  <div class="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 transform transition-all duration-300 hover:shadow-2xl">
    
    <!-- Logo Section -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg transform hover:scale-110 transition-transform duration-200">
        <span class="text-2xl font-bold text-white">Ai</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-900">Accedi ad AiLERT</h2>
      <p class="text-gray-600 mt-2">Inserisci le tue credenziali</p>
    </div>
    
    <!-- Login Form -->
    <form @submit.prevent="login" class="space-y-6">
      <FormInput 
        v-model="email"
        type="email"
        label="Email"
        placeholder="nome@example.com"
        required
      />
      
      <FormInput 
        v-model="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        required
      />
      
      <AlertMessage 
        v-if="errorMessage" 
        :message="errorMessage"
        type="error"
      />
      
      <!-- Login Button -->
      <button 
        type="submit" 
        class="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Accesso in corso...
        </span>
        <span v-else class="flex items-center justify-center">
          Accedi
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </form>
    
    <!-- Demo Credentials con Design Moderno -->
    <div class="mt-8">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Credenziali Demo</span>
        </div>
      </div>
      
      <div class="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100/50">
        <div class="grid grid-cols-1 gap-3 text-sm">
          <div class="text-center">
            <p class="text-gray-600 mb-2 font-medium">Account di Test</p>
            <div class="space-y-1">
              <p class="font-mono text-blue-700 bg-white rounded-lg px-3 py-1 inline-block">
                john.doe@example.com
              </p>
              <p class="font-mono text-purple-700 bg-white rounded-lg px-3 py-1 inline-block">
                securepassword123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer Links -->
    <div class="mt-6 text-center">
      <router-link to="/" class="text-sm text-gray-600 hover:text-blue-600 transition-colors">
        ← Torna alla homepage
      </router-link>
    </div>
  </div>
</template>