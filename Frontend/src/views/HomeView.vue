<script setup>
import PublicEventsList from "../components/PublicEventsList.vue";
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import QuickGuide from "../components/QuickGuide.vue";

const router = useRouter();
const isLoggedIn = ref(false);
const isGuideOpen = ref(false);

onMounted(() => {
  const token = localStorage.getItem("token");
  isLoggedIn.value = !!token;
});

const navigateToLogin = () => {
  router.push("/login");
};

const navigateToDashboard = () => {
  router.push("/dashboard");
};

const toggleGuide = () => {
  isGuideOpen.value = !isGuideOpen.value;
};

const closeGuide = () => {
  isGuideOpen.value = false;
};
</script>

<template>
   <div class="min-h-screen"
    > <section
      class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50"
      > <div class="absolute inset-0 opacity-5"
        > <svg class="absolute top-0 left-0 w-96 h-96" viewBox="0 0 100 100" fill="currentColor">

          <circle cx="50" cy="20" r="2" class="text-blue-600" />

          <circle cx="20" cy="80" r="1.5" class="text-purple-600" />

          <circle cx="80" cy="60" r="1" class="text-blue-600" />

          <circle cx="30" cy="40" r="0.5" class="text-purple-600" />
           </svg
        > </div
      > <div class="relative max-w-7xl mx-auto px-4 pt-20 pb-32"
        > <div class="text-center"
          > <div
            class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mb-8 shadow-xl shadow-blue-500/25 transform hover:scale-105 transition-transform duration-300"
            > <span class="text-3xl font-black text-white">Ai</span> </div
          > <h1 class="text-6xl md:text-7xl font-black mb-6"
            > <span
              class="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"
              > AiLERT </span
            > </h1
          > <p class="text-2xl text-gray-600 font-light mb-12 max-w-3xl mx-auto leading-relaxed"
            > Il futuro della sicurezza urbana è <span class="font-semibold text-blue-600">qui</span
            > </p
          > <div class="flex flex-wrap justify-center items-center space-x-6"
            > <button
              v-if="!isLoggedIn"
              @click="toggleGuide"
              class="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              > <span class="relative z-10">Guida Rapida</span> </button
            > <button
              v-else
              @click="navigateToDashboard"
              class="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              > <span class="relative z-10">Vai alla Dashboard</span> <div
                class="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                > </div
              > </button
            > </div
          > </div
        > </div
      > <div class="absolute bottom-0 left-0 right-0"
        > <svg
          className="w-full h-20"
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >

          <path
            d="M0 120L1440 120L1440 0C1440 0 1140 80 720 80C300 80 0 0 0 0L0 120Z"
            fill="white"
          />
           </svg
        > </div
      > </section
    > <section class="py-10 bg-white"
      > <div class="text-center mb-12"
        > <h2 class="text-4xl font-bold text-gray-900 mb-4"> Situazione Traffico </h2> <p
          class="text-lg text-gray-600"
          >Eventi degli ultimi 120 minuti a Trento</p
        > </div
      > </section
    > <section class="py-10 bg-gray-50"
      > <div class="max-w-7xl mx-auto px-4"> <PublicEventsList /> </div> </section
    > <section class="py-20 bg-white"
      > <div class="max-w-7xl mx-auto px-4"
        > <div class="text-center mb-16"
          > <h2 class="text-4xl font-bold text-gray-900 mb-4"> Come Funziona </h2> <p
            class="text-xl text-gray-600"
            >Tecnologia all'avanguardia per la sicurezza urbana</p
          > </div
        > <div class="grid grid-cols-1 lg:grid-cols-3 gap-8"
          > <div class="relative"
            > <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 h-full"
              > <div class="w-12 h-12 bg-blue-600 rounded-xl mb-6 flex items-center justify-center"
                > <span class="text-white font-bold text-xl">1</span> </div
              > <h3 class="text-xl font-bold text-gray-900 mb-4">Rilevamento AI</h3> <p
                class="text-gray-600"
                >Le telecamere analizzano il traffico in tempo reale con algoritmi di computer
                vision avanzati</p
              > </div
            > </div
          > <div class="relative"
            > <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 h-full"
              > <div
                class="w-12 h-12 bg-purple-600 rounded-xl mb-6 flex items-center justify-center"
                > <span class="text-white font-bold text-xl">2</span> </div
              > <h3 class="text-xl font-bold text-gray-900 mb-4">Allerta Immediata</h3> <p
                class="text-gray-600"
                >I sorveglianti confermano gli incidenti e allertano automaticamente i servizi di
                emergenza</p
              > </div
            > </div
          > <div class="relative"
            > <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 h-full"
              > <div class="w-12 h-12 bg-green-600 rounded-xl mb-6 flex items-center justify-center"
                > <span class="text-white font-bold text-xl">3</span> </div
              > <h3 class="text-xl font-bold text-gray-900 mb-4">Info Pubbliche</h3> <p
                class="text-gray-600"
                >I cittadini ricevono aggiornamenti in tempo reale sullo stato del traffico
                cittadino</p
              > </div
            > </div
          > </div
        > </div
      > </section
    > <section class="py-20 bg-white"
      > <div class="max-w-7xl mx-auto px-4"
        > <div class="grid grid-cols-1 md:grid-cols-3 gap-8"
          > <div class="text-center group"
            > <div
              class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-600 transition-colors duration-300"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
                 </svg
              > </div
            > <h3 class="text-3xl font-bold text-gray-900 mb-2">24/7</h3> <p class="text-gray-600"
              >Monitoraggio continuo</p
            > </div
          > <div class="text-center group"
            > <div
              class="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 group-hover:bg-purple-600 transition-colors duration-300"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-purple-600 group-hover:text-white transition-colors duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
                 </svg
              > </div
            > <h3 class="text-3xl font-bold text-gray-900 mb-2">&lt; 30s</h3> <p
              class="text-gray-600"
              >Tempo di risposta</p
            > </div
          > <div class="text-center group"
            > <div
              class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 group-hover:bg-green-600 transition-colors duration-300"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-green-600 group-hover:text-white transition-colors duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
                 </svg
              > </div
            > <h3 class="text-3xl font-bold text-gray-900 mb-2">80%</h3> <p class="text-gray-600"
              >Degli incidenti notificati</p
            > </div
          > </div
        > </div
      > </section
    > <section v-if="!isLoggedIn" class="py-20 bg-gradient-to-r from-blue-600 to-purple-600"
      > <div class="max-w-4xl mx-auto px-4 text-center"
        > <h2 class="text-3xl font-bold text-white mb-4"> Sei un operatore autorizzato? </h2> <p
          class="text-blue-100 mb-8 text-lg"
          > Accedi alla dashboard per gestire eventi e visualizzare statistiche avanzate </p
        > <button
          @click="navigateToLogin"
          class="bg-white text-blue-600 font-semibold py-3 px-8 rounded-2xl hover:bg-gray-50 transition-colors shadow-lg"
          > Accedi alla Dashboard </button
        > </div
      > </section
    > <QuickGuide :is-open="isGuideOpen" @close="closeGuide" /> </div
  >
</template>

