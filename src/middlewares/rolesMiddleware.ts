import { RequestHandler } from "express";
import { UserRoles } from "../models/User";
import { ForbiddenError, StatusCodes } from "../utils/errors";

function rolesMiddleware(roles: UserRoles[]): RequestHandler {
    return (req, res, next) => {
        if (!roles.includes(req.session.user!.role)) {
            if (
                req.originalUrl.includes("/api") ||
                req.get("Accept") === "application/json"
            ) {
                throw new ForbiddenError("غير مسموح لك بالدخول");
            } else {
                return res.status(StatusCodes.FORBIDDEN).redirect("/");
            }
        }
        next();
    };
}

export default rolesMiddleware;
