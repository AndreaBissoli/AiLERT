<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import AlertMessage from "../AlertMessage.vue";

const router = useRouter();
const route = useRoute();
const userId = route.params.id;

const userData = ref({
  email: "",
  name: "",
  role: "",
});

const isLoading = ref(true);
const isDeleting = ref(false);
const errorMessage = ref("");
const confirmDeleteModal = ref(false);
const successMessage = ref("");

const roleNames = {
  amministratore: "Amministratore",
  sorvegliante: "Sorvegliante",
  dipendentecomunale: "Dipendente Comunale",
};

const fetchUserDetails = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token non trovato. Effettua nuovamente il login.");
    }

    console.log(`Fetching user details for ID: ${userId}`);

    const response = await fetch(`/api/v1/admin/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore nel caricamento dei dettagli utente");
    }

    const data = await response.json();
    console.log("Received user data:", data);

    userData.value = {
      email: data.email || "",
      name: data.name || "",
      role: data.role || "dipendentecomunale",
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const deleteUser = async () => {
  if (isDeleting.value) return;

  isDeleting.value = true;
  errorMessage.value = "";
  confirmDeleteModal.value = false;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/v1/admin/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Errore durante l'eliminazione dell'utente");
    }

    successMessage.value = "Utente eliminato con successo";

    // Navigate to users list after success
    setTimeout(() => {
      router.push({ name: "admin-users" });
    }, 1500);
  } catch (error) {
    console.error("Error deleting user:", error);
    errorMessage.value = error.message;
  } finally {
    isDeleting.value = false;
  }
};

const editUser = () => {
  router.push({ name: "admin-user-edit", params: { id: userId } });
};

const goBack = () => {
  router.push({ name: "admin-users" });
};

onMounted(() => {
  fetchUserDetails();
});
</script>

<template>
   <div
    > <div class="mb-6"
      > <button
        @click="goBack"
        class="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        > <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >

          <path
            fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
           </svg
        > Torna agli utenti </button
      > </div
    > <AlertMessage v-if="errorMessage" :message="errorMessage" type="error" class="mb-4" />
    <AlertMessage v-if="successMessage" :message="successMessage" type="success" class="mb-4" />
    <div
      v-if="isLoading"
      class="bg-white rounded-2xl shadow-md p-8 flex justify-center items-center"
      > <div class="flex flex-col items-center"
        > <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div> <p
          class="text-gray-500"
          >Caricamento dettagli utente...</p
        > </div
      > </div
    > <div v-else class="bg-white rounded-2xl shadow-md overflow-hidden"
      > <div class="p-6 border-b border-gray-200"
        > <h2 class="text-2xl font-bold text-gray-800">Dettagli Utente</h2> </div
      > <div class="p-6"
        > <div class="grid grid-cols-1 md:grid-cols-2 gap-6"
          > <div
            > <h3 class="text-sm font-medium text-gray-500 mb-1">Email</h3> <p
              class="text-base text-gray-900"
              >{{ userData.email || "N/A" }}</p
            > </div
          > <div
            > <h3 class="text-sm font-medium text-gray-500 mb-1">Nome</h3> <p
              class="text-base text-gray-900"
              >{{ userData.name || "Non specificato" }}</p
            > </div
          > <div
            > <h3 class="text-sm font-medium text-gray-500 mb-1">Ruolo</h3> <p
              class="text-base text-gray-900"
              >{{ roleNames[userData.role] || userData.role }}</p
            > </div
          > </div
        > <div class="mt-6 flex flex-col sm:flex-row gap-3"
          > <button
            @click="editUser"
            class="bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors px-5 py-2 rounded-lg flex items-center justify-center"
            > <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >

              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
              />
               </svg
            > Modifica </button
          > <button
            @click="confirmDeleteModal = true"
            class="bg-red-100 text-red-700 hover:bg-red-200 transition-colors px-5 py-2 rounded-lg flex items-center justify-center"
            > <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >

              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
               </svg
            > Elimina </button
          > </div
        > </div
      > </div
    > <div
      v-if="confirmDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      > <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
        > <h3 class="text-xl font-bold text-gray-900 mb-4">Conferma eliminazione</h3> <p
          class="text-gray-700 mb-6"
          > Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata. </p
        > <div class="flex justify-end space-x-3"
          > <button
            @click="confirmDeleteModal = false"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            > Annulla </button
          > <button
            @click="deleteUser"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            :disabled="isDeleting"
            > <svg
              v-if="isDeleting"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >

              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>

              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
               </svg
            > {{ isDeleting ? "Eliminazione..." : "Elimina" }} </button
          > </div
        > </div
      > </div
    > </div
  >
</template>

