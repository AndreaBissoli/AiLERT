<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { isAdmin } from "../utils/auth";

const router = useRouter();
const isLoggedIn = ref(false);
const userIsAdmin = ref(false);
const dropdownOpen = ref(false);
const userName = ref("");
const userEmail = ref("");
const isMobileMenuOpen = ref(false);

// Check if token exists in localStorage
const checkLoginStatus = () => {
  const token = localStorage.getItem("token");
  isLoggedIn.value = !!token;
  userIsAdmin.value = isAdmin();

  // Get user info from localStorage if available
  const userInfo = localStorage.getItem("userInfo");
  if (userInfo) {
    try {
      const parsedInfo = JSON.parse(userInfo);
      userName.value = parsedInfo.name || "Utente";
      userEmail.value = parsedInfo.email || "";
    } catch (e) {
      console.error("Error parsing user info:", e);
    }
  }
};

const handleAuthChange = () => {
  checkLoginStatus();
};

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;

  // Blocca/sblocca lo scroll quando il menu è aperto/chiuso
  if (isMobileMenuOpen.value) {
    document.body.classList.add("overflow-hidden");
  } else {
    document.body.classList.remove("overflow-hidden");
  }
};

// Chiudi menu mobile quando si naviga
const navigateAndCloseMenu = path => {
  isMobileMenuOpen.value = false;
  document.body.classList.remove("overflow-hidden");
  router.push(path);
};

// Close dropdown when clicking outside
const closeDropdown = e => {
  if (dropdownOpen.value && !e.target.closest(".user-dropdown")) {
    dropdownOpen.value = false;
  }
};

const goToChangePassword = () => {
  dropdownOpen.value = false;
  router.push("/change-password");
};

onMounted(() => {
  checkLoginStatus();
  // Add event listener for auth state changes
  window.addEventListener("auth-changed", handleAuthChange);
  // Check login status when route changes
  router.afterEach(checkLoginStatus);
  // Add click listener to close dropdown
  document.addEventListener("click", closeDropdown);

  router.afterEach(() => {
    isMobileMenuOpen.value = false;
    document.body.classList.remove("overflow-hidden");
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("auth-changed", handleAuthChange);
  document.removeEventListener("click", closeDropdown);
  document.body.classList.remove("overflow-hidden");
});

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userInfo");
  isLoggedIn.value = false;
  userIsAdmin.value = false;
  dropdownOpen.value = false;
  // Chiudi il menu mobile se aperto
  isMobileMenuOpen.value = false;
  document.body.classList.remove("overflow-hidden");
  // Dispatch event to notify other components
  window.dispatchEvent(new Event("auth-changed"));
  router.push("/");
};
</script>

<template>
   <header class="sticky top-0 z-[9999] bg-white border-b border-gray-100"
    > <div class="max-w-7xl mx-auto px-4"
      > <nav class="flex items-center justify-between h-16"
        > <router-link to="/" class="flex items-center space-x-3 group z-20 relative"
          > <div
            class="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-200"
            > <span class="text-lg font-bold text-white">Ai</span> </div
          > <span
            class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            > LERT </span
          > </router-link
        > <div class="hidden md:flex items-center space-x-8"
          > <router-link
            to="/"
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
            > Home </router-link
          > <router-link
            to="/map"
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
            > Mappa </router-link
          > <router-link
            v-if="isLoggedIn && !userIsAdmin"
            to="/dashboard"
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
            > Dashboard </router-link
          > <router-link
            v-if="isLoggedIn && !userIsAdmin"
            to="/cameras"
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
            > Telecamere </router-link
          > <router-link
            v-if="isLoggedIn && userIsAdmin"
            to="/users"
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-200"
            > Admin </router-link
          > </div
        > <div class="hidden md:flex items-center space-x-4"
          > <template v-if="!isLoggedIn"
            > <router-link
              to="/login"
              class="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-2.5 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              > Accedi </router-link
            > </template
          > <template v-else
            > <div class="relative user-dropdown"
              > <button
                @click.stop="toggleDropdown"
                class="flex items-center space-x-2 bg-white border border-gray-200 rounded-full py-1.5 pl-1.5 pr-3 hover:bg-gray-50 transition-colors"
                > <div
                  class="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm"
                  > {{ userName.charAt(0).toUpperCase() }} </div
                > <span class="text-sm font-medium text-gray-700">{{ userName }}</span
                > <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-gray-500"
                  :class="{ 'rotate-180': dropdownOpen }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                   </svg
                > </button
              > <div
                v-show="dropdownOpen"
                class="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg py-2 border border-gray-100 z-50"
                > <div class="px-4 py-3 border-b border-gray-100"
                  > <p class="text-sm font-medium text-gray-900">{{ userName }}</p
                  > <p class="text-xs text-gray-500 truncate">{{ userEmail }}</p
                  > </div
                > <div class="py-1"
                  > <a
                    @click="goToChangePassword"
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    > <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 mr-3 text-gray-400"
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
                    > Cambia Password </a
                  > <a
                    @click="logout"
                    class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    > <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 mr-3 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >

                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                       </svg
                    > Esci </a
                  > </div
                > </div
              > </div
            > </template
          > </div
        > <div class="md:hidden flex items-center space-x-4 z-20 relative"
          > <router-link
            v-if="!isLoggedIn"
            to="/login"
            class="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-4 py-1.5 text-sm rounded-full shadow-sm"
            > Accedi </router-link
          > <div
            v-if="isLoggedIn"
            class="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm"
            > {{ userName.charAt(0).toUpperCase() }} </div
          > <button
            @click="toggleMobileMenu"
            class="p-1.5 focus:outline-none"
            aria-label="Toggle mobile menu"
            > <svg
              v-if="!isMobileMenuOpen"
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
               </svg
            > <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-gray-700"
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
        > </nav
      > </div
    > <transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
      > <div v-if="isMobileMenuOpen" class="fixed inset-0 bg-white z-[9999] md:hidden"
        > <div class="h-full overflow-y-auto pt-20 pb-6 px-6"
          > <div class="flex flex-col space-y-4 text-lg mb-8"
            > <button
              @click="navigateAndCloseMenu('/')"
              class="flex items-center py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >

                <path
                  d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
                />
                 </svg
              > Home </button
            > <button
              @click="navigateAndCloseMenu('/map')"
              class="flex items-center py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >

                <path
                  fill-rule="evenodd"
                  d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
                  clip-rule="evenodd"
                />
                 </svg
              > Mappa </button
            > <button
              v-if="isLoggedIn && !userIsAdmin"
              @click="navigateAndCloseMenu('/dashboard')"
              class="flex items-center py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >

                <path
                  d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"
                />
                 </svg
              > Dashboard </button
            > <button
              v-if="isLoggedIn && !userIsAdmin"
              @click="navigateAndCloseMenu('/cameras')"
              class="flex items-center py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >

                <path
                  d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-.447-.894l-2 1z"
                />
                 </svg
              > Telecamere </button
            > <button
              v-if="isLoggedIn && userIsAdmin"
              @click="navigateAndCloseMenu('/users')"
              class="flex items-center py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >

                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clip-rule="evenodd"
                />
                 </svg
              > Admin </button
            > </div
          > <div class="border-t border-gray-200 my-4"></div> <div
            v-if="isLoggedIn"
            class="flex flex-col space-y-4"
            > <div class="p-4 bg-gray-50 rounded-lg"
              > <p class="font-medium text-gray-900">{{ userName }}</p
              > <p class="text-sm text-gray-500 truncate">{{ userEmail }}</p
              > </div
            > <button
              @click="navigateAndCloseMenu('/change-password')"
              class="flex items-center py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >

                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
                 </svg
              > Cambia Password </button
            > <button
              @click="logout"
              class="flex items-center py-3 px-4 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              > <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >

                <path
                  fill-rule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clip-rule="evenodd"
                />
                 </svg
              > Esci </button
            > </div
          > <div v-if="!isLoggedIn" class="mt-8"
            > <button
              @click="navigateAndCloseMenu('/login')"
              class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg text-center"
              > Accedi </button
            > </div
          > </div
        > </div
      > </transition
    > </header
  >
</template>

<style scoped>
/* Utility per evitare bug di visualizzazione */
.overflow-hidden {
  overflow: hidden;
  height: 100%;
  position: fixed;
  width: 100%;
}
</style>

