<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import FormInput from "../components/FormInput.vue";
import AlertMessage from "../components/AlertMessage.vue";

const router = useRouter();
const newPassword = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const isLoading = ref(false);
const userName = ref("");

onMounted(() => {
  // Get user info from localStorage
  const userInfo = localStorage.getItem("userInfo");
  if (userInfo) {
    try {
      const parsedInfo = JSON.parse(userInfo);
      userName.value = parsedInfo.name || "Utente";
    } catch (e) {
      console.error("Error parsing user info:", e);
    }
  }

  // Check if user is logged in
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
  }
});

async function changePassword() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!newPassword.value) {
    errorMessage.value = "Inserisci una nuova password";
    return;
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = "La password deve contenere almeno 8 caratteri";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Le password non corrispondono";
    return;
  }

  isLoading.value = true;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/v1/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        newpassword: newPassword.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Errore durante il cambio della password");
    }

    successMessage.value = "Password modificata con successo!";
    newPassword.value = "";
    confirmPassword.value = "";

    // Redirect after success with a short delay
    setTimeout(() => {
      if (router.currentRoute.value.query.redirect) {
        router.push(router.currentRoute.value.query.redirect);
      } else {
        router.push("/dashboard");
      }
    }, 2000);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

function goBack() {
  router.back();
}
</script>

<template>
   <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4"
    > <div class="absolute inset-0 opacity-5 overflow-hidden"
      > <svg class="absolute top-10 left-10 w-32 h-32" viewBox="0 0 100 100" fill="currentColor">

        <circle cx="50" cy="20" r="2" class="text-blue-600" />

        <circle cx="20" cy="80" r="1.5" class="text-purple-600" />

        <circle cx="80" cy="60" r="1" class="text-blue-600" />
         </svg
      > <svg
        class="absolute bottom-20 right-20 w-40 h-40"
        viewBox="0 0 100 100"
        fill="currentColor"
      >

        <circle cx="30" cy="40" r="1" class="text-purple-600" />

        <circle cx="70" cy="70" r="2" class="text-blue-600" />

        <circle cx="50" cy="10" r="1.5" class="text-purple-600" />
         </svg
      > </div
    > <div class="relative w-full max-w-md"
      > <div class="absolute top-4 left-4"
        > <button
          @click="goBack"
          class="flex items-center text-blue-600 hover:text-blue-800 font-medium bg-white/80 rounded-lg px-3 py-1.5 transition-colors shadow-sm"
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
          > Indietro </button
        > </div
      > <div
        class="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 transform transition-all duration-300 hover:shadow-2xl"
        > <div class="text-center mb-8"
          > <div
            class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg transform hover:scale-110 transition-transform duration-200"
            > <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
               </svg
            > </div
          > <h2 class="text-2xl font-bold text-gray-900">Cambia Password</h2> <p
            class="text-gray-600 mt-2"
            >Ciao {{ userName }}, inserisci una nuova password</p
          > </div
        > <form @submit.prevent="changePassword" class="space-y-6"
          > <FormInput
            v-model="newPassword"
            type="password"
            label="Nuova Password"
            placeholder="••••••••••"
            required
          /> <FormInput
            v-model="confirmPassword"
            type="password"
            label="Conferma Password"
            placeholder="••••••••••"
            required
          /> <AlertMessage v-if="errorMessage" :message="errorMessage" type="error" /> <AlertMessage
            v-if="successMessage"
            :message="successMessage"
            type="success"
          /> <button
            type="submit"
            class="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            :disabled="isLoading"
            > <span v-if="isLoading" class="flex items-center justify-center"
              > <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              > Aggiornamento in corso... </span
            > <span v-else class="flex items-center justify-center"
              > Aggiorna Password <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
                 </svg
              > </span
            > <div
              class="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div
            > </button
          > </form
        > <div class="mt-8 bg-blue-50 rounded-xl p-3 border border-blue-100"
          > <p class="text-sm text-blue-800"
            > <span class="font-medium">Suggerimento di sicurezza:</span> Usa una password di almeno
            8 caratteri con lettere, numeri e simboli speciali. </p
          > </div
        > </div
      > </div
    > </div
  >
</template>

