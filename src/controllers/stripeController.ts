import prisma from "../config/db";
import stripe from "../config/stripe";
import { Request, Response } from "express";
import { PlanType, Status } from "@prisma/client";
import { success } from "zod";
import { error } from "console";

const createStripeAccount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const account = await stripe.accounts.create({
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
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: account.id },
    });
    return res.status(200).json({ message: "Stripe account created", account });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create Stripe account", error });
  }
};

const createStripeLink = async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({ error: "No Stripe account found" });
    }

    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/profile/userProfile/${user.id}?refresh=true`,
      return_url: `${process.env.CLIENT_URL}/`,
      type: "account_onboarding",
    });

    res.json({
      success: true,
      url: accountLink.url,
    });
  } catch (error) {
    console.error("Create link error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

const checkOnboardingStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user || !user.stripeAccountId) {
      return res.json({
        complete: false,
        hasAccount: false,
      });
    }

    // Get account from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId, {
      expand: ["capabilities", "capabilities", "individual"],
    });

    console.log(account, "account");
    const isComplete =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    // Update database
    if (isComplete && !user.onboardingComplete) {
      await prisma.user.update({
        where: { id: userId as string },
        data: { onboardingComplete: true },
      });
    }

    res.json({
      complete: isComplete,
      hasAccount: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

const createStripeSubscription = async (req: Request, res: Response) => {
  try {
    const { priceId, paymentMethodId } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "no user found" });
    }
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "No customer found" });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Set as default
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // if (existingSubscription) {
    //   return res.status(400).json({
    //     error:
    //       "User already has a subscription. Use upgrade/downgrade endpoints instead.",
    //   });
    // }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
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
      ? new Date((subscription.latest_invoice as any).period_start * 1000)
      : new Date(subscription.start_date * 1000);

    const periodEnd = subscription.latest_invoice
      ? new Date((subscription.latest_invoice as any).period_end * 1000)
      : null;
    if (existingSubscription) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          userId,
          stripeSubscriptionId: subscription.id as string,
          stripeCustomerId: user.stripeCustomerId,
          stripePriceId: priceId,
          planType:
            priceId === "price_1SJes2PN81X55KQYRRp54JXc"
              ? "basic_plan"
              : priceId === "price_1SJesUPN81X55KQYIJanw81X"
              ? "premium_tier"
              : "pro_plan",
          status: subscription.status as Status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          stripeSubscriptionId: subscription.id as string,
          stripeCustomerId: user.stripeCustomerId,
          stripePriceId: priceId,
          planType:
            priceId === "price_1SJes2PN81X55KQYRRp54JXc"
              ? "basic_plan"
              : priceId === "price_1SJesUPN81X55KQYIJanw81X"
              ? "premium_tier"
              : "pro_plan",
          status: subscription.status as Status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    res.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent
        ?.client_secret,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

const checkSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const subscription = await prisma.subscription.findUnique({
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
  } catch (error) {
    console.error("Subscription status check error:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
};

const cancelStripeSubscription = async (req: Request, res: Response) => {
  try {
    const { status = false } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );
    if (stripeSubscription.schedule) {
      await stripe.subscriptionSchedules.release(
        stripeSubscription?.schedule as string
      );
      if (status === true) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
      }
    } else {
      // If no schedule, update the subscription directly
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: status,
      });
    }
    res.status(200).json({
      message: success,
      data: {
        subscription,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
};
const updateStripeSubscriptionWithPaymentMethodId = async (
  req: Request,
  res: Response
) => {
  try {
    const { priceId, paymentMethodId } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    if (!subscription.stripeCustomerId) {
      return res.status(404).json({ error: "No Stripe customer found" });
    }
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription.stripeCustomerId,
    });
    await stripe.customers.update(subscription.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    const priceHierarchy = {
      price_1SJes2PN81X55KQYRRp54JXc: 1, // basic_plan - $10
      price_1SJesUPN81X55KQYIJanw81X: 2, // premium_tier - $20
      price_1SJeu9PN81X55KQYNOc38pOm: 3, // pro_plan - $30
    };

    // Get the current subscription item ID (required by Stripe)
    const currentPriceId = stripeSubscription?.items?.data[0]?.price?.id;

    const subscriptionItemId = stripeSubscription?.items?.data[0]?.id;
    if (
      priceHierarchy[priceId as keyof typeof priceHierarchy] >
      priceHierarchy[currentPriceId as unknown as keyof typeof priceHierarchy]
    ) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [
          {
            id: subscriptionItemId as string,
            price: priceId,
          },
        ],
        proration_behavior: "none",
        billing_cycle_anchor: "now",
      });
    }

    if (
      priceHierarchy[priceId as keyof typeof priceHierarchy] <
      priceHierarchy[currentPriceId as unknown as keyof typeof priceHierarchy]
    ) {
      console.log("Downgrading subscription");
      // so the first time user downgrade schedule wont exist so we need to create a new one that is why else block is there
      // but second time user downgrade schedule will exist so we need to update the existing schedule

      if (stripeSubscription.schedule) {
        // Get the existing schedule first to access its properties correctly
        // const existingSchedule = await stripe.subscriptionSchedules.retrieve(
        //   stripeSubscription.schedule as string

        // );
        // console.log(stripeSubscription.schedule, "stripeSubscription.schedule");

        await stripe.subscriptionSchedules.release(
          stripeSubscription?.schedule as string
        );
      }
      // Create new schedule
      const subscriptionSchedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.stripeSubscriptionId,
      });

      await stripe.subscriptionSchedules.update(subscriptionSchedule.id, {
        metadata: {
          type: "downgrade",
        },
        phases: [
          {
            items: [
              {
                price: currentPriceId as string,
                quantity: 1,
              },
            ],
            start_date: subscriptionSchedule.phases[0]?.start_date as number,
            end_date: subscriptionSchedule.phases[0]?.end_date as number,
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
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
};

const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });
    // Get customer to see default payment method

    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    const defaultPaymentMethodId = (customer as any).invoice_settings
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
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

const addPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { paymentMethodId, setAsDefault } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not found" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: "No stripe customer found" });
    }

    // Attach payment method to cusotmer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });
    // Set as default if requested

    if (setAsDefault) {
      await stripe.customers.update(user.stripeCustomerId, {
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
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

const updateDefaultPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: "No stripe customer found" });
    }
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    res.json({
      message: "Default payment method updated",
      paymentMethodId,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

const removePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized " });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: "No stripe customer found" });
    }
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    const defaulutPaymentMethodId = (customer as any).invoice_settings
      ?.default_payment_method;

    if (paymentMethodId === defaulutPaymentMethodId) {
      return res.status(400).json({
        error:
          "Cannot remove default payment method set another one as default",
      });
    }
    await stripe.paymentMethods.detach(paymentMethodId as string);

    res.json({ message: "Payment method removed successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export {
  getPaymentMethods,
  addPaymentMethod,
  updateDefaultPaymentMethod,
  removePaymentMethod,
  createStripeAccount,
  createStripeLink,
  checkOnboardingStatus,
  createStripeSubscription,
  checkSubscriptionStatus,
  cancelStripeSubscription,
  // upgradeStripeSubscription,
  updateStripeSubscriptionWithPaymentMethodId,
};
