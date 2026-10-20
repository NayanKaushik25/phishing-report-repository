import "express-session";
import type { AuthenticatedUser } from "../middleware/auth.js";

declare module "express-session" {
  interface SessionData {
    user?: AuthenticatedUser;
  }
}
