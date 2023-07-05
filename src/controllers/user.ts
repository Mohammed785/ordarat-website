import { Router } from "express";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { UserRoles } from "../models/User";
import { DI } from "../server";
import { ErrorCodes, NotFoundError } from "../utils/errors";

export const usersRouter = Router();

usersRouter.get(
    "/users",
    rolesMiddleware([UserRoles.ADMIN]),
    async (req, res) => {
        const { cursor, page_size,active } = req.query;
        const DEFAULT_LIMIT = 20;
        const users = await DI.userRepository.find(
            {
                isActive: active==="1"?true:false,
                isDeleted:false,
                id:{ $gt: parseInt(cursor as string) || 0 }
            },
            {
                limit: parseInt(page_size as string) || DEFAULT_LIMIT,
                orderBy:{id:"ASC"}
            }
        );
        const last =
            users[(parseInt(page_size as string) || DEFAULT_LIMIT) - 1];
        const next = last ? last.id : -1;
        if (req.get("Accept") === "application/json") {
            return res.json({ users, next });
        }
        return res.render("user/list.pug", {
            users,
            next,
            active:active==="1",
            user: req.session.user,
        });
    }
);

usersRouter.get("/profile", async (req, res) => {
    const user = await DI.userRepository.findOne({ id: req.session.user!.id });
    return res.render("user/profile.pug", { user });
});

usersRouter.put("/users/active",rolesMiddleware([UserRoles.ADMIN]),async(req,res)=>{
    const activatedUsers = await DI.userRepository.nativeUpdate({id:{$in:req.body.users}},{isActive:true})
    return res.json({activatedUsers})
})

usersRouter.delete("/user/:id",rolesMiddleware([UserRoles.ADMIN]),async(req,res)=>{
    const user = await DI.userRepository.findOneOrFail({id:parseInt(req.params.id)},{fields:["isActive"],failHandler(entityName, where) {
        return new NotFoundError("الستخدم غير موجود",ErrorCodes.ENTITY_NOT_FOUND)
    }})
    if(user.isActive){
        await DI.userRepository.nativeUpdate({id:parseInt(req.params.id)},{isDeleted:true})
    }else{
        await DI.userRepository.nativeDelete({id:parseInt(req.params.id),isActive:false})
    }
    return res.sendStatus(200)
})