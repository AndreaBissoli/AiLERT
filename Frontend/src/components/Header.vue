<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = ref(false);

// Check if token exists in localStorage
const checkLoginStatus = () => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
};

// Function to handle auth state changes
const handleAuthChange = () => {
  checkLoginStatus();
};

// Run on component mount
onMounted(() => {
  checkLoginStatus();
  // Add event listener for auth state changes
  window.addEventListener('auth-changed', handleAuthChange);
  // Also check login status when route changes
  router.afterEach(checkLoginStatus);
});

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', handleAuthChange);
});

const logout = () => {
  localStorage.removeItem('token');
  isLoggedIn.value = false;
  // Dispatch event to notify other components
  window.dispatchEvent(new Event('auth-changed'));
  router.push('/');
};
</script>

<template>
  <header class="bg-white border-b border-base-200 sticky top-0 z-50">
    <div class="container mx-auto">
      <nav class="flex items-center justify-between h-16 px-4">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 font-bold text-xl">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span class="text-white">Ai</span>
          </div>
          <span class="text-primary">LERT</span>
        </router-link>
        
        <!-- Desktop Navigation -->
        <ul class="hidden md:flex items-center space-x-6">
          <li>
            <router-link to="/" class="text-gray-700 hover:text-primary transition-colors">
              Home
            </router-link>
          </li>
          <li v-if="isLoggedIn">
            <router-link to="/dashboard" class="text-gray-700 hover:text-primary transition-colors">
              Dashboard
            </router-link>
          </li>
        </ul>
        
        <!-- Authentication Buttons -->
        <div class="flex items-center space-x-4">
          <template v-if="!isLoggedIn">
            <router-link to="/login" class="btn btn-primary btn-sm text-white rounded-full px-6">
              Sign In
            </router-link>
          </template>
          <template v-else>
            <button @click="logout" class="btn btn-outline btn-sm rounded-full px-6">
              Sign Out
            </button>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>
