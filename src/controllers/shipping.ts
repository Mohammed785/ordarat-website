import { Router } from "express";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { UserRoles } from "../models/User";
import { DI } from "../server";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { ShippingCompanyDTO } from "../dto/order";
import { ErrorCodes, NotFoundError } from "../utils/errors";

export const shippingRouter = Router();

shippingRouter.get(
    "/companies",
    rolesMiddleware([
        UserRoles.ADMIN
    ]),
    async (req, res) => {
        const companies = await DI.shippingRepository.find(
            { isDeleted: false },
            { cache: true, fields: ["id", "name","shippingCost"] }
        );
        if (req.get("Accept") === "application/json") {
            return res.json({ companies });
        }
        return res.render("shipping/list", {
            companies,
            user: req.session.user,
        });
    }
);

shippingRouter.post(
    "/api/company",
    rolesMiddleware([UserRoles.ADMIN]),
    validationMiddleware(ShippingCompanyDTO),
    async (req, res) => {
        const company = DI.shippingRepository.create(req.body);
        await DI.em.persistAndFlush(company);
        return res.json({ company });
    }
);

shippingRouter.put(
    "/api/company/:id",
    rolesMiddleware([UserRoles.ADMIN]),
    validationMiddleware(ShippingCompanyDTO,true),
    async (req, res) => {
        const company = await DI.shippingRepository.nativeUpdate({id:parseInt(req.params.id)},req.body)
        if(company===0){
            throw new NotFoundError("الشركة غير موجودة",ErrorCodes.ENTITY_NOT_FOUND)
        }
        return res.json({ company });
    }
);

shippingRouter.delete(
    "/api/company/:id",
    rolesMiddleware([UserRoles.ADMIN]),
    async (req, res) => {
        const inOrder = await DI.orderRepository.findOne({
            shippedBy: parseInt(req.params.id),
        });
        let company;
        if (!inOrder) {
            company = await DI.shippingRepository.nativeDelete({
                id: parseInt(req.params.id),
            });
        } else {
            company = await DI.shippingRepository.nativeUpdate(
                {
                    id: parseInt(req.params.id),
                },
                { isDeleted: true }
            );
        }
        return res.json({ company });
    }
);
