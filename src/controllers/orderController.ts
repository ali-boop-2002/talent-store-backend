import { Request, Response } from "express";
import prisma from "../config/db";

const getOrdersForTalent = async (req: Request, res: Response) => {
  try {
    const talentId = req.user?.id;
    if (!talentId) {
      return res.status(400).json({ message: "Talent ID is required" });
    }
    const talent = await prisma.user.findUnique({
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
    const orders = await prisma.order.findMany({
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

    const contracts = await prisma.contract.findMany({
      where: {
        id: { in: orders.map((order) => order.contractId ?? "") },
      },
      include: {
        talent: true,
        client: true,
        orders: true,
      },
    });

    const jobs = await prisma.job.findMany({
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
  } catch (error) {
    res.status(500).json({ message: "Failed to get orders" });
    console.log(error);
  }
};

const getOrdersForClient = async (req: Request, res: Response) => {
  try {
    const clientId = req.user?.id;
    if (!clientId) {
      return res.status(400).json({ message: "Client ID is required" });
    }
    const orders = await prisma.order.findMany({
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

    const contracts = await prisma.contract.findMany({
      where: {
        id: { in: orders.map((order) => order.contractId ?? "") },
      },
      include: {
        talent: true,
        client: true,
        orders: true,
      },
    });
    const jobs = await prisma.job.findMany({
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
  } catch (error) {
    res.status(500).json({ message: "Failed to get orders" });
    console.log(error);
  }
};

export { getOrdersForTalent, getOrdersForClient };
