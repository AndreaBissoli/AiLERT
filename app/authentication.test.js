const request = require("supertest");
const { app } = require("./app");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

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

    // TEST ID 4: Login con email inesistente
    test("Login con email inesistente", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            email: "nonregistrato@example.com",
            password: "qualsiasi",
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Invalid email");
        expect(response.body).toHaveProperty("errorCode", "INVALID_EMAIL");
    });

    // TEST ID 5: Login con password errata
    test("Login con password errata", async () => {
        const response = await request(app).post("/api/v1/auth/login").send({
            email: "dipendente@comune.it",
            password: "passwordsbagliata",
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Invalid password");
        expect(response.body).toHaveProperty("errorCode", "INVALID_PASSWORD");
    });

    // TEST ID 1: Login di un sorvegliante con credenziali valide
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

    // TEST ID 2: Login di un dipendente comunale con credenziali valide
    test("Login di un dipendente comunale con credenziali valide", async () => {
        const adminToken = jwt.sign(
            { name: "Admin", email: "admin@comune.it", role: "amministratore" },
            process.env.JWT_SECRET,
            { expiresIn: 86400 }
        );

        const timestamp = Date.now();
        const createResponse = await request(app)
            .post("/api/v1/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                email: `testdipendente${timestamp}@comune.it`,
                password: "password123",
                role: "dipendentecomunale",
                name: "Test Dipendente"
            });

        expect(createResponse.status).toBe(201);

        const response = await request(app).post("/api/v1/auth/login").send({
            email: `testdipendente${timestamp}@comune.it`,
            password: "password123",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("token");
        expect(typeof response.body.token).toBe("string");

        // Cleanup: elimina l'utente creato
        await request(app)
            .delete(`/api/v1/users/${createResponse.body.user._id}`)
            .set("Authorization", `Bearer ${adminToken}`);
    });

    // TEST ID 3: Login di un amministratore con credenziali valide
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

    // TEST ID 6: Cambio password per utente autenticato
    test("Cambio password per utente autenticato", async () => {
        const loginResponse = await request(app).post("/api/v1/auth/login").send({
            email: "sorvegliante@comune.it",
            password: "password123",
        });
        
        expect(loginResponse.status).toBe(200);
        const token = loginResponse.body.token;
        
        const response = await request(app)
            .put("/api/v1/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({
                newpassword: "nuovapassword123",
            });

        expect(response.status).toBe(403);
    });

    // TEST ID 7: Cambio password con token JWT non valido
    test("Cambio password con token JWT non valido", async () => {
        const response = await request(app)
            .put("/api/v1/users/me")
            .set("Authorization", "Bearer invalid_token_here")
            .send({
                newpassword: "qualsiasi",
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Invalid or expired token");
        expect(response.body).toHaveProperty("errorCode", "INVALID_TOKEN");
    });

    // TEST ID 8: Cambio password senza token
    test("Cambio password senza token", async () => {
        const response = await request(app)
            .put("/api/v1/users/me")
            .send({
                newpassword: "qualsiasi",
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Authentication token required");
        expect(response.body).toHaveProperty("errorCode", "TOKEN_REQUIRED");
    });
});