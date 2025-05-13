<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import FormInput from './FormInput.vue';
import AlertMessage from './AlertMessage.vue';
import AiLertLogo from './AiLertLogo.vue';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function login() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password';
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
      throw new Error(data.error || 'Login failed');
    }

    // Store token in localStorage for future API calls
    localStorage.setItem('token', data.token);
    
    // Dispatch event to notify other components (especially Header)
    window.dispatchEvent(new Event('auth-changed'));
    
    // Redirect to home page
    router.push('/');
    
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden max-w-md w-full mx-auto">
    <div class="p-8">
      <!-- Logo and title -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4">
          <span class="text-xl font-bold text-white">Ai</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">Sign in to AiLERT</h1>
        <p class="text-gray-500 mt-2">Enter your credentials to access your account</p>
      </div>
      
      <!-- Login form -->
      <form @submit.prevent="login" class="space-y-5">
        <FormInput 
          v-model="email"
          type="email"
          label="Email address"
          placeholder="name@example.com"
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
        
        <button 
          type="submit" 
          class="btn btn-primary w-full text-white rounded-lg h-12" 
          :class="{ 'opacity-70': isLoading }"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm mr-2"></span>
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
      
      <!-- Demo credentials -->
      <div class="mt-8">
        <div class="divider text-xs text-gray-400 uppercase">Demo Credentials</div>
        <div class="bg-base-100 rounded-lg p-4 border border-gray-100">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-gray-500 mb-1 text-xs">Email</p>
              <p class="font-medium font-mono text-gray-800">john.doe@example.com</p>
            </div>
            <div>
              <p class="text-gray-500 mb-1 text-xs">Password</p>
              <p class="font-medium font-mono text-gray-800">securepassword123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
