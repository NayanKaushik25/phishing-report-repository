import type { Request, Response, NextFunction } from "express";

export type UserRole = "REPORTER" | "ANALYST" | "ADMIN";

export interface AuthenticatedUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  next();
}

export function allowRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.session.user;

    if (!user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
}
