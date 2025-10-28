import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import prisma from "./config/db";
import userRoutes from "./routes/userRoutes";
import jobRoutes from "./routes/jobRoutes";
import { authenticateToken } from "./middleware/auth";
import talentRoutes from "./routes/talentRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import messageRoutes from "./routes/messageRoutes";
import contractRoutes from "./routes/contractRoutes";
import stripeRoutes from "./routes/stripeRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import http from "http";
import orderRoutes from "./routes/orderRoutes";
import reviewRoutes from "./routes/reviewRoutes";
dotenv.config();

// Import the AuthRequest type
// interface AuthRequest extends express.Request {
//   user?: {
//     id: string;
//     email: string;
//     role: string;
//   };
// }

const app = express();

app.use(
  "/api/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhookRoutes
);
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Example: Join contract-specific room
  socket.on("join_contract", (talentId) => {
    console.log("🟢 User joined room: contract_${talentId}");
    socket.join(`contract_${talentId}`);
    console.log(`User joined room: contract_${talentId}`);
  });

  socket.on("join_client", (clientId) => {
    // optionally verify that this socket really belongs to the client
    socket.join(`client_${clientId}`);
    console.log(`Client joined room: client_${clientId}`);
  });

  // Example: leave room
  socket.on("leave_contract", (talentId) => {
    socket.leave(`contract_${talentId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

app.use("/api", userRoutes);
app.use("/", jobRoutes);
app.use("/api", talentRoutes);
app.use("/api", applicationRoutes);
app.use("/api", messageRoutes);
app.use("/api", contractRoutes);
app.use("/api", stripeRoutes);
app.use("/api", orderRoutes);
app.use("/api", reviewRoutes);
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//   })
// );

// Health check with database
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "OK",
      database: "Connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      database: "Disconnected",
      error: "Database connection failed",
    });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { io };
