const request = require('supertest');
const { app } = require('./app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Inizializza l'app e il database prima di eseguire i test
// In quanto ci sono più test che accedono al database, è meglio connettersi una volta sola
// e chiudere la connessione alla fine di tutti i test
// questo evita di aprire e chiudere la connessione per ogni test 
beforeAll(async () => {
    jest.setTimeout(8000);
    app.locals.db = await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
    if (app.locals.detectionService) {
        app.locals.detectionService.stop();
    }
    await mongoose.connection.close(true);
});

describe('GET /api/v1/stream/', () => {


    var token = jwt.sign({
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'dipendentecomunale'
    }, process.env.JWT_SECRET, {
        expiresIn: 86400
    });

    test('Recupera tutti gli stream attivi', async () => {
        const response = await request(app)
            .get('/api/v1/stream/list')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('streams');
        expect(Array.isArray(response.body.streams)).toBe(true);
    });

    test('Recupera uno stream specifico per ID', async () => {
        // Prima otteniamo la lista per avere un ID valido. 
        // Assumiamo che esista almeno una stream con _id valido
        const listResponse = await request(app)
            .get('/api/v1/stream/list')
            .set('Authorization', `Bearer ${token}`);

        if (listResponse.body.streams && listResponse.body.streams.length > 0) {
            const streamId = listResponse.body.streams[0]._id;

            const response = await request(app)
                .get(`/api/v1/stream/${streamId}`)
                .set('Authorization', `Bearer ${token}`);


            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.stream).toHaveProperty('_id');
            expect(response.body.stream._id).toBe(streamId);
        } else {
            console.warn('No active streams found for testing.');
        }
    });

    test('Visualizzazione di uno stream inesistente', async () => {
        const response = await request(app)
            // Nel template è specificato come stremID inesistente 99999 ma non è possile usarlo 
            // per via delle regole di mongoose 
            .get('/api/v1/stream/9999974d0bf87ea6613cfd24')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Stream not found');
        expect(response.body).toHaveProperty('errorCode', 'STREAM_NOT_FOUND');
    });


    test('Tentativo di accesso agli stream da parte di un amministratore', async () => {
        var adminToken = jwt.sign({
            name: 'Admin Admin',
            email: 'admin@comune.it',
            role: 'amministratore'
        }, process.env.JWT_SECRET, {
            expiresIn: 86400
        });

        const response = await request(app)
            .get('/api/v1/stream/list')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Unauthorized role');
        expect(response.body).toHaveProperty('errorCode', 'UNAUTHORIZED_ROLE');
    });



    // Non incluso nel deliverable ma utile per testare errori di accesso
    test('Tentativo di accesso senza autenticazione', async () => {
        const response = await request(app)
            .get('/api/v1/stream/list');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Authentication token required');
        expect(response.body).toHaveProperty('errorCode', 'TOKEN_REQUIRED');
    });

    // Non incluso nel deliverable ma utile per testare errori di accesso
    test('Tentativo di accesso con token non valido', async () => {
        const response = await request(app)
            .get('/api/v1/stream/list')
            .set('Authorization', 'Bearer invalid_token');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid or expired token');
        expect(response.body).toHaveProperty('errorCode', 'INVALID_TOKEN');
    });
});

describe('POST /api/v1/stream/', () => {

    var token = jwt.sign({
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'dipendentecomunale'
    }, process.env.JWT_SECRET, {
        expiresIn: 86400
    });

    test('Crea un nuovo stream', async () => {
        const response = await request(app)
            .post('/api/v1/stream/')
            .set('Authorization', `Bearer ${token}`)
            .send({
                cameraId: '60c72b2f9b1e8c001c8e4d5a',
                streamKey: 'testStreamKey' + new Date().getTime(),
                streamUrl: 'http://example.com/stream',
                streamType: 'rtsp'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('stream');
        expect(response.body.stream).toHaveProperty('_id');
    });

    test('Crea un nuovo stream con dati mancanti', async () => {
        const response = await request(app)
            .post('/api/v1/stream/')
            .set('Authorization', `Bearer ${token}`)
            .send({
                cameraId: '60c72b2f9b1e8c001c8e4d5a',
                streamKey: 'testStreamKey' + new Date().getTime(),
                streamUrl: 'http://example.com/stream',
                // streamType mancante
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Campi obbligatori mancanti');
        expect(response.body).toHaveProperty('errorCode', 'MISSING_FIELDS');
    });
})

describe('PUT /api/v1/stream/:streamId/end', () => {
    let token;
    let streamId;

    beforeAll(async () => {
        token = jwt.sign({
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'dipendentecomunale'
        }, process.env.JWT_SECRET, {
            expiresIn: 86400
        });

        // Abbiamo creato uno stream attivo che viene usato 
        // per testare la terminazione e aggiornamento parametri 
        streamId = '6842a74d0af87da6613cfd24'

        const response = await request(app)
            .post('/api/v1/stream/')
            .set('Authorization', `Bearer ${token}`)
            .send({
                cameraId: '60c72b2f9b1e8c001c8e4d5a',
                streamKey: 'testStreamKey' + new Date().getTime(),
                streamUrl: 'http://example.com/stream',
                streamType: 'rtsp'
            });
    });

    test('Termina uno stream attivo con successo', async () => {
        const response = await request(app)
            .put(`/api/v1/stream/${streamId}/end`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.stream.isActive).toBe(false);
        expect(response.body.stream.endTime).toBeDefined();
    });
});

describe('PUT /api/v1/stream/:streamId', () => {
    let token;
    let streamId;

    beforeAll(async () => {
        token = jwt.sign({
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'dipendentecomunale'
        }, process.env.JWT_SECRET, {
            expiresIn: 86400
        });

        // Stream per i test di aggiornamento
        const response = await request(app)
            .post('/api/v1/stream/')
            .set('Authorization', `Bearer ${token}`)
            .send({
                cameraId: '60c72b2f9b1e8c001c8e4d5a',
                streamKey: 'testStreamKey' + new Date().getTime(),
                streamUrl: 'http://example.com/stream',
                streamType: 'rtsp'
            });

        streamId = response.body.stream._id;
    });

    test('Aggiornamento dei parametri di uno stream', async () => {
        const updatedData = {
            streamKey: "new_stream_key_" + Date.now(),
            isActive: false,
            streamUrl: "http://updated.example.com/stream"
        };

        const response = await request(app)
            .put(`/api/v1/stream/${streamId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('stream');
        expect(response.body.stream.streamKey).toBe(updatedData.streamKey);
        expect(response.body.stream.isActive).toBe(updatedData.isActive);
        expect(response.body.stream.streamUrl).toBe(updatedData.streamUrl);
        expect(response.body.stream._id).toBe(streamId);
    });

    test('Aggiornamento parziale dei parametri di uno stream', async () => {
        const partialUpdate = {
            streamKey: "partial_update_" + Date.now()
        };

        const response = await request(app)
            .put(`/api/v1/stream/${streamId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(partialUpdate);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.stream.streamKey).toBe(partialUpdate.streamKey);

        expect(response.body.stream._id).toBe(streamId);
    });

});
