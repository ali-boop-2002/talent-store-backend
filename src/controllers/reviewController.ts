// make a review controller that will handle the review logic

import prisma from "../config/db";
import { Request, Response } from "express";
import { z } from "zod";

const reviewSchema = z.object({
  talentId: z.string(),
  rating: z.number(),
  review: z.string(),
  jobId: z.string(),
  contractId: z.string(),
});

const createReview = async (req: Request, res: Response) => {
  console.log("createReview", req.body);
  const userId = req.user?.id;
  try {
    const validatedData = reviewSchema.parse(req.body);
    const alreadyReviewed = await prisma.review.findFirst({
      where: {
        jobId: validatedData.jobId,
        userId: userId as string,
      },
    });
    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this job" });
    }
    const newReview = await prisma.review.create({
      data: {
        ...validatedData,
        userId: userId as string,
      },
    });
    res.status(200).json({ newReview });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// make a function to get all reviews for a talent
const getAllReviewsForTalent = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { talentId: req.params.talentId as string },
    });
    if (!reviews) {
      return res.status(404).json({ message: "No reviews found" });
    }
    const averageRating =
      reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    res.status(200).json({ reviews, averageRating });
  } catch (error) {
    console.error("Get all reviews for talent error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// make a function to get all reviews based on the contract id
const getAllReviewsForContract = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const reviews = await prisma.review.findMany({
      where: {
        contractId: req.params.contractId as string,
        userId: userId as string,
      },
    });
    if (!reviews) {
      return res.status(404).json({ message: "No reviews found" });
    }
    const averageRating =
      reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    res.status(200).json({ reviews, averageRating });
  } catch (error) {
    console.error("Get all reviews for contract error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const clientReviewSchema = z.object({
  rating: z.number(),
  review: z.string(),
  jobId: z.string(),
  contractId: z.string(),
  userId: z.string(),
});

// note talent id is the user id of the talent and userId is the user id of the client
const createClientReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const validatedData = clientReviewSchema.parse(req.body);
    const newClientReview = await prisma.clientReview.create({
      data: {
        ...validatedData,
        talentId: userId as string,
      },
    });
    res.status(200).json({ newClientReview });
  } catch (error) {
    console.error("Create client review error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const getClientReviewsForContract = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.clientReview.findMany({
      where: { contractId: req.params.contractId as string },
    });
    if (!reviews) {
      return res.status(404).json({ message: "No reviews found" });
    }
    if (reviews.length > 0) {
      const averageRating =
        reviews.reduce((acc, review) => acc + review.rating, 0) /
        reviews.length;
      res.status(200).json({ reviews, averageRating });
    } else {
      res.status(200).json({ reviews });
    }
  } catch (error) {
    console.error("Get client reviews for contract error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

const getAllClientReviews = async (req: Request, res: Response) => {
  try {
    console.log("getAllClientReviews", req.params.clientId);
    if (!req.params.clientId) {
      return res.status(400).json({ message: "Client ID is required" });
    }
    const reviews = await prisma.clientReview.findMany({
      where: { userId: req.params.clientId as string },
      include: {
        talent: true,
      },
    });

    if (!reviews) {
      return res.status(404).json({ message: "No reviews found" });
    }
    console.log("reviews", reviews);

    if (reviews.length > 0) {
      const averageRating =
        reviews.reduce((acc, review) => acc + review.rating, 0) /
        reviews.length;
      res.status(200).json({ reviews, averageRating });
    } else {
      res.status(200).json({ reviews });
    }
  } catch (error) {
    console.error("Get all client reviews error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export default {
  createReview,
  getAllReviewsForTalent,
  getAllReviewsForContract,
  createClientReview,
  getClientReviewsForContract,
  getAllClientReviews,
};
