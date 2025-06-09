const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { app } = require("./app");

describe("Events API Tests", () => {
    let dipendenteToken;
    let sorveglianteToken;

    beforeAll(async () => {
        jest.setTimeout(15000);
        app.locals.db = await mongoose.connect(process.env.MONGODB_URI);
        
        dipendenteToken = jwt.sign(
            {
                name: "Marco Verdi",
                email: "dipendente@comune.it",
                role: "dipendentecomunale",
            },
            process.env.JWT_SECRET,
            { expiresIn: 86400 }
        );

        sorveglianteToken = jwt.sign(
            {
                name: "Mario Rossi", 
                email: "sorvegliante@comune.it",
                role: "sorvegliante",
            },
            process.env.JWT_SECRET,
            { expiresIn: 86400 }
        );
    }, 15000);

    afterAll(async () => {
        if (app.locals.detectionService) {
            app.locals.detectionService.stop();
        }
        await mongoose.connection.close(true);
    }, 15000);

    // TEST ID 19 variante: Test con sorvegliante
    test("Visualizzazione eventi storici con sorvegliante", async () => {
        const response = await request(app)
            .get("/api/v1/events")
            .set("Authorization", `Bearer ${sorveglianteToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body) || typeof response.body === 'object').toBe(true);
    });

    // TEST ID 20: Visualizzazione di eventi pubblici
    test("Visualizzazione di eventi pubblici", async () => {
        const response = await request(app)
            .get("/api/v1/public/events");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        if (response.body.length > 0) {
            response.body.forEach(event => {
                expect(event).toHaveProperty("_id");
                expect(event).toHaveProperty("timestamp");
                expect(event).toHaveProperty("status");
            });
        }
    });

    // TEST ID 21: Tentativo di accesso agli eventi senza autenticazione
    test("Tentativo di accesso agli eventi senza autenticazione", async () => {
        const response = await request(app)
            .get("/api/v1/events");

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Authentication token required");
        expect(response.body).toHaveProperty("errorCode", "TOKEN_REQUIRED");
    });

    // TEST ID 32: Recupero di numerosi eventi pubblici
    test("Recupero di numerosi eventi pubblici", async () => {
        const response = await request(app)
            .get("/api/v1/public/events");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeLessThanOrEqual(50);
    });

    // Test aggiuntivo: Accesso con ruolo non autorizzato (admin)
    test("Tentativo di accesso agli eventi con ruolo non autorizzato", async () => {
        const adminToken = jwt.sign(
            {
                name: "Admin Test",
                email: "admin@comune.it",
                role: "amministratore",
            },
            process.env.JWT_SECRET,
            { expiresIn: 86400 }
        );

        const response = await request(app)
            .get("/api/v1/events")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error", "Unauthorized role");
        expect(response.body).toHaveProperty("errorCode", "UNAUTHORIZED_ROLE");
    });

    // Test aggiuntivo: Accesso con token non valido
    test("Tentativo di accesso agli eventi con token non valido", async () => {
        const response = await request(app)
            .get("/api/v1/events")
            .set("Authorization", "Bearer invalid_token");

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", "Invalid or expired token");
        expect(response.body).toHaveProperty("errorCode", "INVALID_TOKEN");
    });
});