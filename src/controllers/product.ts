import { Router } from "express";
import { DI } from "../server";
import { BadRequestError, ErrorCodes, StatusCodes } from "../utils/errors";
import { isInt } from "class-validator";
import { UserRoles } from "../models/User";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { ProductDTO, ProductWithVariantsDTO, VariantDTO } from "../dto/product";
import { UniqueConstraintViolationException } from "@mikro-orm/core";

export const productRouter = Router();  

productRouter.get(
    "/products",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    async (req, res) => {
        const productsFilter = req.query.products;
        const isAdmin = req.session.user?.role === UserRoles.ADMIN;
        let products;
        if (req.session.user?.role === UserRoles.VENDOR) {
            products = await DI.productRepository.find({
                owner: req.session.user!.id,
            });
        } else if (isInt(productsFilter) && isAdmin) {
            products = await DI.productRepository.find(
                { owner: parseInt(productsFilter as string) },
                {
                    populate: req.query.owner
                        ? ["owner.firstName", "owner.phone"]
                        : [],
                }
            );
        } else {
            products = await DI.productRepository.find({
                owner: parseInt(productsFilter as string),
            });
        }
        return res.render("product/list", { products });
    }
);

productRouter.get(
    "/product/:code",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    async (req, res) => {
        const isAdmin = req.session.user?.role === UserRoles.ADMIN;
        const query = {code:req.params.code} as {code:string,owner:number}
        if(!isAdmin){
            query.owner = req.session.user!.id;
        }
        const product = await DI.productRepository.findOne(
            { ...query },
            {
                populate:
                    req.query.owner && isAdmin
                        ? ["owner.phone", "owner.firstName"]
                        : [],
            }
        );
        return res.render("product/view", { product });
    }
);

productRouter.get("/api/product/me", async (req, res) => {
    const products = await DI.productRepository.find({
        owner: req.session.user!.id,
    });
    return res.json({ products });
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
        const product = DI.productRepository.getReference(
            parseInt(req.params.productId)
        );
        DI.productRepository.assign(product, req.body);
        await DI.em.flush();
        return res.status(StatusCodes.ACCEPTED).json({ product });
    }
);

productRouter.put(
    "/api/product/:variantId",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    validationMiddleware(VariantDTO, true),
    async (req, res) => {
        const variant = DI.variantRepository.getReference(
            parseInt(req.params.variantId)
        );
        DI.variantRepository.assign(variant, req.body);
        await DI.em.flush();
        return res.status(StatusCodes.ACCEPTED).json({ variant });
    }
);

productRouter.delete(
    "/api/product/:productId",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    async (req, res) => {
        const deleted = await DI.productRepository.nativeDelete({
            id: parseInt(req.params.productId),
        });
        return res
            .status(deleted === 0 ? StatusCodes.NOT_FOUND : StatusCodes.OK)
            .json({ deleted });
    }
);

productRouter.delete(
    "/api/product/:variantId",
    rolesMiddleware([UserRoles.ADMIN, UserRoles.VENDOR]),
    async (req, res) => {
        const deleted = await DI.variantRepository.nativeDelete({
            id: parseInt(req.params.variantId),
        });
        return res
            .status(deleted === 0 ? StatusCodes.NOT_FOUND : StatusCodes.OK)
            .json({ deleted });
    }
);
