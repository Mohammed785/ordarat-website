import { Router } from "express";
import { DI } from "../server";
import { Order, OrderState } from "../models/Order";
import { BadRequestError, ErrorCodes, NotFoundError } from "../utils/errors";
import { ForeignKeyConstraintViolationException, UniqueConstraintViolationException } from "@mikro-orm/core";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { OrderDTO, OrderItemDTO, OrderWithItemsDTO } from "../dto/order";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { UserRoles } from "../models/User";
import { EntityManager, QueryBuilder } from "@mikro-orm/sqlite";
import { Variant } from "../models/Product";
import checkParameter from "../middlewares/checkParamter";

export const orderRouter = Router()

orderRouter.get("/orders/add",async(req,res)=>{
    const products = await DI.productRepository.findAll({fields:["id","code","name","buyPrice","affiliatePrice","sellPrice"],cache:true})
    return res.render("orders/add.pug",{user:req.session.user,products})
})

orderRouter.get("/order/:code",async(req,res)=>{
    const order = await DI.orderRepository.findOne({orderCode:req.params.code},{populate:req.query.items?["items"]:[]})
    if(req.get("Accept")==="application/json"){
        if(!order){
            throw new NotFoundError("الاوردر غير موجود",ErrorCodes.ENTITY_NOT_FOUND)
        }
        return res.json({order})
    }else{
        if(!order){
            return res.redirect("/")
        }else{
            return res.render("orders/view.pug",{order,user:req.session.user})
        }
    }
})

orderRouter.get("/orders",async(req,res)=>{
    const {state,cursor,page_size,order} = req.query;
    const userRole = req.session.user?.role;
    const DEFAULT_LIMIT = 20;
    const filter: Record<string, any> = {
        id: order === "ASC"
                ? { $gt: parseInt(cursor as string) || 0 }
                : { $lt: parseInt(cursor as string) || 1e7 },
    };
    let orders;
    if(userRole===UserRoles.VENDOR){
        const qb: QueryBuilder<Order> = (DI.em as EntityManager).createQueryBuilder(Order,"o");
        orders = qb.select(
            ["o.id","o.orderCode","o.clientName","o.clientPhone","o.clientGov","o.clientCity","o.clientAddress","o.clientNotes"]
        )
            .leftJoin("o.items", "oi")
            .leftJoin("oi.product", "p")
            .leftJoin("p.owner", "ow")
            .where(`ow.id = ${req.session.user?.id}`)
            .andWhere(`o.id<${parseInt(cursor as string)||1e7}`)
            .orderBy({"id":"DESC"})
            .limit(parseInt(page_size as string)||DEFAULT_LIMIT)
        if(state){
            orders.andWhere(`o.order_state=${state}`)
        }
        orders = await orders.execute()
    }else if(userRole===UserRoles.CALL_CENTER){
        orders = await DI.orderRepository.find(
            {
                ...filter,
                orderState: OrderState.NOT_CONFIRMED,
            },
            {
                limit: parseInt(page_size as string) || DEFAULT_LIMIT,
                orderBy: { id: (order as "ASC"|"DESC") },
            }
        );
    }else{
        if(state){
            filter.orderState = state;
        }
        orders = await DI.orderRepository.find(
            {
                ...filter,
            },
            { limit: parseInt(page_size as string)||DEFAULT_LIMIT,orderBy:{id:"DESC"} }
        );
    }
    const last = orders[(parseInt(page_size as string)||DEFAULT_LIMIT)-1];
    const next = last?last.id:-1
    if(req.get("Accept")==="application/json"){
        return res.json({orders,next,user:req.session.user})
    }
    return res.render("orders/list.pug",{orders,next,user:req.session.user})
})

orderRouter.post("/api/order",rolesMiddleware([UserRoles.ADMIN,UserRoles.AFFILIATE]),validationMiddleware(OrderWithItemsDTO),async(req,res)=>{
    try {
        const order = DI.orderRepository.create({
            ...req.body.order,
            affiliate: req.session.user!.id,
            confirmedBy:null,
            shippedBy:null
        });
        const variantsIds:number[] = [];
        req.body.items.forEach((item:any) => {
            variantsIds.push(item.variant)
        });
        const variants = await DI.variantRepository.find({id:{$in:variantsIds}},{populate:["product"],cache:true})
        for await (const item of req.body.items) {
            const variant = variants.find((v)=>v.id===item.variant)
            if(!variant){
                throw new NotFoundError(
                    "احد الالوان و المقاسات غير موجودين يرجي التاكد من البيانات",
                    ErrorCodes.ENTITY_NOT_FOUND
                );
            }
            if(item.qty>variant.unitAmount){
                throw new BadRequestError(`${variant.getFullName()} اكبر كمية متوفرة لي اللون والمقاس هيا '${variant.unitAmount}'`)
            }
            if(variant.product.$.id!==item.product){
                throw new BadRequestError(`'${item.product}' اللون و المقاس المختارين لا يخصان هذا المنتج`)
            }
            if(variant.product.$.sellPrice*item.qty>item.cost){
                throw new BadRequestError(`لايمكنك البيع باقل من سعر بيع (${variant.product.$.getFullName()})المنتج اقل سعر للبيع`)
            }
            const orderItem = DI.orderItemRepository.create({...item,order});
            order.items.add(orderItem)
            variant.unitAmount-=item.qty;
        }
        await DI.em.persistAndFlush(order);
        return res.json({order});
    } catch (error) {
        if (error instanceof ForeignKeyConstraintViolationException) {
            throw new BadRequestError(
                "يرجي التاكد ان كل المنتجات موجودة",
                ErrorCodes.ENTITY_NOT_FOUND
            );
        }else if(error instanceof UniqueConstraintViolationException){
            throw new BadRequestError("كود الاوردر موجود مسبقا",ErrorCodes.UNIQUE_CONSTRAINT)
        }
        throw error
    }
})

orderRouter.put(
    "/api/order/:orderId",
    checkParameter(["orderId"]),
    rolesMiddleware([UserRoles.ADMIN, UserRoles.AFFILIATE]),
    validationMiddleware(OrderDTO, true),
    async (req, res) => {
        const order = DI.orderRepository.getReference(
            parseInt(req.params.orderId)
        );
        DI.orderRepository.assign(order, req.body);
        await DI.em.flush();
        return res.json({ order });
    }
);

orderRouter.put("/api/order/:orderId/confirm",checkParameter(["orderId"]),rolesMiddleware([UserRoles.ADMIN,UserRoles.CALL_CENTER]),async(req,res)=>{
    const order = await DI.orderRepository.nativeUpdate(
        {
            id: parseInt(req.params.orderId),
            orderState: OrderState.NOT_CONFIRMED,
        },
        { confirmedBy: req.session.user!.id, orderState: OrderState.CONFIRMED }
    );
    console.log(order,req.params.orderId)
    if(order===0){
        throw new BadRequestError("الاوردر غير موجود او تم الغائة او مؤكد بالفعل")
    }
    return res.json({order});
})

orderRouter.put("/api/order/:orderId/delivered",checkParameter(["orderId"]),rolesMiddleware([UserRoles.ADMIN,UserRoles.OPERATION]),async(req,res)=>{
    const order = DI.orderRepository.getReference(parseInt(req.params.orderId));
    // TODO
    // await DI.em.flush();
    return res.json({order});
})

orderRouter.delete("/api/order/:orderId",rolesMiddleware([UserRoles.ADMIN,UserRoles.OPERATION,UserRoles.CALL_CENTER]),async(req,res)=>{
    const isCallCenter = req.session.user?.role === UserRoles.CALL_CENTER;
    const order = await DI.orderRepository.findOneOrFail(
        {
            id: parseInt(req.params.orderId),
            orderState: !isCallCenter ? OrderState.NOT_CONFIRMED : {$ne:OrderState.NOT_CONFIRMED},
        },
        {
            populate: ["items"],
            failHandler(entityName, where) {
                return new NotFoundError(
                    "الاوردر غير موجود",
                    ErrorCodes.ENTITY_NOT_FOUND
                );
            },
        }
    );
    for(const item of order.items){
        DI.em.assign(DI.orderItemRepository.getReference(item.id),{isCanceled:true})
    }
    order.orderState =
        req.query.state === "refused" &&!isCallCenter
            ? OrderState.REFUSED
            : OrderState.CANCELED;
    if(req.body.deliveryNotes&&!isCallCenter){
        order.deliveryNotes = req.body.deliveryNotes
    }
    DI.em.flush()
    return res.json({order})
})

orderRouter.post("/api/order/:orderId",checkParameter(["orderId"]),rolesMiddleware([UserRoles.ADMIN, UserRoles.AFFILIATE]),validationMiddleware(OrderItemDTO),async(req,res)=>{
    try {
        const variant = await DI.variantRepository.findOneOrFail({id:req.body.variant},
            {populate:["product"],
            failHandler(entityName, where) {
                return new NotFoundError("المقاس واللون غير موجودان",ErrorCodes.ENTITY_NOT_FOUND)
            },
        })
        if(variant.unitAmount<req.body.qty){
            throw new BadRequestError(`الكمية الطلوبة اكبر من المتوفر ${variant.unitAmount}`)
        }
        if(variant.product.$.sellPrice*req.body.qty<req.body.cost){
            throw new BadRequestError("لا يمكنك البيع باقل من سعر البيع")
        }
        if(variant.product.id!==req.body.product){
            throw new BadRequestError(`'${req.body.product}' اللون و المقاس المختارين لا يخصان هذا المنتج`)            
        }
        const item = DI.orderItemRepository.create({...req.body,order:req.params.orderId});
        await DI.em.persistAndFlush(item);
        return res.json(item);
    } catch (error) {
        if(error instanceof ForeignKeyConstraintViolationException){
            throw new BadRequestError("الاوردر الذي تحاول الاضافة الية غير موجود",ErrorCodes.NOT_FOUND);
        }
        throw error
    }
})

orderRouter.delete("/api/orderItem/:itemId",checkParameter(["itemId"]),rolesMiddleware([UserRoles.ADMIN, UserRoles.AFFILIATE]),async(req,res)=>{
    const item = await DI.orderItemRepository.findOneOrFail({
        id: parseInt(req.params.itemId),
        isCanceled:false,
    },{failHandler(entityName, where) {
        return new NotFoundError("الطلب غير موجود",ErrorCodes.ENTITY_NOT_FOUND);
    },});
    const qb = (DI.em as EntityManager).createQueryBuilder(Variant);
    await qb
        .update({ unitAmount: qb.raw(`unit_amount+${item.qty}`) })
        .where({ id: item.variant.id });
    await DI.em.removeAndFlush(item)
    res.json({item})
});