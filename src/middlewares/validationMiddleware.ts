import {ValidationError, validate} from "class-validator";
import { plainToInstance } from "class-transformer";
import { RequestHandler } from "express";
import { ErrorCodes, StatusCodes } from "../utils/errors";

export function validationMiddleware(type:any,skipMissingProperties=false):RequestHandler{
    return async(req,res,next)=>{
        const errors = await validate(plainToInstance(type, req.body),{skipMissingProperties,whitelist:true});
        if(errors.length>0){
            const errorsRecord:Record<string,any> = {}
            
            const handleNestedError = (errors: ValidationError[]) => {
                for (const err of errors) {
                    if (
                        Array.isArray(err.children) &&
                        err.children.length > 0
                    ) {
                        handleNestedError(err.children);
                    }
                    if (err.constraints) {
                        errorsRecord[err.property] = Object.values(
                            err.constraints!
                        ).join(",");
                    }
                }
            };
            errors.forEach((err) => {
                if (!err.constraints) {
                    handleNestedError(err.children!);
                } else {
                    errorsRecord[err.property] = Object.values(
                        err.constraints!
                    ).join(",");
                }
            });
            return res.status(StatusCodes.BAD_REQUEST).json({errors:errorsRecord,code:ErrorCodes.VALIDATION})
        }
        next()
    }
}