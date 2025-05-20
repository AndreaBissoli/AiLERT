<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import StatisticsCard from '../components/statistics/StatisticsCard.vue';
import EventTypeDistribution from '../components/statistics/EventTypeDistribution.vue';
import EventStatusDistribution from '../components/statistics/EventStatusDistribution.vue';
import EventTimeTrend from '../components/statistics/EventTimeTrend.vue';
import EventsByCamera from '../components/statistics/EventsByCamera.vue';
import SeverityDistribution from '../components/statistics/SeverityDistribution.vue';
import HourlyDistribution from '../components/statistics/HourlyDistribution.vue';
import DashboardNav from '../components/DashboardNav.vue';

const router = useRouter();
const events = ref([]);
const cameras = ref([]);
const loading = ref(true);
const error = ref(null);
const dateRange = ref('month'); // 'week', 'month', 'year', 
const showCustomDatePicker = ref(false);
const startDate = ref('');
const endDate = ref('');

// Impostare le date predefinite per il selettore personalizzato
onMounted(() => {
    const today = new Date();
    // Data di fine: oggi
    endDate.value = formatDateForInput(today);

    // Data di inizio: un mese fa di default
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    startDate.value = formatDateForInput(oneMonthAgo);

    // Carica i dati
    fetchEvents();
    fetchCameras();
});

// Formatta la data per l'input type="date"
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Funzione per impostare il range di date
const setDateRange = (range) => {
    dateRange.value = range;
    showCustomDatePicker.value = range === 'custom';
};

// Funzione per applicare il filtro con date personalizzate
const applyCustomDateFilter = () => {
    if (startDate.value && endDate.value) {

        dateRange.value = 'custom';
        showCustomDatePicker.value = false; // Nascondi il selettore dopo l'applicazione
    }
};

// Filtra gli eventi in base al range di date selezionato
const filteredEvents = computed(() => {
    if (!events.value.length) return [];

    const now = new Date();
    let startFilterDate;

    if (dateRange.value === 'custom' && startDate.value && endDate.value) {

        startFilterDate = new Date(startDate.value);
        const endFilterDate = new Date(endDate.value);
        endFilterDate.setHours(23, 59, 59, 999); 

        return events.value.filter(event => {
            const eventDate = new Date(event.eventDate);
            return eventDate >= startFilterDate && eventDate <= endFilterDate;
        });
    }

    // Filtri predefiniti
    if (dateRange.value === 'week') {
        startFilterDate = new Date(now);
        startFilterDate.setDate(now.getDate() - 7);
    } else if (dateRange.value === 'month') {
        startFilterDate = new Date(now);
        startFilterDate.setMonth(now.getMonth() - 1);
    } else if (dateRange.value === 'year') {
        startFilterDate = new Date(now);
        startFilterDate.setFullYear(now.getFullYear() - 1);
    }

    return events.value.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= startFilterDate;
    });
});

// Statistiche calcolate - con valori predefiniti per evitare problemi di visualizzazione
const totalEvents = computed(() => filteredEvents.value.length || 0);
const totalIncidents = computed(() => filteredEvents.value.filter(e => e.type === 'incidente').length || 0);
const totalTrafficJams = computed(() => filteredEvents.value.filter(e => e.type === 'ingorgo').length || 0);
const activeEvents = computed(() => filteredEvents.value.filter(e => ['pending', 'unsolved'].includes(e.status)).length || 0);

// Fetch degli eventi
const fetchEvents = async () => {
    const token = localStorage.getItem('token');
    loading.value = true;

    try {
        const res = await fetch('/api/v1/events', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Errore nel recupero degli eventi');

        const data = await res.json();
        events.value = data;
    } catch (err) {
        console.error('Errore nel recupero degli eventi:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};
/* const fetchEvents = async () => {
    const token = localStorage.getItem('token');
    loading.value = true;

    try {
        // Simulazione di dati se in sviluppo o se non c'è token 
        if (!token || import.meta.env.DEV) {
            // Generiamo dei dati di esempio per sviluppo
            setTimeout(() => {
                const mockEvents = generateMockEvents(40); // Genera eventi di esempio
                events.value = mockEvents;
                loading.value = false;
            }, 500);
            return;
        }

        // Fetch reale dei dati
        const res = await fetch('/api/v1/events', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Errore nel recupero degli eventi');

        const data = await res.json();
        events.value = data;
    } catch (err) {
        console.error('Errore nel recupero degli eventi:', err);
        error.value = err.message;
        events.value = generateMockEvents(30);
    } finally {
        loading.value = false;
    }
}; */

const fetchCameras = async () => {
    const token = localStorage.getItem('token');

    try {
        // Simulazione di dati se in sviluppo o se non c'è token
        if (!token || import.meta.env.DEV) {
            cameras.value = generateMockCameras();
            return;
        }

        const res = await fetch('/api/v1/stream/list', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Errore nel recupero delle telecamere');

        const data = await res.json();
        cameras.value = data.streams || [];
    } catch (err) {
        console.error('Errore nel recupero delle telecamere:', err);
        // In caso di errore, usa dati di esempio
        cameras.value = generateMockCameras();
    }
};

/* // Funzione per generare eventi di prova per sviluppo
function generateMockEvents(count) {
    const events = [];
    const types = ['incidente', 'ingorgo'];
    const statuses = ['pending', 'solved', 'unsolved', 'false_alarm'];
    const severities = ['bassa', 'media', 'alta'];
    const locations = [
        'Via Roma, Trento',
        'Piazza Duomo, Trento',
        'Via Manci, Trento',
        'Piazza Dante, Trento',
        'Via Brennero, Trento'
    ];
    const cameraIds = [
        '68266cd1683978f9108a7393',
        '68266da2683978f9108a7395',
        '68266da2683978f9108a7396',
        '68266da2683978f9108a7397',
        '682880cf683978f9108a739b'
    ];

    // Crea eventi distribuiti negli ultimi 12 mesi
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const randomDaysAgo = Math.floor(Math.random() * 365); // Da oggi a un anno fa
        const eventDate = new Date(now);
        eventDate.setDate(eventDate.getDate() - randomDaysAgo);

        events.push({
            _id: `mock-${i}`,
            type,
            title: type === 'incidente' ? `Incidente in ${locations[i % locations.length]}` : `Ingorgo in ${locations[i % locations.length]}`,
            description: type === 'incidente' ? 'Collisione tra veicoli' : 'Rallentamento del traffico',
            eventDate: eventDate.toISOString(),
            location: { address: locations[i % locations.length] },
            status: statuses[Math.floor(Math.random() * statuses.length)],
            cameraId: cameraIds[i % cameraIds.length],
            severity: severities[Math.floor(Math.random() * severities.length)],
            confirmed: Math.random() > 0.3, // 70% sono confermati
            createdAt: eventDate.toISOString(),
            updatedAt: eventDate.toISOString()
        });
    }

    return events;
} */

// Funzione per generare telecamere di prova
function generateMockCameras() {
    return [
        { _id: '68266cd1683978f9108a7393', cameraId: '68266cd1683978f9108a7393', streamKey: 'stream_test_manuale' },
        { _id: '68266da2683978f9108a7395', cameraId: '68266da2683978f9108a7395', streamKey: 'stream_vanga' },
        { _id: '68266da2683978f9108a7396', cameraId: '68266da2683978f9108a7396', streamKey: 'stream_dante' },
        { _id: '68266da2683978f9108a7397', cameraId: '68266da2683978f9108a7397', streamKey: 'stream_santachiara' },
        { _id: '682880cf683978f9108a739b', cameraId: '682880cf683978f9108a739b', streamKey: 'stream_duomo' }
    ];
}

</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header con Gradiente e Pulsante di ritorno -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 mb-8">
            <div class="max-w-7xl mx-auto relative">
                <!-- Titolo centrato -->
                <div class="text-center">
                    <h1 class="text-3xl font-bold mb-2">Statistiche Eventi</h1>
                    <p class="opacity-80">Analisi dettagliata degli eventi stradali di Trento</p>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 pb-12">

            <DashboardNav />

            <!-- Filtri per data con nuovo selettore di intervallo personalizzato -->
            <div class="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
                <h2 class="text-xl font-bold text-gray-900 mb-6">Filtri</h2>

                <div class="flex flex-wrap gap-4 items-start">
                    <button @click="setDateRange('week')" class="px-6 py-3 rounded-xl font-semibold"
                        :class="dateRange === 'week' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'">
                        Ultima settimana
                    </button>
                    <button @click="setDateRange('month')" class="px-6 py-3 rounded-xl font-semibold"
                        :class="dateRange === 'month' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'">
                        Ultimo mese
                    </button>
                    <button @click="setDateRange('year')" class="px-6 py-3 rounded-xl font-semibold"
                        :class="dateRange === 'year' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'">
                        Ultimo anno
                    </button>


                    <!-- Selettore date personalizzato -->
                    <div v-if="showCustomDatePicker"
                        class="w-full mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div class="flex flex-wrap gap-4 items-end">
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Data inizio</label>
                                <input type="date" v-model="startDate"
                                    class="w-48 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
                            </div>

                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Data fine</label>
                                <input type="date" v-model="endDate"
                                    class="w-48 px-4 py-2 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
                            </div>

                            <button @click="applyCustomDateFilter"
                                class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
                                Applica
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading state -->
            <div v-if="loading" class="flex justify-center py-12">
                <div class="flex flex-col items-center">
                    <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4">
                    </div>
                    <p class="text-gray-600">Caricamento statistiche...</p>
                </div>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl mb-8">
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{{ error }}</p>
                </div>
            </div>

            <div v-else>
                <!-- Statistiche generali -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-2xl shadow-md p-6 border border-blue-100">
                        <div class="flex items-center mb-3">
                            <div class="bg-blue-100 p-3 rounded-lg mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <span class="text-gray-700 font-medium">Eventi Totali</span>
                        </div>
                        <div class="text-3xl font-bold text-blue-600">{{ totalEvents }}</div>
                    </div>

                    <div class="bg-white rounded-2xl shadow-md p-6 border border-red-100">
                        <div class="flex items-center mb-3">
                            <div class="bg-red-100 p-3 rounded-lg mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <span class="text-gray-700 font-medium">Incidenti</span>
                        </div>
                        <div class="text-3xl font-bold text-red-600">{{ totalIncidents }}</div>
                    </div>

                    <div class="bg-white rounded-2xl shadow-md p-6 border border-orange-100">
                        <div class="flex items-center mb-3">
                            <div class="bg-orange-100 p-3 rounded-lg mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-orange-600" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span class="text-gray-700 font-medium">Ingorghi</span>
                        </div>
                        <div class="text-3xl font-bold text-orange-600">{{ totalTrafficJams }}</div>
                    </div>

                    <div class="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                        <div class="flex items-center mb-3">
                            <div class="bg-green-100 p-3 rounded-lg mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span class="text-gray-700 font-medium">Eventi Attivi</span>
                        </div>
                        <div class="text-3xl font-bold text-green-600">{{ activeEvents }}</div>
                    </div>
                </div>

                <!-- Grafici principali con bordi e ombreggiature -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div class="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                        <h2 class="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">Distribuzione per Tipo di Evento
                        </h2>
                        <EventTypeDistribution :events="filteredEvents" />
                    </div>

                    <div class="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                        <h2 class="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">Distribuzione per Gravità</h2>
                        <SeverityDistribution :events="filteredEvents" />
                    </div>
                </div>

                <!-- Grafico trend temporale -->
                <div class="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
                    <h2 class="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">Andamento Eventi nel Tempo</h2>
                    
                    <EventTimeTrend :events="filteredEvents" :dateRange="dateRange" :startDate="startDate"
                        :endDate="endDate" />
                </div>

                <!-- Seconda riga di grafici -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div class="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                        <h2 class="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">Distribuzione Oraria degli Eventi
                        </h2>
                        <HourlyDistribution :events="filteredEvents" />
                    </div>

                    <div class="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                        <h2 class="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">Distribuzione per Stato</h2>
                        <EventStatusDistribution :events="filteredEvents" />
                    </div>
                </div>

                <!-- Eventi per telecamera -->
                <div class="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
                    <h2 class="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">Eventi per Telecamera</h2>
                    <EventsByCamera :events="filteredEvents" :cameras="cameras" />
                </div>
            </div>
        </div>
    </div>
</template>