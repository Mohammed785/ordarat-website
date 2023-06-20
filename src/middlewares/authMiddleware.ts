import { RequestHandler } from "express";
import { NotAuthenticatedError } from "../utils/errors";

const authMiddleware: RequestHandler = (req, res, next) => {
    if (!req.session.user) {
        if (
            req.originalUrl.includes("api") ||
            req.get("Accept") === "application/json"
        ) {
            throw new NotAuthenticatedError("يرجي تسجيل الدخول");
        } else {
            return res.redirect("/login");
        }
    }
    next();
};

export default authMiddleware;
