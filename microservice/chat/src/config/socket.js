let ioInstance = null;

function initSocketIO(server) {
    if (ioInstance) {
        console.warn("⚠️ Socket.IO instance already initialized.");
        return ioInstance;
    }

    const { Server } = require("socket.io");

    ioInstance = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    ioInstance.on("connection", (socket) => {
        console.log("⚡ A user connected:", socket.id);

        socket.on("join", async (conversationId) => {
            socket.join(`conversation_${conversationId}`);
            console.log(`💬 User joined conversation_${conversationId}`);
        });

        socket.on("disconnect", async () => {
            console.log("❌ A user disconnected:", socket.id);
        });
    });

    return ioInstance;
}

function getIO() {
    if (!ioInstance) {
        throw new Error("❌ Socket.IO not initialized. Call initSocketIO(server) first.");
    }
    return ioInstance;
}

function emitMessage(conversationId, data) {
    if (!ioInstance) {
        throw new Error("❌ Socket.IO not initialized. Call initSocketIO(server) first.");
    }
    ioInstance.to(`conversation_${conversationId}`).emit("newMessage", data);
}

function emitStatus(conversationId, status, message) {
    if (!ioInstance) {
        throw new Error("❌ Socket.IO not initialized. Call initSocketIO(server) first.");
    }
    ioInstance.to(`conversation_${conversationId}`).emit(message, status);
}

module.exports = {
    initSocketIO,
    getIO,
    emitMessage,
    emitStatus
};