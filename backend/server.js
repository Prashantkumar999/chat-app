import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://chat-app-frontend-pink-omega.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Store connected users
const users = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user joining
  socket.on("user_join", (username) => {
    users.set(socket.id, {
      username,
      status: "online",
      typing: false,
    });
    io.emit("user_list", Array.from(users.values()));
  });

  // Handle messages
  socket.on("send_message", (message) => {
    const user = users.get(socket.id);
    io.emit("receive_message", {
      username: user.username,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle typing status
  socket.on("typing", (isTyping) => {
    const user = users.get(socket.id);
    if (user) {
      user.typing = isTyping;
      io.emit("user_list", Array.from(users.values()));
    }
  });

  // Handle status updates
  socket.on("update_status", (status) => {
    const user = users.get(socket.id);
    if (user) {
      user.status = status;
      io.emit("user_list", Array.from(users.values()));
    }
  });

  // Handle reactions
  socket.on("react_to_message", (data) => {
    io.emit("message_reaction", {
      messageId: data.messageId,
      reaction: data.reaction,
      username: users.get(socket.id).username,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    users.delete(socket.id);
    io.emit("user_list", Array.from(users.values()));
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
