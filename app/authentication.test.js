const request = require('supertest');
const { app } = require('./app');
const mongoose = require('mongoose');

describe('POST /api/v1/auth/login', () => {
    beforeAll( async () => { 
        jest.setTimeout(8000);
        app.locals.db = await mongoose.connect(process.env.MONGODB_URI); });
    afterAll( () => { 
        if (app.locals.detectionService) {
            app.locals.detectionService.stop();
        }
        mongoose.connection.close(true); 
    });

    test('Login con email inesistente', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'nonregistrato@example.com',
                password: 'qualsiasi'
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid email');
        expect(response.body).toHaveProperty('errorCode', 'INVALID_EMAIL');
    });

    test('Login con password errata', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'dipendente@comune.it',
                password: 'passwordsbagliata'
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid password');
        expect(response.body).toHaveProperty('errorCode', 'INVALID_PASSWORD');
    });
});
