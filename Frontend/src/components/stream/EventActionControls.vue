<script setup>
import { ref, computed } from "vue";
import { jwtDecode } from "jwt-decode";
import AlertMessage from "../AlertMessage.vue";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  onEventUpdated: {
    type: Function,
    default: () => {},
  },
});

const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showControls = ref(false);

const eventStatus = ref(props.event.status || "pending");
const selectedServices = ref([]);

const availableServices = [
  { value: "polizia", label: "Polizia" },
  { value: "carabinieri", label: "Carabinieri"},
  { value: "vigili_del_fuoco", label: "Vigili del Fuoco"},
  { value: "ambulanza", label: "Ambulanza"},
  { value: "protezione_civile", label: "Protezione Civile"},
];

const canManageEvents = computed(() => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;
    const decoded = jwtDecode(token);
    return decoded.role === "sorvegliante";
  } catch {
    return false;
  }
});

const isEventProcessed = computed(() => {
  return props.event.confirmed || props.event.status === "false_alarm";
});

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "solved":
      return "bg-green-100 text-green-800 border-green-200";
    case "unsolved":
      return "bg-red-100 text-red-800 border-red-200";
    case "false_alarm":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "pending":
      return "In attesa";
    case "solved":
      return "Risolto";
    case "unsolved":
      return "Non risolto";
    case "false_alarm":
      return "Falso allarme";
    default:
      return status;
  }
};

const toggleControls = () => {
  showControls.value = !showControls.value;
  if (showControls.value) {
    eventStatus.value = props.event.status;
    selectedServices.value = [];
    errorMessage.value = "";
    successMessage.value = "";
  }
};

const setEventStatus = (status) => {
  eventStatus.value = status;
  if (status === "false_alarm") {
    selectedServices.value = [];
  }
};

const toggleService = (serviceValue) => {
  const index = selectedServices.value.indexOf(serviceValue);
  if (index > -1) {
    selectedServices.value.splice(index, 1);
  } else {
    selectedServices.value.push(serviceValue);
  }
};

const saveEventChanges = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token non trovato");
    }

    const decoded = jwtDecode(token);

    const updateData = {
      status: eventStatus.value,
      confirmed: eventStatus.value !== "false_alarm",
      updatedAt: new Date(),
    };

    if (eventStatus.value !== "false_alarm") {
      updateData.confirmedBy = decoded.id;
    }

    if (selectedServices.value.length > 0 && eventStatus.value !== "false_alarm") {
      updateData.notifiedServices = selectedServices.value.map(service => ({
        service: service,
        notifiedAt: new Date(),
      }));
    }

    const response = await fetch(`/api/v1/events/${props.event._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Errore nell'aggiornamento dell'evento");
    }

    const updatedEvent = await response.json();
    
    successMessage.value = "Evento aggiornato con successo!";
    
    setTimeout(() => {
      showControls.value = false;
      props.onEventUpdated(updatedEvent);
    }, 1500);

  } catch (error) {
    console.error("Errore:", error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const canSave = computed(() => {
  if (eventStatus.value === "false_alarm") {
    return true;
  }
  return eventStatus.value !== "pending" && selectedServices.value.length > 0;
});
</script>

<template>
  <div class="border-t border-gray-200 pt-3 mt-3">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-600">Stato:</span>
        <span
          class="px-2 py-1 rounded-full text-xs font-medium border"
          :class="getStatusBadgeClass(props.event.status)"
        >
          {{ getStatusLabel(props.event.status) }}
        </span>
      </div>

      <div v-if="props.event.confirmed" class="text-xs text-gray-500">
        Confermato
      </div>
    </div>

    <div v-if="props.event.notifiedServices && props.event.notifiedServices.length > 0" class="mb-3">
      <div class="text-sm font-medium text-gray-600 mb-1">Servizi allertati:</div>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="service in props.event.notifiedServices"
          :key="service.service"
          class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
        >
          {{ availableServices.find(s => s.value === service.service)?.label || service.service }}
        </span>
      </div>
    </div>

    <div v-if="canManageEvents && !isEventProcessed">
      <button
        @click="toggleControls"
        class="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
      >
        {{ showControls ? "Annulla" : "Gestisci Evento" }}
      </button>

      <div v-if="showControls" class="mt-3 p-3 bg-gray-50 rounded-lg border">
        <AlertMessage v-if="errorMessage" :message="errorMessage" type="error" class="mb-3" />
        <AlertMessage v-if="successMessage" :message="successMessage" type="success" class="mb-3" />

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Stato evento:</label>
          <div class="grid grid-cols-1 gap-2">
            
            <button
              @click="setEventStatus('unsolved')"
              :class="[
                'p-2 text-sm font-medium rounded-lg border transition-colors',
                eventStatus === 'unsolved'
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              ]"
            >
              Conferma - Evento Non Risolto
            </button>
            <button
              @click="setEventStatus('false_alarm')"
              :class="[
                'p-2 text-sm font-medium rounded-lg border transition-colors',
                eventStatus === 'false_alarm'
                  ? 'bg-gray-100 text-gray-800 border-gray-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              ]"
            >
            Falso Allarme
            </button>
          </div>
        </div>

        <div v-if="eventStatus !== 'false_alarm' && eventStatus !== 'pending'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Servizi da allertare:
            <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="service in availableServices"
              :key="service.value"
              @click="toggleService(service.value)"
              :class="[
                'p-2 text-sm font-medium rounded-lg border transition-colors text-left flex items-center space-x-2',
                selectedServices.includes(service.value)
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              ]"
            >
              <span>{{ service.label }}</span>
              <span v-if="selectedServices.includes(service.value)" class="ml-auto">✓</span>
            </button>
          </div>
        </div>

        <button
          @click="saveEventChanges"
          :disabled="!canSave || isLoading"
          class="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Salvando...
          </span>
          <span v-else>💾 Salva Modifiche</span>
        </button>
      </div>
    </div>

    <div v-else-if="isEventProcessed" class="text-sm text-gray-500 text-center py-2">
      {{ props.event.status === 'false_alarm' ? 'Marcato come falso allarme' : '✓ Evento già gestito. Vai su dashboard per marcare come risolto' }}

    </div>
  

    <div v-else-if="!canManageEvents" class="text-sm text-gray-500 text-center py-2">
      Solo i sorveglianti possono gestire gli eventi
    </div>
  </div>
</template>