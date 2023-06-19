import { RequestHandler } from "express";
import { NotAuthenticatedError } from "../utils/errors";

const authMiddleware: RequestHandler = (req, res, next) => {
    if (!req.session.user) {
        if (req.baseUrl.includes("/api")) {
            throw new NotAuthenticatedError("يرجي تسجيل الدخول");
        } else {
            return res.redirect("/login");
        }
    }
    next();
};

export default authMiddleware;
