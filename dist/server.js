"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./config/db"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const talentRoutes_1 = __importDefault(require("./routes/talentRoutes"));
const applicationRoutes_1 = __importDefault(require("./routes/applicationRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const contractRoutes_1 = __importDefault(require("./routes/contractRoutes"));
const stripeRoutes_1 = __importDefault(require("./routes/stripeRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const body_parser_1 = __importDefault(require("body-parser"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
dotenv_1.default.config();
// Import the AuthRequest type
// interface AuthRequest extends express.Request {
//   user?: {
//     id: string;
//     email: string;
//     role: string;
//   };
// }
const app = (0, express_1.default)();
app.use("/api/webhook", body_parser_1.default.raw({ type: "application/json" }), webhookRoutes_1.default);
app.use((0, cors_1.default)({
    origin: "http://localhost:3001",
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)()); // Parse cookies
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
exports.io = io;
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
app.use("/api", userRoutes_1.default);
app.use("/", jobRoutes_1.default);
app.use("/api", talentRoutes_1.default);
app.use("/api", applicationRoutes_1.default);
app.use("/api", messageRoutes_1.default);
app.use("/api", contractRoutes_1.default);
app.use("/api", stripeRoutes_1.default);
app.use("/api", orderRoutes_1.default);
app.use("/api", reviewRoutes_1.default);
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
        await db_1.default.$queryRaw `SELECT 1`;
        res.json({
            status: "OK",
            database: "Connected",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
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
//# sourceMappingURL=server.js.map