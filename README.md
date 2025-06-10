# AiLERT - Sistema di Monitoraggio Urbano Intelligente

AiLERT è un sistema di monitoraggio urbano per la città di Trento che rileva automaticamente incidenti stradali mediante analisi video in tempo reale con Computer Vision, permettendo una risposta rapida dei servizi di emergenza. Il sistema archivia registrazioni degli eventi, fornisce statistiche e mappe interattive sia per operatori autorizzati che per cittadini comuni, e integra dati esterni sul traffico per offrire una visione completa della viabilità urbana.

## Architettura del Sistema

Il progetto utilizza un'architettura a microservizi basata su:
- **Frontend**: Vue.js 3 con mappa interattiva Leaflet
- **Backend**: Node.js + Express.js con API REST
- **Database**: MongoDB con Mongoose ODM
- **Real-time**: Socket.IO per notifiche istantanee
- **Autenticazione**: JWT con gestione ruoli
- **Testing**: Jest + Supertest (30+ test automatizzati)

## Funzionalità per Tipologia di Utente

### Cittadini (Accesso Pubblico)
- Visualizzazione mappa interattiva con incidenti e ingorghi in tempo reale
- Lista eventi stradali con filtri per tipologia, gravità e orario
- Auto-refresh automatico della mappa ogni 30 secondi
- Marker personalizzati per distinguere incidenti da ingorghi
- Accesso senza registrazione

### Dipendenti Comunali
- Dashboard operativa con statistiche degli eventi
- Visualizzazione completa storico incidenti
- Accesso ai feed video delle telecamere cittadine
- Filtri avanzati e ordinamento eventi
- Sistema di autenticazione sicuro

### Sorveglianti
- Ricezione notifiche real-time per nuovi incidenti rilevati
- Conferma o rifiuto di incidenti per validazione
- Visualizzazione feed video della telecamera che ha rilevato l'incidente
- Aggiunta di note operative agli incidenti
- Gestione stati incidenti (Rilevato, Verificato, In gestione, Risolto)
- Selezione servizi di emergenza da allertare

### Amministratori
- Gestione completa utenti del sistema (creazione, modifica, eliminazione)
- Configurazione e monitoraggio telecamere
- Accesso a tutte le funzionalità del sistema
- Dashboard di amministrazione

## Features Tecniche Implementate

### Sistema di Rilevamento AI
- DetectionService per analisi automatica dei video
- Computer Vision per identificazione incidenti
- Associazione automatica incidente-telecamera
- Coordinate geografiche precise tramite geocoding

### Mappa Interattiva
- 30+ telecamere posizionate strategicamente su Trento
- Marker con coordinate precise sulle strade reali
- Sistema di refresh intelligente senza reload pagina
- Controlli utente per gestire frequenza aggiornamenti

### Sistema Real-time
- WebSocket per notifiche istantanee
- Aggiornamento automatico eventi sulla mappa
- Sincronizzazione real-time tra tutti i client connessi

### Sicurezza e Autenticazione
- JWT per autenticazione sicura
- Middleware per controllo ruoli e autorizzazioni
- Hash delle password con bcrypt
- Protezione API con token validation

## Installazione e Avvio

### Prerequisiti
- Node.js (versione 18 o superiore)
- MongoDB (versione 6 o superiore)
- npm

### Setup del Progetto

1. **Clone del repository**
```bash
git clone https://github.com/AndreaBissoli/AiLERT.git
cd AiLERT
```

2. **Configurazione environment**
```bash
cp .env.example .env
```
Configurare le variabili nel file `.env`:
- `MONGODB_URI`: URL connessione MongoDB
- `JWT_SECRET`: Chiave segreta per JWT
- `FRONTEND_DIR`: Percorso directory frontend
- `PORT`: Porta del server (default: 8080)

3. **Installazione dipendenze e build**
```bash
npm install
npm run buildall
```

4. **Avvio del server**
```bash
npm start
```

Il server sarà disponibile su `http://localhost:8080`

## API Principali

### Endpoints Pubblici
- `GET /api/v1/public/events` - Eventi pubblici degli ultimi 2 ore

### Endpoints Autenticati
- `POST /api/v1/auth/login` - Login utenti
- `GET /api/v1/events` - Gestione eventi (dipendenti/sorveglianti)
- `GET /api/v1/streams` - Accesso stream video (dipendenti/sorveglianti)
- `GET /api/v1/users` - Gestione utenti (solo amministratori)

## Testing

Il progetto include una suite completa di test automatizzati:

```bash
# Esegui tutti i test
npm test

# Test specifici
npm test authentication.test.js
npm test events.test.js
npm test admin.test.js
npm test streamrouter.test.js
```

**Coverage attuale**: 30+ test che coprono autenticazione, gestione eventi, amministrazione utenti e streaming video.

## Struttura del Progetto

```
AiLERT/
    ├── app
    │   ├── admin.js
    │   ├── admin.test.js
    │   ├── app.js
    │   ├── authentication.js
    │   ├── authentication.test.js
    │   ├── changepass.js
    │   ├── config.js
    │   ├── detection
    │   │   └── detectionservice.js
    │   ├── events.js
    │   ├── events.test.js
    │   ├── jest.teardown.js
    │   ├── models
    │   │   ├── camera.js
    │   │   ├── event.js
    │   │   ├── stream.js
    │   │   └── user.js
    │   ├── public.js
    │   ├── resetpassword.js
    │   ├── rolechecker.js
    │   ├── streamrouter.js
    │   ├── streamrouter.test.js
    │   └── tokenchecker.js
    ├── Frontend
    │   ├── dist
    │   │   ├── assets
    │   │   │   ├── AdminView-C7qJIwq2.js
    │   │   │   ├── DashboardView-B_gl2pxE.js
    │   │   │   ├── ForgotPasswordView-Bi7oUsKQ.js
    │   │   │   ├── index-CPKxpGui.css
    │   │   │   ├── index-iwM-zzy5.js
    │   │   │   ├── leaflet-src-r9KgTLRM.js
    │   │   │   ├── MapView-CIGW-MKW.css
    │   │   │   ├── MapView-DU9UpmMy.js
    │   │   │   ├── UserDetail-CbTSWwk1.js
    │   │   │   ├── UserForm-B_93rWCM.js
    │   │   │   └── UsersList-BkBCbjE3.js
    │   │   ├── favicon.ico
    │   │   ├── index.html
    │   │   └── markers
    │   │       ├── accident-marker.png
    │   │       └── traffic-marker.png
    │   ├── index.html
    │   ├── package.json
    │   ├── package-lock.json
    │   ├── public
    │   │   ├── favicon.ico
    │   │   └── markers
    │   │       ├── accident-marker.png
    │   │       └── traffic-marker.png
    │   ├── README.md
    │   ├── src
    │   │   ├── App.vue
    │   │   ├── assets
    │   │   │   ├── logo.svg
    │   │   │   └── main.css
    │   │   ├── components
    │   │   │   ├── admin
    │   │   │   │   ├── UserDetail.vue
    │   │   │   │   ├── UserForm.vue
    │   │   │   │   └── UsersList.vue
    │   │   │   ├── AiLertLogo.vue
    │   │   │   ├── AlertMessage.vue
    │   │   │   ├── DashboardNav.vue
    │   │   │   ├── EventsList.vue
    │   │   │   ├── FormInput.vue
    │   │   │   ├── Header.vue
    │   │   │   ├── LoginForm.vue
    │   │   │   ├── map
    │   │   │   │   ├── EventCard.vue
    │   │   │   │   └── EventsMap.vue
    │   │   │   ├── NotificationToast.vue
    │   │   │   ├── PublicEventsList.vue
    │   │   │   ├── QuickGuide.vue
    │   │   │   ├── statistics
    │   │   │   │   ├── EventsByCamera.vue
    │   │   │   │   ├── EventStatusDistribution.vue
    │   │   │   │   ├── EventTimeTrend.vue
    │   │   │   │   ├── EventTypeDistribution.vue
    │   │   │   │   ├── HourlyDistribution.vue
    │   │   │   │   ├── SeverityDistribution.vue
    │   │   │   │   └── StatisticsCard.vue
    │   │   │   └── stream
    │   │   │       └── EventActionControls.vue
    │   │   ├── main.js
    │   │   ├── router
    │   │   │   └── index.js
    │   │   ├── services
    │   │   │   ├── EventService.js
    │   │   │   └── WebSocketService.js
    │   │   ├── utils
    │   │   │   └── auth.js
    │   │   └── views
    │   │       ├── AdminView.vue
    │   │       ├── CameraDetailView.vue
    │   │       ├── CamerasView.vue
    │   │       ├── ChangePasswordView.vue
    │   │       ├── DashboardView.vue
    │   │       ├── ForgotPasswordView.vue
    │   │       ├── HomeView.vue
    │   │       ├── LoginView.vue
    │   │       ├── MapView.vue
    │   │       └── StatisticsView.vue
    │   ├── tailwind.config.js
    │   └── vite.config.js
    ├── index.js
    ├── LICENSE.txt
    ├── oas3.yaml
    ├── package.json
    ├── package-lock.json
    ├── README.md
    └── scripts
        ├── add-more-cameras.js
        ├── analyze-database.js
        ├── clean-database.js
        ├── clean-events-only.js
        ├── clean-orphan-streams.js
        ├── cleanup.js
        ├── create-realistic-cameras.js
        ├── create-realistic-events.js
        ├── create-realistic-streams.js
        ├── fix-cameras-and-events.js
        ├── get-camera-ids.js
        ├── manage-test-data.js
        ├── setup.js
        └── test.auto-refresh.js
```

## Demo e Links

- **Applicazione Live**: [https://ailert.onrender.com](https://ailert.onrender.com)
- **Documentazione API**: [https://app.swaggerhub.com/apis-docs/unitn-c34/ai-lert_api/1.0](https://app.swaggerhub.com/apis-docs/unitn-c34/ai-lert_api/1.0)

### Credenziali Demo
- Sono indicate nel Deliverable 4

## Team di Sviluppo - Gruppo 4

- **Andrea Bissoli** - [@AndreaBissoli](https://github.com/AndreaBissoli)
- **Kuba Di Quattro** - [@KubaD4](https://github.com/KubaD4)  
- **Bilal Soussane** - [@sousbila](https://github.com/sousbila)

---

**Progetto sviluppato per il corso di Ingegneria del Software presso l'Università di Trento - A.A. 2024-2025**