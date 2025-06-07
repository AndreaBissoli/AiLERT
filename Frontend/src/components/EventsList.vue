<script setup>
import { onMounted, ref, computed } from "vue";

const events = ref([]);
const error = ref(null);
const currentPage = ref(1);
const eventsPerPage = 10;

// Computed per gli eventi della pagina corrente
const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * eventsPerPage;
  const end = start + eventsPerPage;
  return events.value.slice(start, end);
});

// Computed per il numero totale di pagine
const totalPages = computed(() => {
  return Math.ceil(events.value.length / eventsPerPage);
});

// Computed per controllare se ci sono pagine precedenti/successive
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

onMounted(async () => {
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
    > <div v-if="error" class="text-red-500 mb-6 p-4 bg-red-50 rounded-lg border border-red-200"
      > {{ error }} </div
    > <div v-if="events.length > 0" class="mb-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg"
      > Mostrando {{ (currentPage - 1) * eventsPerPage + 1 }} - {{
        Math.min(currentPage * eventsPerPage, events.length)
      }} di {{ events.length }} eventi </div
    > <div v-if="paginatedEvents.length > 0" class="space-y-6 mb-8"
      > <div
        v-for="event in paginatedEvents"
        :key="event._id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mx-2 hover:shadow-md transition-all duration-200"
        > <div class="flex items-start justify-between mb-4"
          > <h3 class="font-bold text-xl text-gray-900">{{ event.title }}</h3
          > <div class="flex space-x-2"
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
        > <p v-if="event.description" class="text-gray-600 mb-4">{{ event.description }}</p
        > <div class="flex items-center text-sm text-gray-600 space-x-4"
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
