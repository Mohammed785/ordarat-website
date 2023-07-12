import { Router } from "express";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { FinancialRecord, UserRoles } from "../models/User";
import { DI } from "../server";
import { ErrorCodes, NotFoundError, StatusCodes } from "../utils/errors";
import { EntityManager } from "@mikro-orm/sqlite";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { UserCreateDTO } from "../dto/auth";
import { genSalt, hash } from "bcrypt";
import { UniqueConstraintViolationException } from "@mikro-orm/core";

export const usersRouter = Router();

usersRouter.get("/",async(req,res)=>{
    const qb = (DI.em as EntityManager).createQueryBuilder(FinancialRecord,"fr")
    const profits = await qb.select(
        '`fr`.`id`,\
        SUM(IIF(`fr`.`record_type`="مؤكد",`fr`.`amount`,0)) AS confirmedBalance,\
        SUM(IIF(`fr`.`record_type`="تحت التاكيد",`fr`.`amount`,0)) AS unconfirmedBalance,\
        COUNT(DISTINCT `fr`.`order_id`) AS ordersCount'
    ).where({user:req.session.user?.id})
    .cache(true)
    .execute()
    return res.render("home.pug",{user:req.session.user,profits:profits[0]})
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

usersRouter.get("/team/add",rolesMiddleware([UserRoles.ADMIN]),async(req,res)=>{
    return res.render("user/create",{user:req.session.user})
})

usersRouter.post("/api/team/add",rolesMiddleware([UserRoles.ADMIN]),validationMiddleware(UserCreateDTO),async(req,res)=>{
    try {
        req.body.password = await hash(req.body.password, await genSalt());
        const user = DI.userRepository.create({...req.body,isActive:true});
        await DI.em.persistAndFlush(user);
        return res.json({ user });
    } catch (error) {
        if (error instanceof UniqueConstraintViolationException) {
            let field = error.message.split(":").at(-1)!.trim().split(".")[1];
            if (field === "email") {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({
                        code: ErrorCodes.VALIDATION,
                        errors: { email: "البريد الالكتروني مستخدم من قبل" },
                    });
            } else {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    code: ErrorCodes.VALIDATION,
                    errors: { phone: "رقم الهاتف مستخدم من قبل" },
                });
            }
        }
        throw error;
    }
})

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