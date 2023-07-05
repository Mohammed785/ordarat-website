import "express-async-errors"
import express from "express";
import {config} from "dotenv"
import bodyParser from "body-parser"
import session from "express-session"
import { EntityManager, EntityRepository, MikroORM, RequestContext } from "@mikro-orm/core";
import { FinancialRecord, User, UserRoles, WithdrawRequest } from "./models/User";
import { SqliteDriver } from "@mikro-orm/sqlite";
import { authRouter } from "./controllers/auth";
import errorMiddleware from "./middlewares/errorMiddleware";
import { join } from "path";
import { Product, Variant } from "./models/Product";
import { productRouter } from "./controllers/product";
import authMiddleware from "./middlewares/authMiddleware";
import { Order, OrderItem, OrderState, ShippingCompany } from "./models/Order";
import { orderRouter } from "./controllers/order";
import { shippingRouter } from "./controllers/shipping";
import { usersRouter } from "./controllers/user";

config();

const app = express();

export const DI = {} as {
    orm: MikroORM;
    em: EntityManager;
    userRepository: EntityRepository<User>;
    productRepository: EntityRepository<Product>;
    variantRepository: EntityRepository<Variant>;
    orderRepository: EntityRepository<Order>;
    orderItemRepository: EntityRepository<OrderItem>;
    shippingRepository: EntityRepository<ShippingCompany>;
    financialRecordRepository: EntityRepository<FinancialRecord>;
    withdrawRequestRepository: EntityRepository<WithdrawRequest>
};
const port = process.env.PORT || 8000;
const init = (async()=>{
    DI.orm = await MikroORM.init<SqliteDriver>()
    DI.em  = DI.orm.em;
    DI.userRepository = DI.orm.em.getRepository(User);
    DI.productRepository = DI.orm.em.getRepository(Product);
    DI.variantRepository = DI.orm.em.getRepository(Variant);
    DI.orderRepository = DI.orm.em.getRepository(Order);
    DI.orderItemRepository = DI.orm.em.getRepository(OrderItem);
    DI.shippingRepository = DI.orm.em.getRepository(ShippingCompany);
    DI.financialRecordRepository = DI.orm.em.getRepository(FinancialRecord);
    DI.withdrawRequestRepository = DI.orm.em.getRepository(WithdrawRequest)
    app.use(express.json())
    app.use(bodyParser.urlencoded({extended:true}))
    app.use(session({
        secret:process.env.SESSION_SECRET as string,
        resave:false,
        saveUninitialized:true,
        cookie:{httpOnly:true,secure:process.env.NODE_ENV==="production"?true:false,maxAge:1000*60*60*24},
    }))
    app.use(express.static(join(__dirname,"..","public")))
    app.set("views",join(__dirname,"..","views"));
    app.set("view engine","pug");
    app.use((req,res,next)=>RequestContext.create(DI.orm.em,next))
    app.get("/",async(req,res)=>{
        return res.render("home.pug",{user:req.session.user})
    })
    app.use("",authRouter)
    app.use("",authMiddleware,productRouter)
    app.use("",authMiddleware,orderRouter)
    app.use("",authMiddleware,shippingRouter)
    app.use("",authMiddleware,usersRouter)
    app.use(async(req,res)=>{
        return res.status(404).render("404Page.pug")
    })
    app.use(errorMiddleware)
    app.listen(port,()=>{
        console.log(`[SERVER] Listen on port ${port}`)
    })
})()