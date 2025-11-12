"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSetupIntent = exports.getOrderDetails = exports.createStripePaymentIntent = void 0;
const db_1 = __importDefault(require("../config/db"));
const stripe_1 = __importDefault(require("../config/stripe"));
const createStripePaymentIntent = async (req, res) => {
    try {
        const { amount, clientId, talentId, contractId, description, paymentType, timeline, jobId, status, rate, } = req.body;
        const client = await db_1.default.user.findUnique({
            where: { id: clientId },
        });
        const talent = await db_1.default.user.findUnique({
            where: { id: talentId },
        });
        if (!client || !talent) {
            return res.status(404).json({ message: "Client or talent not found" });
        }
        if (!talent.stripeAccountId) {
            return res
                .status(404)
                .json({ message: "Talent not connected to Stripe" });
        }
        const platformFeePercent = 15;
        const amountNum = Number(amount);
        if (isNaN(amountNum)) {
            return res.status(400).json({ message: "Invalid amount value" });
        }
        const amountInCents = Math.round(amountNum * 100);
        const platformFeeInCents = Math.round(((amountNum * platformFeePercent) / 100) * 100);
        const paymentIntent = await stripe_1.default.paymentIntents.create({
            amount: amountInCents,
            currency: "usd",
            // application_fee_amount: platformFeeInCents,
            capture_method: "manual",
            // transfer_data: {
            //   destination: talent.stripeAccountId,
            // },
            metadata: {
                clientId,
                talentId,
                contractId,
                description,
                paymentType,
                timeline,
                jobId,
                status,
                rate,
            },
        });
        // const order = await prisma.order.create({
        //   data: {
        //     amount: amountNum,
        //     platformFee: platformFee,
        //     status: "PENDING",
        //     stripePaymentIntentId: paymentIntent.id,
        //     // contractId: contract.id,
        //     talentId: talent.id,
        //     clientId: client.id,
        //   },
        // });
        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create Stripe payment intent",
            error,
        });
    }
};
exports.createStripePaymentIntent = createStripePaymentIntent;
const getOrderDetails = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await db_1.default.order.findUnique({
            where: { id: orderId },
            include: {
                talent: {
                    select: { id: true, name: true, email: true },
                },
                client: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        return res.status(200).json({ success: true, order });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Failed to get order details", error });
    }
};
exports.getOrderDetails = getOrderDetails;
const createSetupIntent = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        // Get or create customer
        let customer;
        if (user?.stripeCustomerId) {
            customer = await stripe_1.default.customers.retrieve(user.stripeCustomerId);
        }
        else {
            customer = await stripe_1.default.customers.create({
                email: user?.email,
                name: user?.name,
                metadata: { userId },
            });
            await db_1.default.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customer.id },
            });
        }
        // Create setup intent (for saving payment method)
        const setupIntent = await stripe_1.default.setupIntents.create({
            customer: customer.id,
            payment_method_types: ["card"],
        });
        res.json({
            clientSecret: setupIntent.client_secret,
            customerId: customer.id,
        });
    }
    catch (error) {
        console.error("Setup intent error:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.createSetupIntent = createSetupIntent;
//# sourceMappingURL=stripePaymentController.js.map