import { Router } from "express";
import { DI } from "../server";
import { compare, genSalt, hash } from "bcrypt";
import { BadRequestError, ErrorCodes, NotFoundError, StatusCodes } from "../utils/errors";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { ChangePasswordDTO, LoginDTO, RegisterDTO } from "../dto/auth";
import { UniqueConstraintViolationException } from "@mikro-orm/core";
export const authRouter = Router();

authRouter.get("/login",async(req,res)=>{
    return res.render("auth/login")
});

authRouter.get("/register",async(req,res)=>{
    return res.render("auth/register");
})

authRouter.post(
    "/api/auth/login",
    validationMiddleware(LoginDTO),
    async (req, res) => {
        const { phone, password } = req.body;
        const user = await DI.userRepository.findOneOrFail(
            { phone },
            {
                failHandler(entityName, where) {
                    throw new BadRequestError(
                        "يرجي التاكد من رقم الهاتف و كلمة السر",
                        ErrorCodes.WRONG_CREDENTIALS
                    );
                },
            }
        );
        if(!user.isActive){
            throw new BadRequestError("الحساب لم يتم تفعيلة بعد يرجي الانتظار حتي يتم التفعيل")
        }
        if (!(await compare(password, user.password))) {
            throw new BadRequestError(
                "يرجي التاكد من رقم الهاتف و كلمة السر",
                ErrorCodes.WRONG_CREDENTIALS
            );
        }
        res.setHeader("Access-Control-Allow-Credentials", "true");
        req.session.user = {
            id: user.id,
            role: user.role,
            name: user.firstName,
        };
        return res.json({ user });
    }
);

authRouter.post(
    "/api/auth/register",
    validationMiddleware(RegisterDTO),
    async (req, res) => {
        try {
            req.body.password = await hash(req.body.password, await genSalt());
            const user = DI.userRepository.create(req.body);
            await DI.em.persistAndFlush(user);
            return res.json({ user });
        } catch (error) {
            if(error instanceof UniqueConstraintViolationException){
                let field = error.message.split(":").at(-1)!.trim().split(".")[1];
                if(field==="email"){
                    return res.status(StatusCodes.BAD_REQUEST).json({code:ErrorCodes.VALIDATION,errors:{email:"البريد الالكتروني مستخدم من قبل"}})
                }else{
                    return res.status(StatusCodes.BAD_REQUEST).json({
                            code: ErrorCodes.VALIDATION,
                            errors: { phone: "رقم الهاتف مستخدم من قبل" },
                        });
                }
            }
            throw error
        }
    }
);

authRouter.put("/api/auth/changePassword",validationMiddleware(ChangePasswordDTO),async(req,res)=>{
    if(req.body.confirmPassword!==req.body.newPassword){
        return res.status(StatusCodes.BAD_REQUEST).json({errors:{confirmPassword:"يجب ان يكون مطابق لي كلمة المرور الجديدة"},code:ErrorCodes.VALIDATION})
    }
    const user = await DI.userRepository.findOneOrFail({id:req.session.user?.id},{
        fields:["password"],
        failHandler(entityName, where) {
            return new NotFoundError("المستخدم غير موجود",ErrorCodes.ENTITY_NOT_FOUND)
        },
    })
    if(!await compare(req.body.oldPassword,user.password)){
        return res.status(StatusCodes.BAD_REQUEST).json({errors:{oldPassword:"كلمة السر القديمة غير صحيحة"},code:ErrorCodes.VALIDATION})
    }
    user.password = await hash(req.body.newPassword,await genSalt());
    await DI.em.flush();
    return res.sendStatus(200)
})

authRouter.post("/api/auth/logout", async (req, res, next) => {
    req.session.user = null;
    req.session.save((err) => {
        if (err) next(err);
        req.session.regenerate((err) => {
            if (err) next(err);
            res.sendStatus(200);
        });
    });
});
