-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "fixedPrice" TEXT,
ADD COLUMN     "halfhourPay" TEXT,
ADD COLUMN     "hourlyPay" TEXT;

-- CreateTable
CREATE TABLE "public"."Gig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "hourlyPrice" BOOLEAN NOT NULL,
    "fixedPrice" BOOLEAN NOT NULL,

    CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gig_userId_key" ON "public"."Gig"("userId");

-- AddForeignKey
ALTER TABLE "public"."Gig" ADD CONSTRAINT "Gig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
