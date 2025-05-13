<script setup>
import LoginForm from './components/LoginForm.vue';
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <LoginForm />
    </div>
    
    <footer class="fixed bottom-0 w-full text-center p-4 text-gray-600 text-xs">
      <p>&copy; 2025 AiLERT - Urban Monitoring System</p>
    </footer>
  </div>
</template>
