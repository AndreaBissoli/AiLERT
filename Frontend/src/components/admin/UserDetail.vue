<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AlertMessage from '../AlertMessage.vue';

const router = useRouter();
const route = useRoute();
const userId = route.params.id;

const user = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');
const deleteModalOpen = ref(false);
const isDeleting = ref(false);
const deleteError = ref('');

// Role display names
const roleNames = {
  'amministratore': 'Amministratore',
  'sorvegliante': 'Sorvegliante',
  'dipendentecomunale': 'Dipendente Comunale'
};

// Fetch user details
const fetchUser = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const response = await fetch(`/api/v1/admin/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user details');
    }
    
    user.value = await response.json();
  } catch (error) {
    console.error('Error fetching user details:', error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

// Navigate to edit user form
const editUser = () => {
  router.push({ name: 'admin-user-edit', params: { id: userId } });
};

// Show delete confirmation modal
const showDeleteModal = () => {
  deleteModalOpen.value = true;
};

// Close delete confirmation modal
const closeDeleteModal = () => {
  deleteModalOpen.value = false;
  deleteError.value = '';
};

// Delete user
const confirmDelete = async () => {
  if (isDeleting.value) return;
  
  isDeleting.value = true;
  deleteError.value = '';
  
  try {
    const response = await fetch(`/api/v1/admin/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
    
    // Successfully deleted user, navigate back to users list
    router.push({ name: 'admin-users' });
  } catch (error) {
    console.error('Error deleting user:', error);
    deleteError.value = error.message;
    isDeleting.value = false;
  }
};

// Go back to users list
const goBack = () => {
  router.push({ name: 'admin-users' });
};

onMounted(fetchUser);
</script>

<template>
  <div>
    <!-- Back button -->
    <div class="mb-6">
      <button 
        @click="goBack" 
        class="flex items-center text-blue-600 hover:text-blue-800 font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Torna alla lista utenti
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
    
    <!-- User details -->
    <div v-else-if="user" class="bg-white rounded-2xl shadow-soft overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 flex justify-between items-start">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">{{ user.name || 'Utente' }}</h2>
          <p class="text-gray-600">{{ user.email }}</p>
        </div>
        
        <div class="flex space-x-3">
          <button 
            @click="editUser" 
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Modifica
          </button>
          
          <button 
            @click="showDeleteModal" 
            class="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Elimina
          </button>
        </div>
      </div>
      
      <!-- User details -->
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500">Email</h3>
              <p class="text-base">{{ user.email }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500">Nome</h3>
              <p class="text-base">{{ user.name || 'Non specificato' }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500">Ruolo</h3>
              <div class="mt-1">
                <span class="px-3 py-1 text-sm font-semibold rounded-full border inline-block"
                  :class="{
                    'bg-purple-100 text-purple-800 border-purple-200': user.role === 'amministratore',
                    'bg-blue-100 text-blue-800 border-blue-200': user.role === 'sorvegliante',
                    'bg-green-100 text-green-800 border-green-200': user.role === 'dipendentecomunale',
                    'bg-gray-100 text-gray-800 border-gray-200': !['amministratore', 'sorvegliante', 'dipendentecomunale'].includes(user.role)
                  }"
                >
                  {{ roleNames[user.role] || user.role }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading && !user" class="bg-white rounded-2xl shadow-soft p-8 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Utente non trovato</h3>
      <p class="text-gray-600 mb-4">L'utente richiesto non esiste o è stato eliminato.</p>
      <button 
        @click="goBack" 
        class="text-blue-600 hover:text-blue-800 font-medium"
      >
        Torna alla lista utenti
      </button>
    </div>
    
    <!-- Delete confirmation modal -->
    <div v-if="deleteModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Conferma eliminazione</h3>
          <p class="text-gray-600">
            Sei sicuro di voler eliminare l'utente {{ user?.name || user?.email }}? Questa azione è irreversibile.
          </p>
        </div>
        
        <!-- Error message -->
        <AlertMessage 
          v-if="deleteError" 
          :message="deleteError"
          type="error"
          class="mb-4"
        />
        
        <div class="flex justify-center space-x-4">
          <button 
            @click="closeDeleteModal" 
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            :disabled="isDeleting"
          >
            Annulla
          </button>
          
          <button 
            @click="confirmDelete" 
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            :disabled="isDeleting"
          >
            <span v-if="isDeleting" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Eliminazione...
            </span>
            <span v-else>Elimina</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
