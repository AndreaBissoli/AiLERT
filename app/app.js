const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const authentication = require("./authentication");
const changepass = require("./changepass");
const streamRouter = require("./streamrouter");
const { tokenChecker, socketTokenChecker } = require("./tokenchecker");
const checkrole = require("./rolechecker");
const events = require("./events");
const admin = require("./admin");
const publicRouter = require("./public");

const DetectionService = require("./detection/detectionservice");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
const activeConnections = new Map();
io.on("connection", socket => {
    console.log(`Client connected: ${socket.id} (User: ${socket.userEmail})`);

    // Store the connection with user info
    activeConnections.set(socket.id, {
        socket: socket,
        userId: socket.userId,
        email: socket.userEmail,
        role: socket.userRole,
        connectedAt: new Date(),
    });

    socket.on("identify", data => {
        console.log(`Client identified: ${socket.userEmail}`, data);
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id} (User: ${socket.userEmail})`);
        activeConnections.delete(socket.id);
    });
});

io.use(socketTokenChecker);

const detectionService = new DetectionService(io);
detectionService.start();

app.locals.detectionService = detectionService;

app.use("/", express.static(process.env.FRONTEND_DIR));

app.use("/api/v1/auth/login", authentication);
//app.use("/api/v1/stream/view", express.static(process.env.STREAM_OUTPUT_DIR || "./streams"));

app.use("/api/v1/public", publicRouter);

app.use(
    "/api/v1/events",
    [tokenChecker, checkrole(["dipendentecomunale", "sorvegliante"])],
    events
);
app.use("/api/v1/users/me", tokenChecker, changepass);
app.use("/api/v1/users", [tokenChecker, checkrole("amministratore")], admin);
app.use(
    "/api/v1/streams",
    [tokenChecker, checkrole(["dipendentecomunale", "sorvegliante"])],
    streamRouter
);

app.use("*splat", express.static(process.env.FRONTEND_DIR));

module.exports = { server, app };
