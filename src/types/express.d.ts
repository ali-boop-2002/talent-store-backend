import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User; // <--- Prisma's User type
    }
  }
}
