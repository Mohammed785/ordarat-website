import {validate} from "class-validator";
import { plainToInstance } from "class-transformer";
import { RequestHandler } from "express";
import { ErrorCodes, StatusCodes } from "../utils/errors";

export function validationMiddleware(type:any,skipMissingProperties=false):RequestHandler{
    return async(req,res,next)=>{
        const errors = await validate(plainToInstance(type, req.body),{skipMissingProperties,whitelist:true});
        if(errors.length>0){
            const errorsRecord:Record<string,any> = {}
            errors.forEach(err=>{
                errorsRecord[err.property]=Object.values(err.constraints!).join(",");
            })
            return res.status(StatusCodes.BAD_REQUEST).json({...errorsRecord,code:ErrorCodes.VALIDATION})
        }
        next()
    }
}