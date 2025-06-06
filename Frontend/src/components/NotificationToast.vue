<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
  duration: {
    type: Number,
    default: 5000,
  },
});

const emit = defineEmits(["close"]);

const visible = ref(false);
const progressWidth = ref(100);

onMounted(() => {
  // Show notification with animation
  setTimeout(() => {
    visible.value = true;
    setTimeout(() => {
      progressWidth.value = 0;
    }, 100);
  }, 50);

  // Auto-hide after duration
  setTimeout(() => {
    hideNotification();
  }, props.duration);
});

const hideNotification = () => {
  visible.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};

const getSeverityStyle = severity => {
  switch (severity) {
    case "alta":
      return "bg-red-500 border-red-600";
    case "media":
      return "bg-orange-500 border-orange-600";
    case "bassa":
      return "bg-yellow-500 border-yellow-600";
    default:
      return "bg-blue-500 border-blue-600";
  }
};

const getSeverityIcon = severity => {
  switch (severity) {
    case "alta":
      return "🚨";
    case "media":
      return "⚠️";
    case "bassa":
      return "💡";
    default:
      return "🔔";
  }
};
</script>

<template>
   <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform translate-x-full opacity-0 scale-95"
    enter-to-class="transform translate-x-0 opacity-100 scale-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="transform translate-x-0 opacity-100 scale-100"
    leave-to-class="transform translate-x-full opacity-0 scale-95"
    > <div
      v-if="visible"
      class="fixed top-4 right-4 z-[10000] max-w-sm w-full bg-white rounded-lg shadow-lg border"
      > <div class="p-4"
        > <div class="flex items-start"
          > <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm mr-3"
            :class="getSeverityStyle(notification.severity)"
            > {{ getSeverityIcon(notification.severity) }} </div
          > <div class="flex-1 min-w-0"
            > <div class="flex items-center justify-between"
              > <p class="text-sm font-semibold text-gray-900"> Rilevamento AI </p> <button
                @click="hideNotification"
                class="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                > <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                   </svg
                > </button
              > </div
            > <p class="text-sm text-gray-600 mt-1"> {{ notification.description }} </p> <div
              v-if="notification.location"
              class="mt-2 text-xs text-gray-500"
              > <div v-if="notification.location.address"
                > 📍 {{ notification.location.address }} </div
              > <div> 🕒 {{ new Date(notification.eventDate).toLocaleString("it-IT") }} </div> </div
            > </div
          > </div
        > </div
      > <div class="h-1 bg-gray-200 rounded-b-lg overflow-hidden"
        > <div
          class="h-full transition-all ease-linear"
          :class="getSeverityStyle(notification.severity)"
          :style="{
            width: `${progressWidth}%`,
            transitionDuration: `${duration - 150}ms`,
          }"
        ></div
        > </div
      > </div
    > </Transition
  >
</template>

