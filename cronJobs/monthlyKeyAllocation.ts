import cron from "node-cron";
import prisma from "../src/config/db";
cron.schedule("0 0 * * *", async () => {
  console.log("Running monthly key allocation...");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Get all active subscriptions
    const subscriptionsNeedingKeys = await prisma.subscription.findMany({
      where: {
        planType: "pro_plan",
        currentPeriodEnd: {
          gte: new Date(),
        },
        nextKeyAllocation: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { user: true },
    });

    if (subscriptionsNeedingKeys.length === 0) {
      console.log("No users need key allocation today");
      return;
    }

    for (const subscription of subscriptionsNeedingKeys) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: {
          keyBalance: subscription.user.keyBalance + 200,
        },
      });
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          lastKeyAllocation: new Date(),
          nextKeyAllocation: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
        },
      });
    }
  } catch (error) {
    console.error("Monthly key allocation failed:", error);
  }
});
