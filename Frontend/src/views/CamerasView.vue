<script setup>
import { ref, onMounted, computed, onBeforeUnmount, onUnmounted } from "vue";
import DashboardNav from "../components/DashboardNav.vue";
import NotificationToast from "../components/NotificationToast.vue";
import WebSocketService from "../services/WebSocketService.js";
import LiteYouTubeEmbed from "vue-lite-youtube-embed";
import "vue-lite-youtube-embed/style.css";

const streams = ref([]);
const error = ref(null);
const loading = ref(true);
const currentPage = ref(0);
const streamsPerPage = 6;
const eventsData = ref([]);
const notifications = ref([]);
const websocketConnected = ref(false);

let wsUnsubscribe = null;

// Calcola il numero di pagine in base agli stream totali
const totalPages = computed(() => {
  return Math.ceil(streams.value.length / streamsPerPage);
});

const currentStreams = computed(() => {
  const start = currentPage.value * streamsPerPage;
  const end = start + streamsPerPage;
  return streams.value.slice(start, end);
});

const hasCameraIncident = cameraId => {
  return eventsData.value.some(
    event =>
      event.cameraId === cameraId &&
      event.type === "incidente" &&
      ["pending", "unsolved"].includes(event.status)
  );
};

const changePage = newPage => {
  if (newPage >= 0 && newPage < totalPages.value) {
    currentPage.value = newPage;
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

    if (!res.ok) throw new Error("Errore nel recupero degli eventi");

    const data = await res.json();
    eventsData.value = data;
  } catch (err) {
    console.error("Errore nel recupero degli eventi:", err);
    // Non impostiamo l'errore principale qui per non bloccare la visualizzazione delle telecamere
  }
};

const fetchStreams = async () => {
  const token = localStorage.getItem("token");
  loading.value = true;

  try {
    const res = await fetch("/api/v1/streams", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Errore nel recupero degli stream");

    const data = await res.json();

    // Ordina gli stream: prima quelli con incidenti, poi gli altri
    const streamsWithStatus = (data.streams || []).map(stream => ({
      ...stream,
      hasIncident: hasCameraIncident(stream.cameraId),
    }));

    // Ordina: prima quelli con incidenti
    streams.value = streamsWithStatus.sort((a, b) => {
      if (a.hasIncident && !b.hasIncident) return -1;
      if (!a.hasIncident && b.hasIncident) return 1;
      return 0;
    });
  } catch (err) {
    console.error("Errore:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await fetchEvents();
  await fetchStreams();
};

const viewStream = async streamId => {
  const token = localStorage.getItem("token");

  try {
    await fetch(`/api/v1/streams/view/${streamId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error("Errore nella registrazione della visualizzazione:", err);
  }
};

const addNotification = notification => {
  const id = Date.now() + Math.random();
  notifications.value.push({
    id,
    ...notification,
  });
};

const removeNotification = id => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

onMounted(async () => {
  refreshData();

  const token = localStorage.getItem("token");
  if (token) {
    WebSocketService.connect(token);
    websocketConnected.value = true;

    // Subscribe to notifications
    wsUnsubscribe = WebSocketService.on("notification", data => {
      console.log("Detection notification received in CamerasView:", data);
      addNotification(data);
    });
  }
});

onBeforeUnmount(() => {
  // Cleanup WebSocket subscription
  if (wsUnsubscribe) {
    wsUnsubscribe();
    wsUnsubscribe = null;
  }
});

onUnmounted(() => {
  WebSocketService.disconnect();
  websocketConnected.value = false;
});
</script>

<template>
   <div
    > <div class="fixed top-20 right-4 z-[10000] space-y-2"
      > <NotificationToast
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        :duration="5000"
        @close="removeNotification(notification.id)"
      /> </div
    > <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 mb-8"
      > <div class="max-w-7xl mx-auto relative"
        > <div class="text-center"
          > <h1 class="text-3xl font-bold mb-2">Telecamere di sorveglianza</h1> <p
            class="opacity-80"
            >Monitora le telecamere installate nel territorio di Trento</p
          > <div class="mt-2 flex justify-center"
            > <div class="flex items-center text-sm"
              > <div
                class="w-2 h-2 rounded-full mr-2"
                :class="{
                  'bg-green-400': websocketConnected,
                  'bg-red-400': !websocketConnected,
                }"
              ></div
              > <span class="opacity-75"
                > {{
                  websocketConnected
                    ? "Sistema di rilevamento attivo"
                    : "Sistema di rilevamento disconnesso"
                }} </span
              > </div
            > </div
          > </div
        > </div
      > </div
    > <div class="max-w-7xl mx-auto px-4"
      > <DashboardNav /> <div class="flex justify-end mb-6"
        > <button
          @click="refreshData"
          class="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          :disabled="loading"
          > <svg
            v-if="loading"
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
          > <svg
            v-else
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
             </svg
          > {{ loading ? "Aggiornamento..." : "Aggiorna dati" }} </button
        > </div
      > <div
        v-if="loading && streams.length === 0"
        class="bg-white rounded-2xl shadow-md p-12 text-center mb-8"
        > <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"
        ></div
        > <p class="text-lg text-gray-600">Caricamento telecamere in corso...</p> </div
      > <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-8"
        > {{ error }} </div
      > <div
        v-else-if="streams.length === 0"
        class="bg-white rounded-2xl shadow-md p-12 text-center mb-8"
        > <div
          class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
          > <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8 text-blue-600"
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
        > <p class="text-lg text-gray-600">Nessuna telecamera disponibile al momento.</p> </div
      > <div v-else
        > <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          > <div
            v-for="stream in currentStreams"
            :key="stream._id"
            class="bg-white rounded-2xl shadow-md border transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 overflow-hidden"
            :class="{
              'border-red-400': stream.hasIncident,
              'border-gray-100': !stream.hasIncident,
            }"
            > <div class="relative bg-gray-800 aspect-video flex items-center justify-center"
              > <div
                v-if="stream.hasIncident"
                class="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center animate-pulse z-10"
                > <span class="mr-1">⚠️</span> Incidente attivo </div
              > <div v-if="stream.streamKey === 'stream_piazza_duomo'" class="w-full h-full"
                > <LiteYouTubeEmbed
                  id="UGBfH55InbQ"
                  title="Trento live cam - centro città (Piazza Duomo)"
                  class="w-full h-full"
                  autoplay="true"
                /> </div
              > <div v-else class="text-center"
                > <div class="text-gray-300 mb-2">Stream RTSP</div> <div
                  class="text-sm text-gray-400"
                  >{{ stream.streamUrl }}</div
                > </div
              > </div
            > <div class="p-6"
              > <router-link
                :to="`/cameras/${stream._id}`"
                class="block hover:text-blue-600 transition-colors"
                @click="viewStream(stream._id)"
                > <h3
                  class="font-bold text-xl text-gray-900 mb-3 hover:text-blue-600 transition-colors"
                  >{{ stream.streamKey }}</h3
                > </router-link
              > <div class="space-y-2 text-sm"
                > <div class="flex items-center text-gray-600"
                  > <div class="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center mr-2"
                    > <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >

                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                       </svg
                    > </div
                  > <span>ID: {{ stream._id.substring(0, 8) }}...</span> </div
                > <div class="flex items-center text-gray-600"
                  > <div
                    class="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center mr-2"
                    > <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 text-purple-600"
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
                  > <span>Camera ID: {{ stream.cameraId.substring(0, 8) }}...</span> </div
                > <div class="flex items-center text-gray-600"
                  > <div
                    class="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center mr-2"
                    > <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 text-green-600"
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
                    > </div
                  > <span
                    >Attivo dal: {{
                      new Date(stream.startTime).toLocaleString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }}</span
                  > </div
                > <div class="flex items-center text-gray-600"
                  > <div
                    class="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center mr-2"
                    > <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >

                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />

                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                       </svg
                    > </div
                  > <span>Visualizzazioni: {{ stream.viewCount }}</span
                  > </div
                > </div
              > </div
            > </div
          > </div
        > <div class="flex justify-center mb-12"
          > <div
            class="inline-flex rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
            > <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 0"
              class="px-5 py-3 flex items-center"
              :class="
                currentPage === 0
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              "
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-1"
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
            > <div
              class="px-5 py-3 bg-white border-l border-r border-gray-100 text-gray-700 font-medium"
              > Pagina {{ currentPage + 1 }} di {{ totalPages || 1 }} </div
            > <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage >= totalPages - 1"
              class="px-5 py-3 flex items-center"
              :class="
                currentPage >= totalPages - 1
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              "
              > Successiva <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
                 </svg
              > </button
            > </div
          > </div
        > </div
      > </div
    > </div
  >
</template>

