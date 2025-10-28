import { Request, Response } from "express";
import prisma from "../config/db";
import stripe from "../config/stripe";

const createStripePaymentIntent = async (req: Request, res: Response) => {
  try {
    const {
      amount,
      clientId,
      talentId,
      contractId,
      description,
      paymentType,
      timeline,
      jobId,
      status,
      rate,
    } = req.body;

    const client = await prisma.user.findUnique({
      where: { id: clientId as string },
    });

    const talent = await prisma.user.findUnique({
      where: { id: talentId as string },
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
    const platformFeeInCents = Math.round(
      ((amountNum * platformFeePercent) / 100) * 100
    );

    const paymentIntent = await stripe.paymentIntents.create({
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create Stripe payment intent",
      error,
    });
  }
};

const getOrderDetails = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId as string },
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
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to get order details", error });
  }
};

const createSetupIntent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // Get or create customer
    let customer;
    if (user?.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user?.email as string,
        name: user?.name as string,
        metadata: { userId },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });
    }
    // Create setup intent (for saving payment method)
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
    });
    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
    });
  } catch (error) {
    console.error("Setup intent error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export { createStripePaymentIntent, getOrderDetails, createSetupIntent };
