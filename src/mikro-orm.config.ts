import { LoadStrategy, Options } from "@mikro-orm/core";
import { FinancialRecord, User, WithdrawRequest } from "./models/User";
import { Product, Variant } from "./models/Product";
import { Order, OrderItem, OrderItemSubscriber, ShippingCompany } from "./models/Order";
import { Migrator } from "@mikro-orm/migrations";

const options: Options = {
    entities: [User, Product, Variant, Order, OrderItem, ShippingCompany,FinancialRecord,WithdrawRequest],
    subscribers:[new OrderItemSubscriber()],
    dbName: "data.db",
    type: "sqlite",
    debug: true,
    loadStrategy: LoadStrategy.JOINED,
    extensions:[Migrator]
};


export default options;
