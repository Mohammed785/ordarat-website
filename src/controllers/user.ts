import { Router } from "express";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { FinancialRecord, UserRoles } from "../models/User";
import { DI } from "../server";
import { ErrorCodes, NotFoundError } from "../utils/errors";
import { EntityManager } from "@mikro-orm/sqlite";

export const usersRouter = Router();

usersRouter.get("/",async(req,res)=>{
    const qb = (DI.em as EntityManager).createQueryBuilder(FinancialRecord,"fr")
    const profits = await qb.select(
        `id,SUM(IIF(record_type="مؤكد",amount,0)) AS confirmedBalance,
        SUM(IIF(record_type="تحت التاكيد",amount,0)) AS unconfirmedBalance,
        COUNT(DISTINCT order_id) AS ordersCount`
    ).where({user:req.session.user?.id})
    .cache(true)
    .getSingleResult()
    return res.render("home.pug",{user:req.session.user,profits})
})

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

usersRouter.put("/api/profile",async(req,res)=>{
    const user = DI.userRepository.getReference(req.session.user!.id)
    DI.userRepository.assign(user,req.body)
    await DI.em.flush()
    return res.json(user)
})

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