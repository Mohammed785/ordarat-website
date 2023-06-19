import { ErrorRequestHandler } from "express";
import { ErrorCodes, StatusCodes } from "../utils/errors";
import { DriverException, ValidationError } from "@mikro-orm/core";

const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    let customError = {
        message: err.message || "لقد حدث خطاء ما يرجي المحاولة مرة اخري",
        status: err.status || StatusCodes.INTERNAL_SERVER_ERROR,
        time: new Date().toUTCString(),
        code: err.code || ErrorCodes.INTERNAL_SERVER_ERROR,
        entity: "",
        field: "",
    };
    if (err instanceof DriverException) {
        let info = err.message.split(":").at(-1)!.trim().split("."); // holds entity and field
        customError.entity = info[0];
        customError.field = info[1];
        customError.status = StatusCodes.BAD_REQUEST;
        customError.code = ErrorCodes.DATABASE_ERROR;
        customError.message = err.message;
    } else if (err instanceof ValidationError) {
        customError.message = err.message.split(",")[0];
        customError.code = ErrorCodes.DATABASE_VALIDATION;
        customError.status = StatusCodes.BAD_REQUEST;
    }
    return res.status(customError.status).json({ ...customError });
};

export default errorMiddleware;
