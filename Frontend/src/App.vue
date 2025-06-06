<script setup>
import Header from "./components/Header.vue";
</script>

<template>
   <div class="min-h-screen flex flex-col bg-base-100"
    > <Header /> <main class="flex-grow container mx-auto px-4 py-8"
      > <router-view v-slot="{ Component }"
        > <transition name="fade" mode="out-in"> <component :is="Component" /> </transition>
        </router-view
      > </main
    > <footer class="bg-base-200 py-6"
      > <div class="container mx-auto px-4 text-center"
        > <p class="text-sm text-gray-600">&copy; 2025 AiLERT - Urban Monitoring System</p> </div
      > </footer
    > </div
  >
</template>

<style>
/* Add fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Import font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
</style>

