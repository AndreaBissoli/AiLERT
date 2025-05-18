<!-- Frontend/src/components/Header.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { isAdmin } from '../utils/auth';

const router = useRouter();
const isLoggedIn = ref(false);
const userIsAdmin = ref(false);

// Check if token exists in localStorage
const checkLoginStatus = () => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
  userIsAdmin.value = isAdmin();
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
  userIsAdmin.value = false;
  // Dispatch event to notify other components
  window.dispatchEvent(new Event('auth-changed'));
  router.push('/');
};
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4">
      <nav class="flex items-center justify-between h-16">
        <!-- Logo Moderno -->
        <router-link to="/" class="flex items-center space-x-3 group">
          <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
            <span class="text-lg font-bold text-white">Ai</span>
          </div>
          <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LERT
          </span>
        </router-link>
        
        <!-- Navigation Links -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link 
            to="/" 
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
          >
            Home
          </router-link>

          <router-link 
            to="/map" 
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
          >
            Mappa
          </router-link>
          
          <!-- Show Dashboard link only for non-admin users -->
          <router-link 
            v-if="isLoggedIn && !userIsAdmin"
            to="/dashboard" 
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
          >
            Dashboard
          </router-link>

          <!-- Show Telecamere link only for non-admin users -->
          <router-link 
            v-if="isLoggedIn && !userIsAdmin"
            to="/cameras" 
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
          >
            Telecamere
          </router-link>
          
          <!-- Show Admin link only for admin users -->
          <router-link 
            v-if="isLoggedIn && userIsAdmin"
            to="/admin" 
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
          >
            Admin
          </router-link>
        </div>
        
        <!-- Auth Buttons -->
        <div class="flex items-center space-x-4">
          <template v-if="!isLoggedIn">
            <router-link 
              to="/login" 
              class="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-2.5 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Accedi
            </router-link>
          </template>
          <template v-else>
            <button 
              @click="logout" 
              class="border-2 border-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-full hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
            >
              Esci
            </button>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>