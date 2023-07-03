import { Router } from "express";
import rolesMiddleware from "../middlewares/rolesMiddleware";
import { UserRoles } from "../models/User";
import { DI } from "../server";

export const shippingRouter = Router();

shippingRouter.get(
    "/companies",
    rolesMiddleware([
        UserRoles.ADMIN,
        UserRoles.OPERATION,
        UserRoles.CALL_CENTER,
    ]),
    async (req, res) => {
        const companies = await DI.shippingRepository.find(
            { isDeleted: false },
            { cache: true, fields: ["id", "name", "isDeleted"] }
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
    async (req, res) => {
        const company = DI.shippingRepository.create({ name: req.body.name });
        await DI.em.persistAndFlush(company);
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
