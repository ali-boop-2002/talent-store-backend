import prisma from "../config/db";
import stripe from "../config/stripe";
import { Request, Response } from "express";
import { Stripe } from "stripe";

import { z } from "zod";
import { io } from "../server";
import { PlanType } from "@prisma/client";
const createContractSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  talentId: z.string().min(1, "Talent ID is required"),
  clientId: z.string().min(1, "Client ID is required"),

  description: z.string().min(1, "Description is required"),
  status: z
    .enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"])
    .default("ACTIVE"),
  rate: z.number().min(0, "Rate is required"),
  paymentType: z.enum(["HOURLY", "FIXED"]).default("HOURLY"),
  timeline: z.string().min(1, "Timeline is required"),
  stripePaymentIntentId: z
    .string()
    .min(1, "Stripe Payment Intent ID is required"),
  // stripeAccountId: z.string().min(1, "Stripe Account ID is required"),
});

// POST http://localhost:3000/api/webhook
export const webhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error) {
    return res
      .status(400)
      .json({ error: "Invalid signature", message: (error as Error).message });
  }

  try {
    switch (event.type) {
      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        try {
          const metadata = charge.metadata;
          if (
            !metadata.jobId ||
            !metadata.clientId ||
            !metadata.talentId ||
            !metadata.description ||
            !metadata.rate ||
            !metadata.paymentType ||
            !metadata.timeline
          ) {
            console.log("No metadata found");
            break;
          }

          const contract = await prisma.contract.create({
            data: {
              description: metadata.description as string,
              jobId: metadata.jobId as string,
              clientId: metadata.clientId,
              talentId: metadata.talentId,
              status: metadata.status as any,
              rate: Number(metadata.rate),
              paymentType: metadata.paymentType as any,
              timeline: metadata.timeline,
              stripePaymentIntentId: charge.payment_intent as string,
            },
          });

          const talent = await prisma.user.findUnique({
            where: { id: metadata.talentId },
          });

          await prisma.order.create({
            data: {
              amount: Number(metadata.rate),
              talentId: metadata.talentId,
              clientId: metadata.clientId,
              platformFee: 100,
              contractId: contract.id,
              stripeAccountId: talent?.stripeAccountId || "",
              stripePaymentIntentId: charge.payment_intent as string,
            },
          });

          io.to(`contract_${metadata.talentId}`).emit(
            "contract created",
            contract
          );
        } catch (error) {
          console.log(error);
        }
        break;
      }
      case "payment_intent.succeeded": {
        const data = event.data.object as Stripe.PaymentIntent;
        try {
          if (!data.metadata.orderId) {
            console.log("No order ID found");
            break;
          }
          await prisma.order.updateMany({
            where: { id: data.metadata.orderId },
            data: { status: "CHARGED" },
          });
        } catch (error) {
          console.log(error);
        }
        break;
      }
      case "payment_intent.failed" as string: {
        const failed = event.data.object as Stripe.PaymentIntent;
        try {
          if (!failed.metadata.orderId) {
            console.log("No order ID found");
            break;
          }
          await prisma.order.updateMany({
            where: { stripePaymentIntentId: failed.id },
            data: { status: "CANCELLED" },
          });
        } catch (error) {
          console.log(error);
        }
        break;
      }
      case "customer.subscription.created": {
        const customerSubscription = event.data.object as Stripe.Subscription;
        try {
          const subscriptionId = customerSubscription.id as string | undefined;
          if (!subscriptionId) {
            console.log("No subscription ID found");
          }
          const priceId = customerSubscription?.items?.data[0]?.price.id;
          const periodStart =
            customerSubscription?.items?.data[0]?.current_period_start;
          const periodEnd =
            customerSubscription?.items?.data[0]?.current_period_end;

          const subscription = await prisma.subscription.update({
            where: { stripeSubscriptionId: subscriptionId as string },
            data: {
              status: "active",
              planType:
                priceId === "price_1SJes2PN81X55KQYRRp54JXc"
                  ? "basic_plan"
                  : priceId === "price_1SJesUPN81X55KQYIJanw81X"
                  ? "premium_tier"
                  : priceId === "price_1SJeu9PN81X55KQYNOc38pOm"
                  ? "pro_plan"
                  : null,
              currentPeriodStart: new Date((periodStart as number) * 1000),
              currentPeriodEnd: new Date((periodEnd as number) * 1000),
              lastKeyAllocation: new Date(),
              nextKeyAllocation: new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              ),
            },
          });
          const user = await prisma.user.findUnique({
            where: { id: subscription.userId },
          });
          if (
            subscription.planType === "basic_plan" ||
            subscription.planType === "premium_tier"
          ) {
            await prisma.user.update({
              where: { id: subscription.userId },
              data: {
                keyBalance:
                  subscription.planType === "basic_plan"
                    ? (user?.keyBalance as number) + 100
                    : (user?.keyBalance as number) + 200, // premium_tier
              },
            });
          }
        } catch (error) {
          console.log(error);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("subscription updated");
        try {
          const previousAttributes = event.data.previous_attributes;
          if (previousAttributes?.items) {
            const oldPriceId = previousAttributes?.items.data[0]?.price.id;
            const newPriceId = subscription.items?.data[0]?.price.id;

            if (oldPriceId !== newPriceId) {
              const updatedSubscription = await prisma.subscription.update({
                where: { stripeSubscriptionId: subscription.id },
                data: {
                  planType:
                    newPriceId === "price_1SJes2PN81X55KQYRRp54JXc"
                      ? "basic_plan"
                      : newPriceId === "price_1SJesUPN81X55KQYIJanw81X"
                      ? "premium_tier"
                      : newPriceId === "price_1SJeu9PN81X55KQYNOc38pOm"
                      ? "pro_plan"
                      : null,
                  stripePriceId: newPriceId as string,
                  lastKeyAllocation: new Date(),
                  nextKeyAllocation: new Date(
                    new Date().setMonth(new Date().getMonth() + 1)
                  ),
                  scheduleForDowngrade: false,
                  subscriptionScheduledForDowngrade: null,
                  currentPeriodStart: new Date(
                    (subscription.items?.data[0]
                      ?.current_period_start as number) * 1000
                  ),
                  currentPeriodEnd: new Date(
                    (subscription.items?.data[0]
                      ?.current_period_end as number) * 1000
                  ),
                },
              });

              const user = await prisma.user.findUnique({
                where: { id: updatedSubscription.userId },
              });

              await prisma.user.update({
                where: { id: updatedSubscription.userId },
                data: {
                  keyBalance:
                    updatedSubscription.planType === "basic_plan"
                      ? (user?.keyBalance as number) + 100
                      : updatedSubscription.planType === "premium_tier"
                      ? (user?.keyBalance as number) + 200
                      : updatedSubscription.planType === "pro_plan"
                      ? (user?.keyBalance as number) + 200
                      : 0,
                },
              });
            }
          }
          if (subscription.cancel_at_period_end) {
            await prisma.subscription.update({
              where: { stripeSubscriptionId: subscription.id },
              data: {
                cancelAtPeriodEnd: true,
                scheduleForDowngrade: false,
                subscriptionScheduledForDowngrade: null,
                currentPeriodEnd: new Date(
                  (subscription.items?.data[0]?.current_period_end as number) *
                    1000
                ),
              },
            });
          }
          if (!subscription.cancel_at_period_end) {
            await prisma.subscription.update({
              where: { stripeSubscriptionId: subscription.id },
              data: {
                cancelAtPeriodEnd: false,
                scheduleForDowngrade: false,
                subscriptionScheduledForDowngrade: null,
                currentPeriodEnd: new Date(
                  (subscription.items?.data[0]?.current_period_end as number) *
                    1000
                ),
              },
            });
          }
        } catch (error) {
          console.log(error);
        }
        break;
      }

      case "subscription_schedule.updated": {
        const subscription = event.data.object as Stripe.SubscriptionSchedule;
        try {
          if (
            subscription.metadata?.type === "downgrade" &&
            subscription.subscription
          ) {
            await prisma.subscription.update({
              where: {
                stripeSubscriptionId: subscription.subscription as string,
              },
              data: {
                scheduleForDowngrade: true,
                subscriptionScheduledForDowngrade:
                  (subscription.phases[1]?.items[0]?.price as string) ===
                  "price_1SJes2PN81X55KQYRRp54JXc"
                    ? "basic_plan"
                    : (subscription.phases[1]?.items[0]?.price as string) ===
                      "price_1SJesUPN81X55KQYIJanw81X"
                    ? "premium_tier"
                    : (subscription.phases[1]?.items[0]?.price as string) ===
                      "price_1SJeu9PN81X55KQYNOc38pOm"
                    ? "pro_plan"
                    : null,
              },
            });
          }
        } catch (error) {
          console.log(error);
        }

        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        try {
          const updatedSubscription = await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: "cancelled",
              cancelAtPeriodEnd: false,
              scheduleForDowngrade: false,
              subscriptionScheduledForDowngrade: null,
            },
          });
        } catch (error) {
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
  } catch (error) {
    console.error("⚠️ Webhook processing error:", error);
    // Always respond 200 to prevent Stripe retries, even on internal error
    res.status(200).json({ received: true });
  }
};
