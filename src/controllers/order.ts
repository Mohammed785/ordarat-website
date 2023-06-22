import { Router } from "express";
import { DI } from "../server";
import { OrderState } from "../models/Order";
import { BadRequestError, ErrorCodes, NotFoundError } from "../utils/errors";
import { ForeignKeyConstraintViolationException, UniqueConstraintViolationException } from "@mikro-orm/core";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { OrderDTO, OrderItemDTO, OrderWithItemsDTO, TestDTO } from "../dto/order";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { UserRoles } from "../models/User";

export const orderRouter = Router()



orderRouter.get("/orders",async(req,res)=>{
    // add pagination and filter by order state
    const orders = await DI.orderRepository.find({});
    return res.json({orders})
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
    rolesMiddleware([UserRoles.ADMIN, UserRoles.AFFILIATE]),
    validationMiddleware(OrderDTO,true),
    async (req, res) => {
        const order = DI.orderRepository.getReference(
            parseInt(req.params.orderId)
        );
        DI.orderRepository.assign(order, req.body);
        await DI.em.flush();
        return res.json({ order });
    }
);

orderRouter.put("/api/order/:orderId/confirm",rolesMiddleware([UserRoles.ADMIN,UserRoles.CALL_CENTER]),async(req,res)=>{
    const order = DI.orderRepository.getReference(parseInt(req.params.orderId));
    DI.orderRepository.assign(order,{confirmedBy:req.session.user!.id,orderState:OrderState.CONFIRMED});
    await DI.em.flush();
    return res.json({order});
})

// need more info like is the operation is the only one who can change state after confirmed
// orderRouter.put("/api/order/:orderId/state",rolesMiddleware([UserRoles.ADMIN,UserRoles.OPERATION]),async(req,res)=>{
//     const order = DI.orderRepository.getReference(parseInt(req.params.orderId));
//     DI.orderRepository.assign(order,{orderState:OrderState.READY});
//     await DI.em.flush();
//     return res.json({order});
// })

orderRouter.delete("/api/order/:orderId",rolesMiddleware([UserRoles.ADMIN]),async(req,res)=>{
    const order = await DI.orderRepository.findOneOrFail({
        id:parseInt(req.params.orderId)
    },{
        populate:["items"],
        failHandler(entityName, where) {
        return new NotFoundError(
            "الاوردر غير موجود",
            ErrorCodes.ENTITY_NOT_FOUND
        );
    }});
    for(const item of order.items){
        DI.em.remove(item)
    }
    DI.em.removeAndFlush(order)
    return res.json({order})
})

orderRouter.post("/api/order/:orderId",rolesMiddleware([UserRoles.ADMIN, UserRoles.AFFILIATE]),validationMiddleware(OrderItemDTO),async(req,res)=>{
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

orderRouter.delete("/api/orderItem/:itemId",rolesMiddleware([UserRoles.ADMIN, UserRoles.AFFILIATE]),async(req,res)=>{
    const item = DI.orderItemRepository.getReference(parseInt(req.params.itemId));
    await DI.em.removeAndFlush(item);
    if(!item.variant){
        throw new NotFoundError("الطلب غير موجود",ErrorCodes.ENTITY_NOT_FOUND);
    }
    res.json({item})
});