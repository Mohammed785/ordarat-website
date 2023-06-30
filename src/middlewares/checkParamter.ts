import { RequestHandler } from "express";
import { BadRequestError, ErrorCodes } from "../utils/errors";

export default function checkParameter(params:string[]):RequestHandler{
    return (req,res,next)=>{
        for(const param of params){
            if(req.params[param] && !parseInt(req.params[param])){
                throw new BadRequestError(`صحيح ${param} يجب توفير`,ErrorCodes.WRONG_PARAM);
            }
        }
        next()
    }
}