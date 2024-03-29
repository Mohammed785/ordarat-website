enum StatusCodes {
    OK= 200,
    CREATED= 201,
    ACCEPTED= 202,
    BAD_REQUEST= 400,
    UNAUTHORIZED= 401,
    PAYMENT_REQUIRED= 402,
    FORBIDDEN= 403,
    NOT_FOUND= 404,
    METHOD_NOT_ALLOWED= 405,
    REQUEST_TIMEOUT= 408,
    TOO_MANY_REQUESTS= 429,
    INTERNAL_SERVER_ERROR= 500,
    BAD_GATEWAY= 502,
};

class CustomError extends Error {
    status: number;
    code: string;
    constructor(message: string) {
        super(message);
        this.message = message;
    }
}

class InternalServerError extends CustomError {
    constructor(message: string, code = ErrorCodes.INTERNAL_SERVER_ERROR) {
        super(message);
        this.status = StatusCodes.INTERNAL_SERVER_ERROR;
        this.code = code
    }
}

class NotFoundError extends CustomError {
    constructor(message: string,code = ErrorCodes.NOT_FOUND) {
        super(message);
        this.status = StatusCodes.NOT_FOUND;
        this.code = code
    }
}

class BadRequestError extends CustomError {
    constructor(message: string, code = ErrorCodes.BAD_REQUEST) {
        super(message);
        this.status = StatusCodes.BAD_REQUEST;
        this.code = code;
    }
}

class ForbiddenError extends CustomError {
    constructor(message: string, code = ErrorCodes.FORBIDDEN) {
        super(message);
        this.status = StatusCodes.FORBIDDEN;
        this.code = code;
    }
}

class NotAuthenticatedError extends CustomError {
    constructor(message: string,code=ErrorCodes.UNAUTHORIZED) {
        super(message);
        this.status = StatusCodes.UNAUTHORIZED;
        this.code = code;
    }
}

enum ErrorCodes {
    BAD_REQUEST = "BAD_REQUEST",
    NOT_FOUND = "NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    WRONG_CREDENTIALS = "WRONG_CREDENTIALS",
    ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND",
    FOREIGN_NOT_FOUND = "FOREIGN_NOT_FOUND",
    UNIQUE_CONSTRAINT = "UNIQUE_CONSTRAINT",
    ALREADY_LOGGED = "ALREADY_LOGGED",
    WRONG_PARAM = "WRONG_PARAM",
    ADMIN_REQUIRED = "ADMIN_REQUIRED",
    USER_REQUIRED = "USER_REQUIRED",
    DATABASE_ERROR = "DATABASE_ERROR",
    WRONG_FORMAT_DATA = "WRONG_FORMAT_DATA",
    VALIDATION = "VALIDATION",
    DATABASE_VALIDATION = "DATABASE_VALIDATION",
}

export {
    CustomError,
    NotAuthenticatedError,
    NotFoundError,
    BadRequestError,
    ForbiddenError,
    InternalServerError,
    StatusCodes,
    ErrorCodes
};
