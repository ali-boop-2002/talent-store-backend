"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhook = void 0;
const db_1 = __importDefault(require("../config/db"));
const stripe_1 = __importDefault(require("../config/stripe"));
const zod_1 = require("zod");
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
// POST http://localhost:3000/api/webhook
const webhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (error) {
        return res
            .status(400)
            .json({ error: "Invalid signature", message: error.message });
    }
    try {
        switch (event.type) {
            case "charge.succeeded": {
                const charge = event.data.object;
                try {
                    const metadata = charge.metadata;
                    if (!metadata.jobId ||
                        !metadata.clientId ||
                        !metadata.talentId ||
                        !metadata.description ||
                        !metadata.rate ||
                        !metadata.paymentType ||
                        !metadata.timeline) {
                        console.log("No metadata found");
                        break;
                    }
                    const contract = await db_1.default.contract.create({
                        data: {
                            description: metadata.description,
                            jobId: metadata.jobId,
                            clientId: metadata.clientId,
                            talentId: metadata.talentId,
                            status: metadata.status,
                            rate: Number(metadata.rate),
                            paymentType: metadata.paymentType,
                            timeline: metadata.timeline,
                            stripePaymentIntentId: charge.payment_intent,
                        },
                    });
                    const talent = await db_1.default.user.findUnique({
                        where: { id: metadata.talentId },
                    });
                    await db_1.default.order.create({
                        data: {
                            amount: Number(metadata.rate),
                            talentId: metadata.talentId,
                            clientId: metadata.clientId,
                            platformFee: 100,
                            contractId: contract.id,
                            stripeAccountId: talent?.stripeAccountId || "",
                            stripePaymentIntentId: charge.payment_intent,
                        },
                    });
                    server_1.io.to(`contract_${metadata.talentId}`).emit("contract created", contract);
                }
                catch (error) {
                    console.log(error);
                }
                break;
            }
            case "payment_intent.succeeded": {
                const data = event.data.object;
                try {
                    if (!data.metadata.orderId) {
                        console.log("No order ID found");
                        break;
                    }
                    await db_1.default.order.updateMany({
                        where: { id: data.metadata.orderId },
                        data: { status: "CHARGED" },
                    });
                }
                catch (error) {
                    console.log(error);
                }
                break;
            }
            case "payment_intent.failed": {
                const failed = event.data.object;
                try {
                    if (!failed.metadata.orderId) {
                        console.log("No order ID found");
                        break;
                    }
                    await db_1.default.order.updateMany({
                        where: { stripePaymentIntentId: failed.id },
                        data: { status: "CANCELLED" },
                    });
                }
                catch (error) {
                    console.log(error);
                }
                break;
            }
            case "customer.subscription.created": {
                const customerSubscription = event.data.object;
                try {
                    const subscriptionId = customerSubscription.id;
                    if (!subscriptionId) {
                        console.log("No subscription ID found");
                    }
                    const priceId = customerSubscription?.items?.data[0]?.price.id;
                    const periodStart = customerSubscription?.items?.data[0]?.current_period_start;
                    const periodEnd = customerSubscription?.items?.data[0]?.current_period_end;
                    const subscription = await db_1.default.subscription.update({
                        where: { stripeSubscriptionId: subscriptionId },
                        data: {
                            status: "active",
                            planType: priceId === "price_1SJes2PN81X55KQYRRp54JXc"
                                ? "basic_plan"
                                : priceId === "price_1SJesUPN81X55KQYIJanw81X"
                                    ? "premium_tier"
                                    : priceId === "price_1SJeu9PN81X55KQYNOc38pOm"
                                        ? "pro_plan"
                                        : null,
                            currentPeriodStart: new Date(periodStart * 1000),
                            currentPeriodEnd: new Date(periodEnd * 1000),
                            lastKeyAllocation: new Date(),
                            nextKeyAllocation: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                        },
                    });
                    const user = await db_1.default.user.findUnique({
                        where: { id: subscription.userId },
                    });
                    if (subscription.planType === "basic_plan" ||
                        subscription.planType === "premium_tier") {
                        await db_1.default.user.update({
                            where: { id: subscription.userId },
                            data: {
                                keyBalance: subscription.planType === "basic_plan"
                                    ? user?.keyBalance + 100
                                    : user?.keyBalance + 200, // premium_tier
                            },
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                }
                break;
            }
            case "customer.subscription.updated": {
                const subscription = event.data.object;
                console.log("subscription updated");
                try {
                    const previousAttributes = event.data.previous_attributes;
                    if (previousAttributes?.items) {
                        const oldPriceId = previousAttributes?.items.data[0]?.price.id;
                        const newPriceId = subscription.items?.data[0]?.price.id;
                        if (oldPriceId !== newPriceId) {
                            const updatedSubscription = await db_1.default.subscription.update({
                                where: { stripeSubscriptionId: subscription.id },
                                data: {
                                    planType: newPriceId === "price_1SJes2PN81X55KQYRRp54JXc"
                                        ? "basic_plan"
                                        : newPriceId === "price_1SJesUPN81X55KQYIJanw81X"
                                            ? "premium_tier"
                                            : newPriceId === "price_1SJeu9PN81X55KQYNOc38pOm"
                                                ? "pro_plan"
                                                : null,
                                    stripePriceId: newPriceId,
                                    lastKeyAllocation: new Date(),
                                    nextKeyAllocation: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                                    scheduleForDowngrade: false,
                                    subscriptionScheduledForDowngrade: null,
                                    currentPeriodStart: new Date(subscription.items?.data[0]
                                        ?.current_period_start * 1000),
                                    currentPeriodEnd: new Date(subscription.items?.data[0]
                                        ?.current_period_end * 1000),
                                },
                            });
                            const user = await db_1.default.user.findUnique({
                                where: { id: updatedSubscription.userId },
                            });
                            await db_1.default.user.update({
                                where: { id: updatedSubscription.userId },
                                data: {
                                    keyBalance: updatedSubscription.planType === "basic_plan"
                                        ? user?.keyBalance + 100
                                        : updatedSubscription.planType === "premium_tier"
                                            ? user?.keyBalance + 200
                                            : updatedSubscription.planType === "pro_plan"
                                                ? user?.keyBalance + 200
                                                : 0,
                                },
                            });
                        }
                    }
                    if (subscription.cancel_at_period_end) {
                        await db_1.default.subscription.update({
                            where: { stripeSubscriptionId: subscription.id },
                            data: {
                                cancelAtPeriodEnd: true,
                                scheduleForDowngrade: false,
                                subscriptionScheduledForDowngrade: null,
                                currentPeriodEnd: new Date(subscription.items?.data[0]?.current_period_end *
                                    1000),
                            },
                        });
                    }
                    if (!subscription.cancel_at_period_end) {
                        await db_1.default.subscription.update({
                            where: { stripeSubscriptionId: subscription.id },
                            data: {
                                cancelAtPeriodEnd: false,
                                scheduleForDowngrade: false,
                                subscriptionScheduledForDowngrade: null,
                                currentPeriodEnd: new Date(subscription.items?.data[0]?.current_period_end *
                                    1000),
                            },
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                }
                break;
            }
            case "subscription_schedule.updated": {
                const subscription = event.data.object;
                try {
                    if (subscription.metadata?.type === "downgrade" &&
                        subscription.subscription) {
                        await db_1.default.subscription.update({
                            where: {
                                stripeSubscriptionId: subscription.subscription,
                            },
                            data: {
                                scheduleForDowngrade: true,
                                subscriptionScheduledForDowngrade: subscription.phases[1]?.items[0]?.price ===
                                    "price_1SJes2PN81X55KQYRRp54JXc"
                                    ? "basic_plan"
                                    : subscription.phases[1]?.items[0]?.price ===
                                        "price_1SJesUPN81X55KQYIJanw81X"
                                        ? "premium_tier"
                                        : subscription.phases[1]?.items[0]?.price ===
                                            "price_1SJeu9PN81X55KQYNOc38pOm"
                                            ? "pro_plan"
                                            : null,
                            },
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                }
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                try {
                    const updatedSubscription = await db_1.default.subscription.update({
                        where: { stripeSubscriptionId: subscription.id },
                        data: {
                            status: "cancelled",
                            cancelAtPeriodEnd: false,
                            scheduleForDowngrade: false,
                            subscriptionScheduledForDowngrade: null,
                        },
                    });
                }
                catch (error) {
                    console.log(error);
                }
                break;
            }
            default:
                console.log("Unhandled event type:", event.type);
                break;
        }
        // ✅ Always respond once
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("⚠️ Webhook processing error:", error);
        // Always respond 200 to prevent Stripe retries, even on internal error
        res.status(200).json({ received: true });
    }
};
exports.webhook = webhook;
//# sourceMappingURL=webhookController.js.map