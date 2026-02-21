const { Server } = require("socket.io");

const userSocketMap = new Map();

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust for production if needed
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        const userId = socket.handshake.query.userId;
        if (userId && userId !== "undefined") {
            userSocketMap.set(userId, socket.id);
        }

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            if (userId) {
                userSocketMap.delete(userId);
            }
        });
    });

    return io;
};

const getReceiverSocketId = (receiverId) => {
    return userSocketMap.get(receiverId);
};

// Exporting the module properties
module.exports = {
    initSocket,
    getReceiverSocketId,
    getIo: () => io
};
