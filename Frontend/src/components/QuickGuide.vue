<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close"]);
const blurActive = ref(false);

// Attiva la sfocatura con un ritardo dopo l'apertura
watch(
  () => props.isOpen,
  newValue => {
    if (newValue) {
      // Piccolo timeout per permettere la transizione
      setTimeout(() => {
        blurActive.value = true;
      }, 50);
    } else {
      blurActive.value = false;
    }
  },
  { immediate: true }
);

const closeGuide = () => {
  blurActive.value = false;
  // Piccolo ritardo per permettere l'animazione di chiusura
  setTimeout(() => {
    emit("close");
  }, 300);
};
</script>

<template>
   <div v-show="isOpen" class="fixed inset-0 z-[100] overflow-auto" style="pointer-events: none"
    > <div class="flex items-center justify-center min-h-screen p-4" style="pointer-events: none"
      > <div
        class="fixed inset-0 bg-blue bg-opacity-50 transition-all duration-300 ease-in-out"
        :class="{ 'backdrop-blur-sm': blurActive, 'backdrop-blur-none': !blurActive }"
        @click="closeGuide"
        style="pointer-events: auto"
      ></div
      > <div
        class="bg-white rounded-xl shadow-xl p-6 md:p-8 max-w-2xl w-full relative z-[101] border border-gray-200 ring-1 ring-gray-200 shadow-2xl transition-all duration-300 ease-in-out"
        :class="{ 'opacity-100 scale-100': blurActive, 'opacity-0 scale-95': !blurActive }"
        style="pointer-events: auto"
        > <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-100"
          > <div class="flex items-center space-x-3"
            > <div
              class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
              > <span class="text-lg font-bold text-white">Ai</span> </div
            > <h2 class="text-2xl font-bold text-gray-900">Guida Rapida</h2> </div
          > <button @click="closeGuide" class="p-2 rounded-full hover:bg-gray-100 transition-colors"
            > <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
               </svg
            > </button
          > </div
        > <div class="space-y-6 text-gray-600"
          > <section
            > <h3 class="text-xl font-semibold text-gray-800 mb-2">Benvenuto in AiLERT</h3> <p
              >AiLERT è un sistema di monitoraggio urbano per la città di Trento che rileva
              automaticamente incidenti stradali e ingorghi, permettendo una risposta rapida dei
              servizi di emergenza.</p
            > </section
          > <section
            > <h3 class="text-xl font-semibold text-gray-800 mb-2">Visualizzazione Eventi</h3> <p
              >Sulla homepage puoi visualizzare gli eventi stradali recenti (ultimi 120 minuti). Gli
              eventi sono rappresentati con colori diversi in base alla tipologia:</p
            > <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3"
              > <div class="flex items-center p-3 bg-red-50 rounded-lg"
                > <span class="mr-2 text-lg">🚨</span> <div
                  > <span class="font-medium text-red-800">Incidente</span> <p class="text-sm"
                    >Collisioni o incidenti stradali</p
                  > </div
                > </div
              > <div class="flex items-center p-3 bg-orange-50 rounded-lg"
                > <span class="mr-2 text-lg">🚧</span> <div
                  > <span class="font-medium text-orange-800">Ingorgo</span> <p class="text-sm"
                    >Rallentamenti e congestioni</p
                  > </div
                > </div
              > </div
            > </section
          > <section
            > <h3 class="text-xl font-semibold text-gray-800 mb-2">Filtri e Ordinamento</h3> <p
              >Puoi ordinare gli eventi in due modi:</p
            > <ul class="list-disc pl-6 mt-2 space-y-2"
              > <li
                ><span class="font-medium">Più recenti</span>: Visualizza prima gli eventi accaduti
                più di recente</li
              > <li
                ><span class="font-medium">Gravità</span>: Ordina gli eventi in base alla loro
                gravità (Alta → Media → Bassa)</li
              > </ul
            > </section
          > <section
            > <h3 class="text-xl font-semibold text-gray-800 mb-2">Stati degli Eventi</h3> <div
              class="mt-3 space-y-3"
              > <div class="flex items-center"
                > <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 mr-3"
                  >Risolto</span
                > <span>L'evento è stato risolto e non rappresenta più un problema</span> </div
              > <div class="flex items-center"
                > <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 mr-3"
                  >In corso</span
                > <span>L'evento è attualmente in fase di gestione</span> </div
              > <div class="flex items-center"
                > <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 mr-3"
                  >Non risolto</span
                > <span>L'evento è stato confermato ma non ancora risolto</span> </div
              > </div
            > </section
          > <section
            > <h3 class="text-xl font-semibold text-gray-800 mb-2">Mappa Eventi</h3> <p
              >Puoi visualizzare tutti gli eventi su una mappa interattiva cliccando su "Mappa"
              nella barra di navigazione. La mappa ti mostra la posizione esatta degli eventi e
              ulteriori dettagli. </p
            > </section
          > <section
            > <h3 class="text-xl font-semibold text-gray-800 mb-2">Accesso Riservato</h3> <p
              >Se sei un operatore autorizzato (Sorvegliante o Dipendente Comunale), puoi accedere
              al sistema completo tramite il pulsante "Accedi" in alto a destra.</p
            > </section
          > </div
        > <div class="mt-8 pt-4 border-t border-gray-100 flex justify-end"
          > <button
            @click="closeGuide"
            class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            > Ho capito </button
          > </div
        > </div
      > </div
    > </div
  >
</template>

<style scoped>
.backdrop-blur-none {
    backdrop-filter: blur(0px);
}

.backdrop-blur-sm {
    backdrop-filter: blur(4px);
}

.fixed {
    position: fixed;
}
</style>

