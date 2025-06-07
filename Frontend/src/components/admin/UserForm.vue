<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import FormInput from "../FormInput.vue";
import AlertMessage from "../AlertMessage.vue";

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const route = useRoute();

const userId = computed(() => (props.isEditing ? route.params.id : null));
const formTitle = computed(() => (props.isEditing ? "Modifica Utente" : "Crea Nuovo Utente"));
const submitButtonText = computed(() => (props.isEditing ? "Salva Modifiche" : "Crea Utente"));

const email = ref("");
const name = ref("");
const password = ref("");
const role = ref("dipendentecomunale");

const isLoading = ref(false);
const isFetching = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const roles = [
  { value: "amministratore", label: "Amministratore" },
  { value: "sorvegliante", label: "Sorvegliante" },
  { value: "dipendentecomunale", label: "Dipendente Comunale" },
];

const fetchUserData = async () => {
  if (!props.isEditing) return;

  isFetching.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(`/api/v1/users/${userId.value}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user details");
    }

    const userData = await response.json();

    email.value = userData.email || "";
    name.value = userData.name || "";
    role.value = userData.role || "dipendentecomunale";
  } catch (error) {
    console.error("Error fetching user details:", error);
    errorMessage.value = error.message;
  } finally {
    isFetching.value = false;
  }
};

const handleSubmit = async () => {
  if (isLoading.value) return;

  errorMessage.value = "";
  successMessage.value = "";

  if (!email.value) {
    errorMessage.value = "L'email è obbligatoria";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    errorMessage.value = "L'email inserita non è valida";
    return;
  }

  // Password required for new users
  if (!props.isEditing && !password.value) {
    errorMessage.value = "La password è obbligatoria per i nuovi utenti";
    return;
  }

  isLoading.value = true;

  try {
    const requestBody = {
      email: email.value,
      name: name.value,
      role: role.value,
    };

    // Add password for new users
    if (!props.isEditing) {
      requestBody.password = password.value;
    }

    // Determine the API endpoint and method
    const url = props.isEditing ? `/api/v1/users/${userId.value}` : "/api/v1/users";

    const method = props.isEditing ? "PUT" : "POST";

    // Send the request
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save user");
    }

    successMessage.value = props.isEditing
      ? "Utente aggiornato con successo"
      : "Nuovo utente creato con successo";

    setTimeout(() => {
      router.push({ name: "admin-users" });
    }, 1500);
  } catch (error) {
    console.error("Error saving user:", error);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.push(
    props.isEditing
      ? { name: "admin-user-detail", params: { id: userId.value } }
      : { name: "admin-users" }
  );
};

onMounted(() => {
  if (props.isEditing) {
    fetchUserData();
  }
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
        > Indietro </button
      > </div
    > <div class="bg-white rounded-2xl shadow-soft overflow-hidden"
      > <div class="p-6 border-b border-gray-200"
        > <h2 class="text-2xl font-bold text-gray-800">{{ formTitle }}</h2
        > </div
      > <div v-if="isFetching" class="p-6 flex justify-center"
        > <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div> </div
      > <form v-else @submit.prevent="handleSubmit" class="p-6 space-y-6"
        > <AlertMessage v-if="errorMessage" :message="errorMessage" type="error" /> <AlertMessage
          v-if="successMessage"
          :message="successMessage"
          type="success"
        /> <FormInput
          v-model="email"
          type="email"
          label="Email"
          placeholder="esempio@email.com"
          required
        /> <FormInput v-model="name" type="text" label="Nome" placeholder="Nome Completo" />
        <FormInput
          v-if="!isEditing"
          v-model="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          required
        /> <div
          > <label class="block text-sm font-medium text-gray-700 mb-1">Ruolo</label> <select
            v-model="role"
            class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            > <option v-for="roleOption in roles" :key="roleOption.value" :value="roleOption.value"
              > {{ roleOption.label }} </option
            > </select
          > </div
        > <div class="pt-4"
          > <button
            type="submit"
            class="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
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
              > Salvataggio in corso... </span
            > <span v-else>{{ submitButtonText }}</span
            > </button
          > </div
        > </form
      > </div
    > </div
  >
</template>

