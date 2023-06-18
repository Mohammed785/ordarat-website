import "express-async-errors"
import express from "express";
import {config} from "dotenv"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import { EntityManager, EntityRepository, MikroORM, RequestContext } from "@mikro-orm/core";
import User from "./models/User";
import { SqliteDriver } from "@mikro-orm/sqlite";
import { authRouter } from "./controllers/auth";
import errorMiddleware from "./middlewares/errorMiddleware";
config();

const app = express();


export const DI = {} as {
    orm: MikroORM;
    em: EntityManager;
    userRepository: EntityRepository<User>;
};
const port = process.env.PORT || 8000;
const init = (async()=>{
    DI.orm = await MikroORM.init<SqliteDriver>()
    DI.em  = DI.orm.em;
    DI.userRepository = DI.orm.em.getRepository(User)

    app.use(express.json())
    app.use(bodyParser.urlencoded({extended:true}))
    app.use(cookieParser())
    app.use((req,res,next)=>RequestContext.create(DI.orm.em,next))
    app.use("/api/auth",authRouter)
    app.use(errorMiddleware)
    app.listen(port,()=>{
        console.log(`[SERVER] Listen on port ${port}`)
    })
})()