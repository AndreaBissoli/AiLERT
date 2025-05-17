<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AlertMessage from '../AlertMessage.vue';

const router = useRouter();
const route = useRoute();
const users = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const fetchAttempts = ref(0);
const maxAttempts = 3;

// Role badge colors
const roleBadgeClasses = {
  'amministratore': 'bg-purple-100 text-purple-800 border-purple-200',
  'sorvegliante': 'bg-blue-100 text-blue-800 border-blue-200',
  'dipendentecomunale': 'bg-green-100 text-green-800 border-green-200'
};

// Role display names
const roleNames = {
  'amministratore': 'Amministratore',
  'sorvegliante': 'Sorvegliante',
  'dipendentecomunale': 'Dipendente Comunale'
};

// Fetch all users with retry logic
const fetchUsers = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token non trovato. Effettua nuovamente il login.');
    }
    
    const response = await fetch('/api/v1/admin', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }
    
    users.value = await response.json();
    fetchAttempts.value = 0; // Reset attempts on success
  } catch (error) {
    console.error('Error fetching users:', error);
    errorMessage.value = error.message;
    
    // Implement retry logic
    if (fetchAttempts.value < maxAttempts) {
      fetchAttempts.value++;
      setTimeout(() => {
        fetchUsers();
      }, 1000); // Wait 1 second before retry
    }
  } finally {
    isLoading.value = false;
  }
};

// Navigate to create user form
const createUser = () => {
  router.push({ name: 'admin-user-create' });
};

// Navigate to user details
const viewUser = (userId) => {
  router.push({ name: 'admin-user-detail', params: { id: userId } });
};

// Refresh data when component is activated (useful when navigating back to this view)
const refreshData = () => {
  fetchUsers();
};

// Watch for route changes to refresh data when returning to this view
watch(
  () => route.path,
  () => {
    if (route.path === '/admin') {
      refreshData();
    }
  }
);

// Initial fetch on component mount
onMounted(() => {
  // Small delay to ensure token is available in localStorage
  setTimeout(() => {
    fetchUsers();
  }, 100);
});
</script>

<template>
  <div>
    <!-- Header with actions -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Gestione Utenti</h2>
      
      <button 
        @click="createUser" 
        class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Nuovo Utente
      </button>
    </div>
    
    <!-- Error message -->
    <AlertMessage 
      v-if="errorMessage" 
      :message="errorMessage"
      type="error"
      class="mb-4"
    />
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
    
    <!-- Users table -->
    <div v-else-if="users.length > 0" class="bg-white rounded-2xl shadow-soft overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruolo</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user._id" class="hover:bg-gray-50 cursor-pointer" @click="viewUser(user._id)">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ user.email }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ user.name || 'N/A' }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border" :class="roleBadgeClasses[user.role] || 'bg-gray-100 text-gray-800 border-gray-200'">
                {{ roleNames[user.role] || user.role }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                class="text-blue-600 hover:text-blue-900 mr-3"
                @click.stop="viewUser(user._id)"
              >
                Dettagli
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Empty state -->
    <div v-else class="bg-white rounded-2xl shadow-soft p-8 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Nessun utente trovato</h3>
      <p class="text-gray-600 mb-4">Non ci sono utenti nel sistema o si è verificato un errore nel recupero.</p>
      <button 
        @click="fetchUsers" 
        class="text-blue-600 hover:text-blue-800 font-medium flex items-center mx-auto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        Riprova
      </button>
    </div>
  </div>
</template>
