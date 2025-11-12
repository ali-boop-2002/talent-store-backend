"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContractAccepted = exports.updateContract = exports.getContractsByTalentId = exports.getContractsByClientId = void 0;
const db_1 = __importDefault(require("../config/db"));
const zod_1 = require("zod");
const stripe_1 = __importDefault(require("../config/stripe"));
const server_1 = require("../server");
const createContractSchema = zod_1.z.object({
    jobId: zod_1.z.string().min(1, "Job ID is required"),
    talentId: zod_1.z.string().min(1, "Talent ID is required"),
    clientId: zod_1.z.string().min(1, "Client ID is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    status: zod_1.z
        .enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"])
        .default("ACTIVE"),
    rate: zod_1.z.number().min(0, "Rate is required"),
    paymentType: zod_1.z.enum(["HOURLY", "FIXED"]).default("HOURLY"),
    timeline: zod_1.z.string().min(1, "Timeline is required"),
    stripePaymentIntentId: zod_1.z
        .string()
        .min(1, "Stripe Payment Intent ID is required"),
    // stripeAccountId: z.string().min(1, "Stripe Account ID is required"),
});
// const createContract = async (req: Request, res: Response) => {
//   try {
//     const validatedData = createContractSchema.parse(req.body);
//     const contract = await prisma.contract.create({
//       data: validatedData,
//     });
//     const talent = await prisma.user.findUnique({
//       where: { id: validatedData.talentId },
//     });
//     await prisma.order.create({
//       data: {
//         amount: validatedData.rate,
//         talentId: validatedData.talentId,
//         clientId: validatedData.clientId,
//         platformFee: 100,
//         contractId: contract.id,
//         stripeAccountId: talent?.stripeAccountId as string,
//         stripePaymentIntentId: validatedData.stripePaymentIntentId,
//       },
//     }); // no need to create order here since we are creating it in the stripePaymentController
//     res.status(201).json({ contract });
//   } catch (error) {
//     console.error("Create contract error:", error);
//     res.status(500).json({ message: "Invalid data", error });
//   }
// };
const getContractsByClientId = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const contracts = await db_1.default.contract.findMany({
            where: {
                clientId: req.user?.id,
            },
            orderBy: {
                updatedAt: "desc",
            },
            include: {
                job: true,
                reviews: true,
                client: true,
                talent: true,
            },
        });
        res.status(200).json({ contracts });
    }
    catch (error) {
        console.error("Get contracts error:", error);
        res.status(500).json({ message: "Invalid data", error });
    }
};
exports.getContractsByClientId = getContractsByClientId;
const getContractsByTalentId = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const contracts = await db_1.default.contract.findMany({
            where: {
                talentId: req.user?.id,
            },
            orderBy: {
                updatedAt: "desc",
            },
            include: {
                job: true,
                clientReviews: true,
                client: true,
                talent: true,
            },
        });
        res.status(200).json({ contracts });
    }
    catch (error) {
        console.error("Get contracts error:", error);
        res.status(500).json({ message: "Invalid data", error });
    }
};
exports.getContractsByTalentId = getContractsByTalentId;
const updateContract = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(401).json({ error: "Contract ID is required" });
        }
        if (!req.user?.id) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const { status } = req.body;
        const contract = await db_1.default.contract.update({
            where: { id },
            data: { status, updatedBy: req.user?.name },
        });
        if (!contract) {
            return res.status(404).json({ error: "Contract not found" });
        }
        if (status === "COMPLETED") {
            const order = await db_1.default.order.findFirst({
                where: { contractId: contract.id },
            });
            if (!order || !order.stripePaymentIntentId || !order.stripeAccountId) {
                return res
                    .status(404)
                    .json({ error: "Order not found or missing PaymentIntent" });
            }
            const paymentIntent = await stripe_1.default.paymentIntents.retrieve(order.stripePaymentIntentId, { expand: ["charges"] });
            //pi_3SHUtmPN81X55KQY1DHaUgu9
            //py_3SHUwxPN81X55KQY1qgpeOne
            const chargeId = paymentIntent.latest_charge;
            // const chargeId = paymentIntent.charges.data[0]?.id;
            // if (!chargeId) {
            //   return res
            //     .status(400)
            //     .json({ error: "No charge found for this PaymentIntent" });
            // }
            // Transfer money to talent's Stripe account
            await stripe_1.default.transfers.create({
                amount: order.amount * 100, // same amount charged from client
                currency: "usd", // make sure this matches your PaymentIntent
                destination: order.stripeAccountId, // talent's connected Stripe account
                source_transaction: chargeId,
            });
            // Update order status to completed
            await db_1.default.order.update({
                where: { id: order.id },
                data: { status: "COMPLETED" },
            });
        }
        res.status(200).json({ contract });
    }
    catch (error) {
        console.error("Update contract error:", error);
        res.status(500).json({ message: "Invalid data", error });
    }
};
exports.updateContract = updateContract;
const updateContractAccepted = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(401).json({ error: "Contract ID is required" });
        }
        const { accepted } = req.body;
        let contract;
        contract = await db_1.default.contract.update({
            where: { id },
            data: { accepted: accepted },
        });
        server_1.io.to(`client_${contract?.clientId}`).emit("contract_updated", contract);
        // if (accepted === true) {
        //   const order = await prisma.order.findFirst({
        //     where: { contractId: contract.id }, // you need to link order to contract
        //   });
        if (accepted === false) {
            return res.status(200).json({ message: "Contract rejected" });
        }
        const order = await db_1.default.order.findFirst({
            where: { contractId: contract.id }, // you need to link order to contract
        });
        if (!order || !order.stripePaymentIntentId) {
            return res
                .status(404)
                .json({ error: "Order not found or missing paymentIntent" });
        }
        const paymentIntent = await stripe_1.default.paymentIntents.capture(order.stripePaymentIntentId, { metadata: { orderId: order.id } });
        if (!paymentIntent) {
            return res.status(404).json({ error: "Payment intent not found" });
        }
        // await prisma.order.update({
        //   where: { id: order.id },
        //   data: { status: "CHARGED" },
        // });
        res.status(200).json({ contract });
    }
    catch (error) {
        console.error("Update contract accepted error:", error);
        res.status(500).json({ message: "Invalid data", error });
    }
};
exports.updateContractAccepted = updateContractAccepted;
//# sourceMappingURL=contractController.js.map