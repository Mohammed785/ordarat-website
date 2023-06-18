import "express-session"
import { UserRoles } from "./models/User"

declare module "express-session"{
    export interface SessionData{
        user:{id:number,role:UserRoles,name:string}|null
    }
}