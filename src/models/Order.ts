import {
    Collection,
    Entity,
    EntityName,
    EventArgs,
    EventSubscriber,
    ManyToOne,
    OneToMany,
    Property,
    Ref,
    ref,
    wrap,
} from "@mikro-orm/core";
import BaseEntity from "./BaseEntity";
import { User } from "./User";
import { customAlphabet } from "nanoid";
import { Product, Variant } from "./Product";
import { EntityManager } from "@mikro-orm/sqlite";

const nanoid = customAlphabet("0123456789");

@Entity()
export class Order extends BaseEntity {
    @Property({ unique: true, index: true })
    orderCode: string = nanoid(7);

    @Property()
    clientName: string;

    @Property()
    clientPhone: string;

    @Property()
    clientGov: Gov;

    @Property()
    clientCity: City;

    @Property()
    clientAddress: string;

    @Property({ nullable: true })
    clientNotes?: string;

    @Property()
    shippingCost?:number=0

    @Property({ nullable: true })
    deliveryNotes?: string;

    @Property()
    orderState?: OrderState = OrderState.NOT_CONFIRMED;

    @ManyToOne(() => User, { onDelete: "cascade", ref: true })
    affiliate: Ref<User>;

    @ManyToOne(() => User, { onDelete: "set null", ref: true, nullable: true })
    confirmedBy?: Ref<User>;

    @ManyToOne(() => ShippingCompany, {
        onDelete: "set null",
        ref: true,
        nullable: true,
    })
    shippedBy?: Ref<ShippingCompany>;

    @OneToMany(() => OrderItem, "order")
    items = new Collection<OrderItem>(this);

    constructor(
        clientName: string,
        clientGov: Gov,
        clientCity: City,
        clientPhone: string,
        clientAddress: string,
        affiliate: User
    ) {
        super();
        this.clientName = clientName;
        this.clientGov = clientGov;
        this.clientPhone = clientPhone;
        this.clientAddress = clientAddress;
        this.clientCity = clientCity;
        this.affiliate = ref(affiliate);
    }
}

@Entity()
export class OrderItem extends BaseEntity {
    @ManyToOne(() => Order, { onDelete: "cascade", ref: true })
    order: Ref<Order>;

    @ManyToOne(() => Product, { onDelete: "no action", ref: true })
    product: Ref<Product>;

    @ManyToOne(() => Variant, { onDelete: "no action", ref: true })
    variant: Ref<Variant>;

    @Property()
    qty: number;

    @Property()
    cost: number;

    @Property()
    isCanceled?:boolean=false

    constructor(
        qty: number,
        cost: number,
        order: Order,
        product: Product,
        variant: Variant
    ) {
        super();
        this.qty = qty;
        this.cost = cost;
        this.variant = ref(variant);
        this.order = ref(order);
        this.product = ref(product);
    }
}

@Entity()
export class ShippingCompany extends BaseEntity {
    @Property()
    name: string;

    @OneToMany(() => Order, "shippedBy")
    orders = new Collection<Order>(this);
}

export class OrderItemSubscriber implements EventSubscriber<OrderItem> {
    getSubscribedEntities(): EntityName<OrderItem>[] {
        return [OrderItem];
    }
    async afterUpdate(args: EventArgs<OrderItem>): Promise<void> {        
        if (args.changeSet?.payload.isCanceled&&!args.changeSet.originalEntity?.isCanceled) {
            const qb = (args.em as EntityManager).createQueryBuilder(Variant);
            const item = await wrap(args.entity).init();
            if (!item.variant) {
                return;
            }
            await qb
                .update({ unitAmount: qb.raw(`unit_amount+${item.qty}`) })
                .where({ id: item.variant.id });
        }
    }
}

export enum Gov {
    GIZA = "الجيزة",
    CAIRO = "القاهرة",
    ALEXANDRIA = "الاسكندرية",
    FAIYUM = "الفيوم",
    ASWAN = "اسوان",
    LUXOR = "الاقصر",
    SOHAG = "سوهاج",
    ASYUT = "اسيوط",
    BEHEIRA = "البحيرة",
    GHARBIA = "الغربية",
    BENI_SUEF = "بني سويف",
    ISMAILIA = "الاسماعيلية",
    KAFR_EL_SHEIKH = "كفر الشيخ",
    MATRUH = "مطروح",
    MINYA = "المنيا",
    MONUFIA = "المنوفية",
    NEW_VALLEY = "الوادي الجديد",
    NORTH_SINAI = "شمال سيناء",
    SOUTH_SINAI = "جنوب سيناء",
    PORT_SAID = "بورسعيد",
    QALYUBIA = "القليوبية",
    QENA = "قنا",
    RED_SEA = "البحر الاحمر",
    SUEZ = "السويس",
    DAKAHLIA = "الدقهلية",
    SHARQIA = "الشرقية",
    DAMIETTA = "دمياط",
}

export enum City {
    BADRASHIN = "البدرشين",
}

export enum OrderState {
    NOT_CONFIRMED = "غير مؤكد",
    CONFIRMED = "مؤكد",
    READY = "جاهز",
    WAITING = "انتظار",
    IN_DELIVERY = "في التوصيل",
    CANCELED = "تم الغاءة",
    REFUSED = "رفض الاستلام",
    DELIVERED = "تم الاستلام",
}
