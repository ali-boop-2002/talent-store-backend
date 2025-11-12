"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersForClient = exports.getOrdersForTalent = void 0;
const db_1 = __importDefault(require("../config/db"));
const getOrdersForTalent = async (req, res) => {
    try {
        const talentId = req.user?.id;
        if (!talentId) {
            return res.status(400).json({ message: "Talent ID is required" });
        }
        const talent = await db_1.default.user.findUnique({
            where: {
                id: talentId,
            },
            select: { stripeAccountId: true },
        });
        if (!talent?.stripeAccountId) {
            return res.status(404).json({
                message: "Talent not found or does not have a stripe account",
            });
        }
        const orders = await db_1.default.order.findMany({
            where: {
                talentId: talentId,
                stripeAccountId: talent.stripeAccountId,
                status: "COMPLETED",
            },
            include: {
                client: true,
                talent: true,
                contract: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const contracts = await db_1.default.contract.findMany({
            where: {
                id: { in: orders.map((order) => order.contractId ?? "") },
            },
            include: {
                talent: true,
                client: true,
                orders: true,
            },
        });
        const jobs = await db_1.default.job.findMany({
            where: {
                id: { in: contracts.map((contract) => contract.jobId ?? "") },
            },
            include: {
                client: true,
            },
        });
        res.status(200).json({
            orders,
            contracts,
            jobs,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to get orders" });
        console.log(error);
    }
};
exports.getOrdersForTalent = getOrdersForTalent;
const getOrdersForClient = async (req, res) => {
    try {
        const clientId = req.user?.id;
        if (!clientId) {
            return res.status(400).json({ message: "Client ID is required" });
        }
        const orders = await db_1.default.order.findMany({
            where: {
                clientId: clientId,
                status: "COMPLETED",
            },
            include: {
                talent: true,
                client: true,
                contract: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const contracts = await db_1.default.contract.findMany({
            where: {
                id: { in: orders.map((order) => order.contractId ?? "") },
            },
            include: {
                talent: true,
                client: true,
                orders: true,
            },
        });
        const jobs = await db_1.default.job.findMany({
            where: {
                id: { in: contracts.map((contract) => contract.jobId ?? "") },
            },
            include: {
                client: true,
            },
        });
        res.status(200).json({
            orders,
            contracts,
            jobs,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to get orders" });
        console.log(error);
    }
};
exports.getOrdersForClient = getOrdersForClient;
//# sourceMappingURL=orderController.js.map