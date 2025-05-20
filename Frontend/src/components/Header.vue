<!-- Frontend/src/components/Header.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { isAdmin } from '../utils/auth';

const router = useRouter();
const isLoggedIn = ref(false);
const userIsAdmin = ref(false);
const dropdownOpen = ref(false);
const userName = ref('');
const userEmail = ref('');

// Check if token exists in localStorage
const checkLoginStatus = () => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
  userIsAdmin.value = isAdmin();
  
  // Get user info from localStorage if available
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const parsedInfo = JSON.parse(userInfo);
      userName.value = parsedInfo.name || 'Utente';
      userEmail.value = parsedInfo.email || '';
    } catch (e) {
      console.error('Error parsing user info:', e);
    }
  }
};

// Function to handle auth state changes
const handleAuthChange = () => {
  checkLoginStatus();
};

// Toggle dropdown
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

// Close dropdown when clicking outside
const closeDropdown = (e) => {
  if (dropdownOpen.value && !e.target.closest('.user-dropdown')) {
    dropdownOpen.value = false;
  }
};

// Navigate to change password page
const goToChangePassword = () => {
  dropdownOpen.value = false;
  router.push('/change-password');
};

// Run on component mount
onMounted(() => {
  checkLoginStatus();
  // Add event listener for auth state changes
  window.addEventListener('auth-changed', handleAuthChange);
  // Also check login status when route changes
  router.afterEach(checkLoginStatus);
  // Add click listener to close dropdown
  document.addEventListener('click', closeDropdown);
});

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', handleAuthChange);
  document.removeEventListener('click', closeDropdown);
});

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  isLoggedIn.value = false;
  userIsAdmin.value = false;
  dropdownOpen.value = false;
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
        
        <!-- Auth Buttons / User Menu -->
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
            <!-- User dropdown menu -->
            <div class="relative user-dropdown">
              <button 
                @click.stop="toggleDropdown" 
                class="flex items-center space-x-2 bg-white border border-gray-200 rounded-full py-1.5 pl-1.5 pr-3 hover:bg-gray-50 transition-colors"
              >
                <div class="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {{ userName.charAt(0).toUpperCase() }}
                </div>
                <span class="text-sm font-medium text-gray-700">{{ userName }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" :class="{'rotate-180': dropdownOpen}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <!-- Dropdown menu -->
              <div 
                v-show="dropdownOpen" 
                class="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg py-2 border border-gray-100 z-50"
              >
                <!-- User info -->
                <div class="px-4 py-3 border-b border-gray-100">
                  <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ userEmail }}</p>
                </div>
                
                <!-- Actions -->
                <div class="py-1">
                  <a 
                    @click="goToChangePassword" 
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Cambia Password
                  </a>
                  <a 
                    @click="logout" 
                    class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Esci
                  </a>
                </div>
              </div>
            </div>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>