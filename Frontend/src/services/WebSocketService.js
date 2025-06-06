import { io } from "socket.io-client";

class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket) {
            this.disconnect();
        }

        try {
            console.log(window.location.origin);
            this.socket = io(window.location.origin, {
                auth: {
                    token: token,
                },
                transports: ["websocket"],
            });

            this.socket.on("connect", () => {
                console.log("WebSocket connected:", this.socket.id);
                this.isConnected = true;
            });

            this.socket.on("disconnect", () => {
                console.log("WebSocket disconnected");
                this.isConnected = false;
            });

            this.socket.on("notification", data => {
                console.log("Notification received:", data);
                this.emitToListeners("notification", data);
            });
        } catch (error) {
            console.error("WebSocket connection error:", error);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            const eventListeners = this.listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(callback);
            }
        };
    }

    emitToListeners(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("Error in event listener:", error);
                }
            });
        }
    }

    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        }
    }
}

export default new WebSocketService();
