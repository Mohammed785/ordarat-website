import { Router } from "express";
import { DI } from "../server";
import { compare, genSalt, hash } from "bcrypt";
import { BadRequestError, ErrorCodes } from "../utils/errors";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { LoginDTO, RegisterDTO } from "../dto/auth";
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
        req.body.password = await hash(req.body.password, await genSalt());
        const user = DI.userRepository.create(req.body);
        await DI.em.persistAndFlush(user);
        return res.json({ user });
    }
);

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
