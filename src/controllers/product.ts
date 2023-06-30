import { Router } from "express";
import { DI } from "../server";
import { BadRequestError, ErrorCodes, ForbiddenError, NotFoundError, StatusCodes } from "../utils/errors";
import { UserRoles } from "../models/User";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { ProductDTO, ProductWithVariantsDTO, VariantDTO } from "../dto/product";
import { UniqueConstraintViolationException } from "@mikro-orm/core";

export const productRouter = Router();  

productRouter.get(
    "/products",
    async (req, res) => {
        const products = await DI.productRepository.findAll();
        if (req.get("Accept") === "application/json") {
            return res.json({ products });
        } else {
            return res.render("product/list", { products });
        }
    }
);

productRouter.get(
    "/product/:code",
    async (req, res) => {
        const product = await DI.productRepository.findOne({ code:req.params.code },{populate:["variants"]});
        if (req.get("Accept") === "application/json") {
            return res.json({ product });
        } else {
            return res.render("product/view", { product });
        }
    }
);

productRouter.get("/api/product/:productId/variants",async(req,res)=>{
    const variants = await DI.variantRepository.find({product:parseInt(req.params.productId)});
    return res.json({variants})
})

productRouter.get("/api/product/me", async (req, res) => {
    const products = await DI.productRepository.find({
        owner: req.session.user!.id,
    });
    if (req.get("Accept") === "application/json") {
        return res.json({ products });
    } else {
        return res.render("product/list", { products });
    }
});

productRouter.post(
    "/api/product/",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    validationMiddleware(ProductWithVariantsDTO),
    async (req, res) => {
        try {
            const product = DI.productRepository.create({...req.body,owner:req.session.user!.id});
            await DI.em.persistAndFlush(product);
            return res.status(StatusCodes.CREATED).json({ product });
        } catch (error) {
            if(error instanceof UniqueConstraintViolationException){
                throw new BadRequestError("الكود مسجل يرجي ادخال كود اخر",ErrorCodes.UNIQUE_CONSTRAINT)
            }
            throw error
        }
    }
);

productRouter.post(
    "/api/product/:productId",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    validationMiddleware(VariantDTO),
    async (req, res) => {
        const variant = DI.variantRepository.create({
            ...req.body,
            product: parseInt(req.params.productId),
        });
        await DI.em.persistAndFlush(variant);
        return res.status(StatusCodes.CREATED).json({ variant });
    }
);

productRouter.put(
    "/api/product/:productId",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    validationMiddleware(ProductDTO, true),
    async (req, res) => {
        const query = { id: parseInt(req.params.productId) } as {id:number,owner:number};
        if(req.session.user?.role===UserRoles.VENDOR){
            query.owner = req.session.user.id;
        }
        const product = await DI.productRepository.nativeUpdate({
            ...query
        },{...req.body});
        if(product===0){
            throw new BadRequestError(
                "لا يمكنك تعديل المنتج لانة اما غير موجود او ليس ملكك"
            );
        }
        return res.status(StatusCodes.ACCEPTED).json({ product });
    }
);

productRouter.put(
    "/api/variant/:variantId",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    validationMiddleware(VariantDTO, true),
    async (req, res) => {
        const variant = await DI.variantRepository.findOneOrFail({
            id: parseInt(req.params.variantId),
        },{failHandler(entityName, where) {
            return new NotFoundError("المنتج غير موجود",ErrorCodes.ENTITY_NOT_FOUND)
        }});
        if( req.session.user?.role===UserRoles.VENDOR&&(await variant.product.load()).owner.id!==req.session.user!.id){
            throw new ForbiddenError("انت لا تمتلك هذا المنتج لا يمكنك تعدلية")
        }
        DI.variantRepository.assign(variant, req.body);
        await DI.em.flush();
        return res.status(StatusCodes.ACCEPTED).json({ variant });
    }
);

productRouter.delete(
    "/api/product/:productId",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    async (req, res) => {
        const id =  parseInt(req.params.productId);
        const query = { id } as {
            id: number;
            owner: number;
        };
        if (req.session.user?.role === UserRoles.VENDOR) {
            query.owner = req.session.user.id;
        }
        const ordered = await DI.orderItemRepository.findOne({product:id});
        let deleted = 0;
        if(!ordered){
            deleted = await DI.productRepository.nativeDelete({
                ...query
            });
        }else{
            deleted = await DI.productRepository.nativeUpdate({...query},{isDeleted:true})
            if(deleted){
                await DI.variantRepository.nativeUpdate({product:id},{isDeleted:true})
            }
        }
        if (deleted === 0) {
            throw new BadRequestError(
                "لا يمكنك حذف المنتج لانة اما غير موجود او ليس ملكك"
            );
        }
        return res
        .json({ deleted });
    }
);

productRouter.delete(
    "/api/variant/:variantId",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    async (req, res) => {
        const id = parseInt(req.params.variantId)
        const query = { id } as {
            id: number;
            owner: number;
        };
        if (req.session.user?.role === UserRoles.VENDOR) {
            query.owner = req.session.user.id;
        }
        const ordered = await DI.orderItemRepository.findOne({variant:id})
        let deleted = 0;
        if(!ordered){
            deleted = await DI.variantRepository.nativeDelete({
                ...query
            });
        }else{
            deleted = await DI.variantRepository.nativeUpdate({...query},{isDeleted:true})
        }
        if (deleted === 0) {
            throw new BadRequestError(
                "لا يمكنك حذف المنتج لانة اما غير موجود او ليس ملكك"
            );
        }
        return res
            .json({ deleted });
    }
);
