<script setup>
import { onMounted, ref } from 'vue'

const events = ref([])
const error = ref(null)

onMounted(async () => {
  const token = localStorage.getItem('token')

  try {
    const res = await fetch('http://localhost:8080/api/v1/events', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!res.ok) throw new Error('Errore nel recupero eventi')
    events.value = await res.json()
  } catch (err) {
    error.value = err.message
  }
})
</script>

<template>
  <div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <ul class="space-y-4">
      <li v-for="e in events" :key="e._id" class="p-4 border rounded shadow">
        <h2 class="font-semibold text-lg">{{ e.title }}</h2>
        <p class="text-sm text-gray-600">{{ e.type }} — {{ new Date(e.eventDate).toLocaleString() }}</p>
        <p class="text-sm text-gray-500">Status: {{ e.status }}</p>
        <p class="text-sm">{{ e.description }}</p>
      </li>
    </ul>
  </div>
</template>
