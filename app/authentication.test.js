const request = require("supertest");
const { app } = require("./app");
const mongoose = require("mongoose");

describe("POST /api/v1/auth/login", () => {
    beforeAll(async () => {
        jest.setTimeout(15000);
        app.locals.db = await mongoose.connect(process.env.MONGODB_URI);
    });
    afterAll(() => {
        if (app.locals.detectionService) {
            app.locals.detectionService.stop();
        }
        mongoose.connection.close(true);
    });

    // TEST
    test("Login con email inesistente", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            email: "nonregistrato@example.com",
            password: "qualsiasi",
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Invalid email");
        expect(response.body).toHaveProperty("errorCode", "INVALID_EMAIL");
    });

    // TEST
    test("Login con password errata", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            email: "dipendente@comune.it",
            password: "passwordsbagliata",
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Invalid password");
        expect(response.body).toHaveProperty("errorCode", "INVALID_PASSWORD");
    });

    // TEST: Login sorvegliante con credenziali valide
    test("Login di un sorvegliante con credenziali valide", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            email: "sorvegliante@comune.it",
            password: "password123",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("token");
        expect(typeof response.body.token).toBe("string");
    });

    // TEST: Login dipendente comunale con credenziali valide
    test("Login di un dipendente comunale con credenziali valide", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            email: "dipendente@comune.it",
            password: "password123",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("token");
        expect(typeof response.body.token).toBe("string");
    });

    // TEST: Login amministratore con credenziali valide
    test("Login di un amministratore con credenziali valide", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            email: "admin@comune.it",
            password: "password123",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("token");
        expect(typeof response.body.token).toBe("string");
    });

    test("Cambio password per utente autenticato", async () => {
        // Ottieni un token fresco direttamente nel test
        const loginResponse = await request(app).post("/api/v1/auth/login").send({
            email: "dipendente@comune.it",
            password: "password123",
        });
        
        const token = loginResponse.body.token;
        
        const response = await request(app)
            .put("/api/v1/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({
                newpassword: "nuovapassword123",
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("message", "Password changed successfully");
    });
});
