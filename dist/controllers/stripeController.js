"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStripeSubscriptionWithPaymentMethodId = exports.cancelStripeSubscription = exports.checkSubscriptionStatus = exports.createStripeSubscription = exports.checkOnboardingStatus = exports.createStripeLink = exports.createStripeAccount = exports.removePaymentMethod = exports.updateDefaultPaymentMethod = exports.addPaymentMethod = exports.getPaymentMethods = void 0;
const db_1 = __importDefault(require("../config/db"));
const stripe_1 = __importDefault(require("../config/stripe"));
const zod_1 = require("zod");
const createStripeAccount = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const account = await stripe_1.default.accounts.create({
            country: "US",
            type: "standard",
            email: user.email,
            capabilities: {
                card_payments: {
                    requested: true,
                },
                transfers: {
                    requested: true,
                },
            },
            business_type: "individual",
        });
        await db_1.default.user.update({
            where: { id: userId },
            data: { stripeAccountId: account.id },
        });
        return res.status(200).json({ message: "Stripe account created", account });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "Failed to create Stripe account", error });
    }
};
exports.createStripeAccount = createStripeAccount;
const createStripeLink = async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.stripeAccountId) {
            return res.status(400).json({ error: "No Stripe account found" });
        }
        // Create account link
        const accountLink = await stripe_1.default.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: `${process.env.CLIENT_URL}/profile/userProfile/${user.id}?refresh=true`,
            return_url: `${process.env.CLIENT_URL}/`,
            type: "account_onboarding",
        });
        res.json({
            success: true,
            url: accountLink.url,
        });
    }
    catch (error) {
        console.error("Create link error:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.createStripeLink = createStripeLink;
const checkOnboardingStatus = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.stripeAccountId) {
            return res.json({
                complete: false,
                hasAccount: false,
            });
        }
        // Get account from Stripe
        const account = await stripe_1.default.accounts.retrieve(user.stripeAccountId, {
            expand: ["capabilities", "capabilities", "individual"],
        });
        console.log(account, "account");
        const isComplete = account.details_submitted &&
            account.charges_enabled &&
            account.payouts_enabled;
        // Update database
        if (isComplete && !user.onboardingComplete) {
            await db_1.default.user.update({
                where: { id: userId },
                data: { onboardingComplete: true },
            });
        }
        res.json({
            complete: isComplete,
            hasAccount: true,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
        });
    }
    catch (error) {
        console.error("Status check error:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.checkOnboardingStatus = checkOnboardingStatus;
const createStripeSubscription = async (req, res) => {
    try {
        const { priceId, paymentMethodId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "no user found" });
        }
        if (!user.stripeCustomerId) {
            return res.status(400).json({ error: "No customer found" });
        }
        // Attach payment method to customer
        await stripe_1.default.paymentMethods.attach(paymentMethodId, {
            customer: user.stripeCustomerId,
        });
        // Set as default
        await stripe_1.default.customers.update(user.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        const existingSubscription = await db_1.default.subscription.findUnique({
            where: { userId },
        });
        // if (existingSubscription) {
        //   return res.status(400).json({
        //     error:
        //       "User already has a subscription. Use upgrade/downgrade endpoints instead.",
        //   });
        // }
        // Create subscription
        const subscription = await stripe_1.default.subscriptions.create({
            customer: user.stripeCustomerId,
            items: [{ price: priceId }],
            payment_settings: {
                payment_method_types: ["card"],
                save_default_payment_method: "on_subscription",
            },
            expand: ["latest_invoice.payment_intent"],
        });
        // Save to database
        const periodStart = subscription.latest_invoice
            ? new Date(subscription.latest_invoice.period_start * 1000)
            : new Date(subscription.start_date * 1000);
        const periodEnd = subscription.latest_invoice
            ? new Date(subscription.latest_invoice.period_end * 1000)
            : null;
        if (existingSubscription) {
            await db_1.default.subscription.update({
                where: { userId },
                data: {
                    userId,
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: user.stripeCustomerId,
                    stripePriceId: priceId,
                    planType: priceId === "price_1SJes2PN81X55KQYRRp54JXc"
                        ? "basic_plan"
                        : priceId === "price_1SJesUPN81X55KQYIJanw81X"
                            ? "premium_tier"
                            : "pro_plan",
                    status: subscription.status,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                },
            });
        }
        else {
            await db_1.default.subscription.create({
                data: {
                    userId,
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: user.stripeCustomerId,
                    stripePriceId: priceId,
                    planType: priceId === "price_1SJes2PN81X55KQYRRp54JXc"
                        ? "basic_plan"
                        : priceId === "price_1SJesUPN81X55KQYIJanw81X"
                            ? "premium_tier"
                            : "pro_plan",
                    status: subscription.status,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                },
            });
        }
        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent
                ?.client_secret,
            status: subscription.status,
        });
    }
    catch (error) {
        console.error("Subscription creation error:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.createStripeSubscription = createStripeSubscription;
const checkSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const subscription = await db_1.default.subscription.findUnique({
            where: { userId: userId },
        });
        if (!subscription) {
            return res.status(200).json({ subscription: null });
        }
        if (subscription.status !== "active") {
            console.log("Subscription inactive or failed, no keys added");
            return res.status(200).json({ subscription: null });
        }
        return res.status(200).json({ subscription });
    }
    catch (error) {
        console.error("Subscription status check error:", error);
        return res.status(500).json({ error: error.message });
    }
};
exports.checkSubscriptionStatus = checkSubscriptionStatus;
const cancelStripeSubscription = async (req, res) => {
    try {
        const { status = false } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const subscription = await db_1.default.subscription.findUnique({
            where: { userId },
        });
        if (!subscription) {
            return res.status(404).json({ error: "No active subscription found" });
        }
        const stripeSubscription = await stripe_1.default.subscriptions.retrieve(subscription.stripeSubscriptionId);
        if (stripeSubscription.schedule) {
            await stripe_1.default.subscriptionSchedules.release(stripeSubscription?.schedule);
            if (status === true) {
                await stripe_1.default.subscriptions.update(subscription.stripeSubscriptionId, {
                    cancel_at_period_end: true,
                });
            }
            else {
                await stripe_1.default.subscriptions.update(subscription.stripeSubscriptionId, {
                    cancel_at_period_end: false,
                });
            }
        }
        else {
            // If no schedule, update the subscription directly
            await stripe_1.default.subscriptions.update(subscription.stripeSubscriptionId, {
                cancel_at_period_end: status,
            });
        }
        res.status(200).json({
            message: zod_1.success,
            data: {
                subscription,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.cancelStripeSubscription = cancelStripeSubscription;
const updateStripeSubscriptionWithPaymentMethodId = async (req, res) => {
    try {
        const { priceId, paymentMethodId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const subscription = await db_1.default.subscription.findUnique({
            where: { userId },
        });
        if (!subscription) {
            return res.status(404).json({ error: "Subscription not found" });
        }
        if (!subscription.stripeCustomerId) {
            return res.status(404).json({ error: "No Stripe customer found" });
        }
        await stripe_1.default.paymentMethods.attach(paymentMethodId, {
            customer: subscription.stripeCustomerId,
        });
        await stripe_1.default.customers.update(subscription.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        const stripeSubscription = await stripe_1.default.subscriptions.retrieve(subscription.stripeSubscriptionId);
        const priceHierarchy = {
            price_1SJes2PN81X55KQYRRp54JXc: 1, // basic_plan - $10
            price_1SJesUPN81X55KQYIJanw81X: 2, // premium_tier - $20
            price_1SJeu9PN81X55KQYNOc38pOm: 3, // pro_plan - $30
        };
        // Get the current subscription item ID (required by Stripe)
        const currentPriceId = stripeSubscription?.items?.data[0]?.price?.id;
        const subscriptionItemId = stripeSubscription?.items?.data[0]?.id;
        if (priceHierarchy[priceId] >
            priceHierarchy[currentPriceId]) {
            await stripe_1.default.subscriptions.update(subscription.stripeSubscriptionId, {
                items: [
                    {
                        id: subscriptionItemId,
                        price: priceId,
                    },
                ],
                proration_behavior: "none",
                billing_cycle_anchor: "now",
            });
        }
        if (priceHierarchy[priceId] <
            priceHierarchy[currentPriceId]) {
            console.log("Downgrading subscription");
            // so the first time user downgrade schedule wont exist so we need to create a new one that is why else block is there
            // but second time user downgrade schedule will exist so we need to update the existing schedule
            if (stripeSubscription.schedule) {
                // Get the existing schedule first to access its properties correctly
                // const existingSchedule = await stripe.subscriptionSchedules.retrieve(
                //   stripeSubscription.schedule as string
                // );
                // console.log(stripeSubscription.schedule, "stripeSubscription.schedule");
                await stripe_1.default.subscriptionSchedules.release(stripeSubscription?.schedule);
            }
            // Create new schedule
            const subscriptionSchedule = await stripe_1.default.subscriptionSchedules.create({
                from_subscription: subscription.stripeSubscriptionId,
            });
            await stripe_1.default.subscriptionSchedules.update(subscriptionSchedule.id, {
                metadata: {
                    type: "downgrade",
                },
                phases: [
                    {
                        items: [
                            {
                                price: currentPriceId,
                                quantity: 1,
                            },
                        ],
                        start_date: subscriptionSchedule.phases[0]?.start_date,
                        end_date: subscriptionSchedule.phases[0]?.end_date,
                    },
                    {
                        items: [
                            {
                                price: priceId,
                                quantity: 1,
                            },
                        ],
                    },
                ],
            });
            console.log("Created new schedule for downgrade");
        }
        // Update the subscription in webhookController.ts
        res.status(200).json({
            message: "Subscription updated successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.updateStripeSubscriptionWithPaymentMethodId = updateStripeSubscriptionWithPaymentMethodId;
const getPaymentMethods = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });
        if (!user?.stripeCustomerId) {
            return res.status(400).json({ error: "No Stripe customer found" });
        }
        const paymentMethods = await stripe_1.default.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: "card",
        });
        // Get customer to see default payment method
        const customer = await stripe_1.default.customers.retrieve(user.stripeCustomerId);
        const defaultPaymentMethodId = customer.invoice_settings
            ?.default_payment_method;
        const formattedMethods = paymentMethods.data.map((pm) => ({
            id: pm.id,
            brand: pm.card?.brand,
            last4: pm.card?.last4,
            expMonth: pm.card?.exp_month,
            expYear: pm.card?.exp_year,
            isDefault: pm.id === defaultPaymentMethodId,
        }));
        res.json({ paymentMethods: formattedMethods, defaultPaymentMethodId });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPaymentMethods = getPaymentMethods;
const addPaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId, setAsDefault } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User not found" });
        }
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });
        if (!user?.stripeCustomerId) {
            return res.status(400).json({ error: "No stripe customer found" });
        }
        // Attach payment method to cusotmer
        await stripe_1.default.paymentMethods.attach(paymentMethodId, {
            customer: user.stripeCustomerId,
        });
        // Set as default if requested
        if (setAsDefault) {
            await stripe_1.default.customers.update(user.stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        }
        res.json({
            message: "Payment method added successfully",
            paymentMethodId,
            setAsDefault,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addPaymentMethod = addPaymentMethod;
const updateDefaultPaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });
        if (!user?.stripeCustomerId) {
            return res.status(400).json({ error: "No stripe customer found" });
        }
        await stripe_1.default.customers.update(user.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        res.json({
            message: "Default payment method updated",
            paymentMethodId,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateDefaultPaymentMethod = updateDefaultPaymentMethod;
const removePaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized " });
        }
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });
        if (!user?.stripeCustomerId) {
            return res.status(400).json({ error: "No stripe customer found" });
        }
        const customer = await stripe_1.default.customers.retrieve(user.stripeCustomerId);
        const defaulutPaymentMethodId = customer.invoice_settings
            ?.default_payment_method;
        if (paymentMethodId === defaulutPaymentMethodId) {
            return res.status(400).json({
                error: "Cannot remove default payment method set another one as default",
            });
        }
        await stripe_1.default.paymentMethods.detach(paymentMethodId);
        res.json({ message: "Payment method removed successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.removePaymentMethod = removePaymentMethod;
//# sourceMappingURL=stripeController.js.map