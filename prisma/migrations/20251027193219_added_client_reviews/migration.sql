-- CreateTable
CREATE TABLE "public"."ClientReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ClientReview" ADD CONSTRAINT "ClientReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientReview" ADD CONSTRAINT "ClientReview_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
