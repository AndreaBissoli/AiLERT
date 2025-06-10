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
const userEvents = ref([]);
const isLoadingEvents = ref(false);
const eventsErrorMessage = ref("");

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

    const response = await fetch(`/api/v1/users/${userId}`, {
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

    // Fetch events if user is sorvegliante
    if (data.role === "sorvegliante") {
      fetchUserEvents();
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const fetchUserEvents = async () => {
  isLoadingEvents.value = true;
  eventsErrorMessage.value = "";

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token non trovato");
    }

    const response = await fetch(`/api/v1/users/${userId}/events`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 404 && errorData.errorCode === "NO_EVENTS_FOUND") {
        userEvents.value = [];
        return;
      }
      throw new Error(errorData.error || "Errore nel caricamento degli eventi");
    }

    userEvents.value = await response.json();
  } catch (error) {
    console.error("Error fetching user events:", error);
    eventsErrorMessage.value = error.message;
  } finally {
    isLoadingEvents.value = false;
  }
};

const formatDate = dateString => {
  return new Date(dateString).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const translateEventType = type => {
  if (type === "incidente") return "Incidente";
  if (type === "ingorgo") return "Ingorgo";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const translateStatus = status => {
  if (status === "solved") return "Risolto";
  if (status === "pending") return "In corso";
  if (status === "unsolved") return "Non risolto";
  if (status === "false_alarm") return "Falso allarme";
  return status;
};

const getEventTypeStyle = type => {
  if (type === "incidente") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  if (type === "ingorgo") {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const getStatusStyle = status => {
  if (status === "solved") {
    return "bg-green-100 text-green-800 border-green-200";
  }
  if (status === "pending") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
  if (status === "unsolved") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const deleteUser = async () => {
  if (isDeleting.value) return;

  isDeleting.value = true;
  errorMessage.value = "";
  confirmDeleteModal.value = false;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/v1/users/${userId}`, {
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
    > <div v-else class="bg-white rounded-2xl shadow-md overflow-hidden mb-6"
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
      v-if="userData.role === 'sorvegliante'"
      class="bg-white rounded-2xl shadow-md overflow-hidden"
      > <div class="p-6 border-b border-gray-200"
        > <h3 class="text-xl font-bold text-gray-800">Eventi Confermati</h3> <p
          class="text-sm text-gray-600 mt-1"
          > Eventi confermati da questo sorvegliante </p
        > </div
      > <div v-if="isLoadingEvents" class="p-6 flex justify-center"
        > <div class="flex flex-col items-center"
          > <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div> <p
            class="text-gray-500 text-sm"
            >Caricamento eventi...</p
          > </div
        > </div
      > <div v-else-if="eventsErrorMessage" class="p-6"
        > <AlertMessage :message="eventsErrorMessage" type="error" /> </div
      > <div v-else-if="userEvents.length === 0" class="p-6 text-center"
        > <div
          class="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3"
          > <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >

            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
             </svg
          > </div
        > <h4 class="text-lg font-medium text-gray-900 mb-1">Nessun evento confermato</h4> <p
          class="text-gray-600"
          >Questo sorvegliante non ha ancora confermato alcun evento.</p
        > </div
      > <div v-else class="divide-y divide-gray-200"
        > <div
          v-for="event in userEvents"
          :key="event._id"
          class="p-6 hover:bg-gray-50 transition-colors"
          > <div class="flex items-start justify-between mb-3"
            > <h4 class="text-lg font-semibold text-gray-900">{{ event.title }}</h4
            > <div class="flex space-x-2"
              > <span
                class="px-2 py-1 text-xs font-medium border rounded-full"
                :class="getEventTypeStyle(event.type)"
                > {{ translateEventType(event.type) }} </span
              > <span
                class="px-2 py-1 text-xs font-medium border rounded-full"
                :class="getStatusStyle(event.status)"
                > {{ translateStatus(event.status) }} </span
              > </div
            > </div
          > <p v-if="event.description" class="text-gray-600 mb-3"> {{ event.description }} </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600"
            > <div class="flex items-center"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                 </svg
              > <span>{{ formatDate(event.eventDate) }}</span
              > </div
            > <div v-if="event.location?.address" class="flex items-center"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
                 </svg
              > <span>{{ event.location.address }}</span
              > </div
            > </div
          > <div v-if="event.severity" class="mt-3"
            > <span class="text-xs text-gray-500">Gravità: </span> <span
              class="text-xs font-medium"
              :class="{
                'text-red-600': event.severity === 'alta',
                'text-orange-600': event.severity === 'media',
                'text-green-600': event.severity === 'bassa',
              }"
              > {{
                event.severity === "alta" ? "Alta" : event.severity === "media" ? "Media" : "Bassa"
              }} </span
            > </div
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

