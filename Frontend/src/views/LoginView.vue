<!-- Frontend/src/views/LoginView.vue -->
<script setup>
import LoginForm from '../components/LoginForm.vue';
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-5 overflow-hidden">
      <svg class="absolute top-10 left-10 w-32 h-32" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="20" r="2" class="text-blue-600" />
        <circle cx="20" cy="80" r="1.5" class="text-purple-600" />
        <circle cx="80" cy="60" r="1" class="text-blue-600" />
      </svg>
      <svg class="absolute bottom-20 right-20 w-40 h-40" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="30" cy="40" r="1" class="text-purple-600" />
        <circle cx="70" cy="70" r="2" class="text-blue-600" />
        <circle cx="50" cy="10" r="1.5" class="text-purple-600" />
      </svg>
    </div>

    <!-- Login Container -->
    <div class="relative w-full max-w-md">
      <!-- Welcome Message -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2">
          <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bentornato
          </span>
        </h1>
        <p class="text-gray-600">Accedi al sistema AiLERT</p>
      </div>

      <!-- Login Form Card -->
      <LoginForm />
    </div>
  </div>
</template>