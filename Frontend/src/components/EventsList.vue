<script setup>
import { onMounted, ref, computed } from "vue";
import { jwtDecode } from "jwt-decode";
import AlertMessage from "./AlertMessage.vue";

const events = ref([]);
const error = ref(null);
const successMessage = ref("");
const currentPage = ref(1);
const eventsPerPage = 10;

const editingEventId = ref(null);
const editingDescription = ref("");
const savingDescription = ref(false);

const resolvingEventId = ref(null);
const showResolveControls = ref({});

const userRole = computed(() => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.role;
  } catch {
    return null;
  }
});

const canManageEvents = computed(() => {
  return userRole.value === "sorvegliante" || userRole.value === "dipendentecomunale";
});

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * eventsPerPage;
  const end = start + eventsPerPage;
  return events.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(events.value.length / eventsPerPage);
});

const hasPreviousPage = computed(() => currentPage.value > 1);
const hasNextPage = computed(() => currentPage.value < totalPages.value);

const pageNumbers = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
});

const goToPage = page => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const nextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (hasPreviousPage.value) {
    currentPage.value--;
  }
};

const fetchEvents = async () => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/v1/events", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Errore nel recupero eventi");
    events.value = await res.json();
  } catch (err) {
    error.value = err.message;
  }
};

const startEditingDescription = event => {
  editingEventId.value = event._id;
  editingDescription.value = event.description || "";
  Object.keys(showResolveControls.value).forEach(id => {
    showResolveControls.value[id] = false;
  });
};

const cancelEditingDescription = () => {
  editingEventId.value = null;
  editingDescription.value = "";
};

const saveDescription = async event => {
  try {
    savingDescription.value = true;
    error.value = "";

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token non trovato");
    }

    const updateData = {
      description: editingDescription.value.trim(),
      updatedAt: new Date(),
    };

    const response = await fetch(`/api/v1/events/${event._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore nell'aggiornamento della descrizione");
    }

    const updatedEvent = await response.json();

    const eventIndex = events.value.findIndex(e => e._id === event._id);
    if (eventIndex !== -1) {
      events.value[eventIndex] = updatedEvent;
    }

    successMessage.value = `Descrizione aggiornata per "${event.title}"!`;
    cancelEditingDescription();

    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (err) {
    console.error("Errore:", err);
    error.value = err.message;
  } finally {
    savingDescription.value = false;
  }
};

const toggleResolveControls = eventId => {
  showResolveControls.value[eventId] = !showResolveControls.value[eventId];
  Object.keys(showResolveControls.value).forEach(id => {
    if (id !== eventId) {
      showResolveControls.value[id] = false;
    }
  });
  if (editingEventId.value) {
    cancelEditingDescription();
  }
};

const markAsResolved = async event => {
  try {
    resolvingEventId.value = event._id;
    error.value = "";
    successMessage.value = "";

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token non trovato");
    }

    const updateData = {
      status: "solved",
      updatedAt: new Date(),
    };

    const response = await fetch(`/api/v1/events/${event._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore nell'aggiornamento dell'evento");
    }

    const updatedEvent = await response.json();

    const eventIndex = events.value.findIndex(e => e._id === event._id);
    if (eventIndex !== -1) {
      events.value[eventIndex] = updatedEvent;
    }

    successMessage.value = `Evento "${event.title}" contrassegnato come risolto!`;
    showResolveControls.value[event._id] = false;

    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (err) {
    console.error("Errore:", err);
    error.value = err.message;
  } finally {
    resolvingEventId.value = null;
  }
};

const canResolveEvent = event => {
  return (
    canManageEvents.value &&
    event.status !== "solved" &&
    event.status !== "false_alarm" &&
    event.confirmed !== false
  );
};

const isEventNotConfirmed = event => {
  return event.confirmed === false || (event.status === "pending" && !event.confirmed);
};

onMounted(async () => {
  await fetchEvents();
});

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
  const translations = {
    incidente: "Incidente",
    ingorgo: "Ingorgo",
  };
  return translations[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

const translateStatus = status => {
  const translations = {
    solved: "Risolto",
    pending: "In corso",
    unsolved: "Non risolto",
    false_alarm: "Falso allarme",
  };
  return translations[status] || status;
};

const getEventTypeStyle = type => {
  if (type === "incidente") {
    return {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
    };
  }
  if (type === "ingorgo") {
    return {
      bg: "bg-orange-100",
      text: "text-orange-800",
      border: "border-orange-200",
    };
  }
  return {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
  };
};

const getStatusStyle = status => {
  if (status === "solved") {
    return {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
    };
  }
  if (status === "pending") {
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
    };
  }
  if (status === "unsolved") {
    return {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
    };
  }
  return {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
  };
};
</script>

<template>
   <div class="px-6 py-4"
    > <AlertMessage v-if="error" :message="error" type="error" class="mb-4" /> <AlertMessage
      v-if="successMessage"
      :message="successMessage"
      type="success"
      class="mb-4"
    /> <div v-if="events.length > 0" class="mb-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg"
      > Mostrando {{ (currentPage - 1) * eventsPerPage + 1 }} - {{
        Math.min(currentPage * eventsPerPage, events.length)
      }} di {{ events.length }} eventi </div
    > <div v-if="paginatedEvents.length > 0" class="space-y-6 mb-8"
      > <div
        v-for="event in paginatedEvents"
        :key="event._id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mx-2 hover:shadow-md transition-all duration-200"
        > <div class="flex items-start justify-between mb-4"
          > <h3 class="font-bold text-xl text-gray-900 flex-1 pr-4">{{ event.title }}</h3
          > <div class="flex space-x-2 flex-shrink-0"
            > <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
              :class="[
                getEventTypeStyle(event.type).bg,
                getEventTypeStyle(event.type).text,
                getEventTypeStyle(event.type).border,
              ]"
              > {{ translateEventType(event.type) }} </span
            > <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
              :class="[
                getStatusStyle(event.status).bg,
                getStatusStyle(event.status).text,
                getStatusStyle(event.status).border,
              ]"
              > {{ translateStatus(event.status) }} </span
            > </div
          > </div
        > <div class="mb-4"
          > <div v-if="editingEventId !== event._id"
            > <p v-if="event.description" class="text-gray-600">{{ event.description }}</p
            > <p v-else class="text-gray-400 italic">Nessuna descrizione</p> </div
          > <div v-else class="bg-blue-50 border border-blue-200 rounded-lg p-4"
            > <label class="block text-sm font-medium text-blue-800 mb-2"
              > Modifica descrizione: </label
            > <textarea
              v-model="editingDescription"
              class="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="3"
              placeholder="Inserisci una descrizione per questo evento..."
              :disabled="savingDescription"
            ></textarea
            > <div class="flex justify-end space-x-2 mt-3"
              > <button
                @click="cancelEditingDescription"
                :disabled="savingDescription"
                class="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 rounded transition-colors disabled:opacity-50"
                > Annulla </button
              > <button
                @click="saveDescription(event)"
                :disabled="savingDescription"
                class="flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
                > <svg
                  v-if="savingDescription"
                  class="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
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
                > {{ savingDescription ? "Salvando..." : "Salva" }} </button
              > </div
            > </div
          > </div
        > <div class="flex items-center text-sm text-gray-600 space-x-4 mb-4"
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
            > {{ formatDate(event.eventDate) }} </div
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
            > {{ event.location.address }} </div
          > </div
        > <div v-if="event.notifiedServices && event.notifiedServices.length > 0" class="mb-4"
          > <div class="text-sm font-medium text-gray-600 mb-1">Servizi allertati:</div> <div
            class="flex flex-wrap gap-1"
            > <span
              v-for="service in event.notifiedServices"
              :key="service.service"
              class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              > {{ service.service }} </span
            > </div
          > </div
        > <div class="flex justify-center space-x-3"
          > <button
            v-if="canManageEvents && editingEventId !== event._id"
            @click="startEditingDescription(event)"
            class="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors px-3 py-2 rounded hover:bg-blue-50"
            > <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
               </svg
            > Modifica Descrizione </button
          > <div v-if="canResolveEvent(event)"
            > <button
              v-if="!showResolveControls[event._id]"
              @click="toggleResolveControls(event._id)"
              class="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
                  d="M5 13l4 4L19 7"
                />
                 </svg
              > Contrassegna come Risolto </button
            > <div v-else class="bg-green-50 border border-green-200 rounded-lg p-4"
              > <h4 class="font-medium text-green-800 mb-2">Conferma risoluzione</h4> <p
                class="text-sm text-green-700 mb-4"
                > Sei sicuro di voler contrassegnare questo evento come risolto? </p
              > <div class="flex justify-center space-x-2"
                > <button
                  @click="markAsResolved(event)"
                  :disabled="resolvingEventId === event._id"
                  class="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded text-sm transition-colors disabled:opacity-50"
                  > <svg
                    v-if="resolvingEventId === event._id"
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
                  > {{ resolvingEventId === event._id ? "Salvando..." : "Conferma" }} </button
                > <button
                  @click="toggleResolveControls(event._id)"
                  :disabled="resolvingEventId === event._id"
                  class="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-3 rounded text-sm transition-colors disabled:opacity-50"
                  > Annulla </button
                > </div
              > </div
            > </div
          > <div
            v-else-if="event.status === 'solved'"
            class="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg"
            > <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
               </svg
            > <span class="text-sm font-medium">Evento risolto</span> </div
          > <div
            v-else-if="isEventNotConfirmed(event)"
            class="flex items-center text-orange-600 bg-orange-50 px-3 py-2 rounded-lg"
            > <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
               </svg
            > <div class="flex flex-col items-center text-center"
              > <span class="text-sm font-medium">Evento non ancora confermato:</span> <span
                class="text-sm font-medium"
                >impossibile contrassegnare come risolto</span
              > </div
            > </div
          > </div
        > </div
      > </div
    > <div v-else-if="!error && events.length === 0" class="text-center py-16 mx-4"
      > <div class="text-gray-500"
        > <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 mx-auto mb-4 text-gray-400"
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
        > <p class="text-lg font-medium">Nessun evento trovato</p> <p class="text-sm"
          >Non ci sono eventi da visualizzare al momento.</p
        > </div
      > </div
    > <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-6"
      > <button
        @click="previousPage"
        :disabled="!hasPreviousPage"
        class="flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
            d="M15 19l-7-7 7-7"
          />
           </svg
        > Precedente </button
      > <div class="flex space-x-2"
        > <template v-if="pageNumbers[0] > 1"
          > <button
            @click="goToPage(1)"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            > 1 </button
          > <span v-if="pageNumbers[0] > 2" class="px-3 py-2 text-gray-500 select-none">...</span>
          </template
        > <button
          v-for="page in pageNumbers"
          :key="page"
          @click="goToPage(page)"
          :class="[
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50',
            'px-4 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200',
          ]"
          > {{ page }} </button
        > <template v-if="pageNumbers[pageNumbers.length - 1] < totalPages"
          > <span
            v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1"
            class="px-3 py-2 text-gray-500 select-none"
            >...</span
          > <button
            @click="goToPage(totalPages)"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            > {{ totalPages }} </button
          > </template
        > </div
      > <button
        @click="nextPage"
        :disabled="!hasNextPage"
        class="flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        > Successivo <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 ml-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >

          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
           </svg
        > </button
      > </div
    > </div
  >
</template>
