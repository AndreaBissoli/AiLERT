<script setup>
import { ref } from 'vue';
import FormInput from './FormInput.vue';
import AlertMessage from './AlertMessage.vue';
import AiLertLogo from './AiLertLogo.vue';

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
    
    // For demo purposes, show success message
    errorMessage.value = '';
    alert('Login successful! Welcome to AiLERT.');
    
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="card bg-base-100 shadow-2xl border border-base-200">
    <!-- Card header with logo and title -->
    <div class="card-body px-8 pt-8 pb-6">
      <div class="flex justify-center mb-6">
        <AiLertLogo />
      </div>
      
      <h2 class="text-2xl font-bold text-center text-primary mb-6">Sign In</h2>
      
      <form @submit.prevent="login" class="space-y-4">
        <FormInput 
          v-model="email"
          type="email"
          label="Email"
          placeholder="email@example.com"
          required
        />
        
        <FormInput 
          v-model="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          required
        />
        
        <AlertMessage 
          v-if="errorMessage" 
          :message="errorMessage"
          type="error"
        />
        
        <div class="form-control mt-8">
          <button 
            type="submit" 
            class="btn btn-primary w-full text-white" 
            :class="{ 'opacity-70 cursor-not-allowed': isLoading }"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs"></span>
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </div>
      </form>
      
      <!-- Demo credentials section -->
      <div class="divider my-6 text-xs text-gray-500">DEMO CREDENTIALS</div>
      
      <div class="bg-base-200 rounded-box p-4 text-center">
        <p class="text-sm text-gray-600 mb-2">For testing purposes, use:</p>
        <div class="space-y-2">
          <p class="font-mono text-xs bg-base-100 p-2 rounded border border-base-300 inline-block">
            <span class="text-primary font-bold">email:</span> john.doe@example.com
          </p>
          <p class="font-mono text-xs bg-base-100 p-2 rounded border border-base-300 inline-block">
            <span class="text-primary font-bold">password:</span> securepassword123
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
