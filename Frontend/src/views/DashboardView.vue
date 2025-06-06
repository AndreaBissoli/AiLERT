<script setup>
import EventsList from "../components/EventsList.vue";
import { onMounted } from "vue";
import DashboardNav from "../components/DashboardNav.vue";

onMounted(() => {});
</script>

<template>
   <div class="min-h-screen bg-gray-50"
    > <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
      > <div class="max-w-7xl mx-auto px-4 py-12"
        > <div class="flex items-center justify-between"
          > <div
            > <h1 class="text-4xl font-bold mb-2">Dashboard Eventi</h1> <p
              class="text-blue-100 text-lg"
              >Gestione e monitoraggio in tempo reale</p
            > </div
          > </div
        > </div
      > </div
    > <div class="max-w-7xl mx-auto px-4 py-8"
      > <DashboardNav /> <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        > <EventsList /> </div
      > </div
    > </div
  >
</template>

