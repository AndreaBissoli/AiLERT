<script setup>
import { onMounted, provide, ref } from "vue";
import { useRouter } from "vue-router";
import { isAdmin } from "../utils/auth";

const router = useRouter();
const dataRefreshTrigger = ref(0);

// Provide a way for child components to request a data refresh
provide("triggerDataRefresh", () => {
  dataRefreshTrigger.value++;
});

onMounted(() => {
  // Double-check admin permissions on component mount
  if (!isAdmin()) {
    router.push("/dashboard");
    return;
  }

  // Trigger an initial data refresh
  dataRefreshTrigger.value++;
});
</script>

<template>
   <div class="min-h-screen bg-base-100"
    > <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8"
      > <div class="max-w-7xl mx-auto"
        > <h1 class="text-3xl font-bold mb-2">Pannello Amministratore</h1> <p class="opacity-80"
          >Gestione utenti e configurazione del sistema</p
        > </div
      > </div
    > <div class="bg-white shadow-md"
      > <div class="max-w-7xl mx-auto flex overflow-x-auto"
        > <router-link
          :to="{ name: 'admin-users' }"
          class="px-6 py-4 font-medium hover:bg-blue-50 transition-colors border-b-2"
          :class="
            $route.name === 'admin-users' ||
            $route.name === 'admin-user-create' ||
            $route.name === 'admin-user-detail' ||
            $route.name === 'admin-user-edit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent'
          "
          > Gestione Utenti </router-link
        > </div
      > </div
    > <div class="max-w-7xl mx-auto p-6"> <router-view :key="dataRefreshTrigger" /> </div> </div
  >
</template>

