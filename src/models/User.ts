import { Collection, Entity, ManyToOne, OneToMany, Property, Ref, Unique, ref } from "@mikro-orm/core";
import BaseEntity from "./BaseEntity";
import { Product } from "./Product";
import { Order } from "./Order";

@Entity()
export class User extends BaseEntity{
    @Property()
    firstName:string

    @Property()
    lastName:string

    @Property({index:true,unique:true})
    phone:string
    
    @Property({unique:true,nullable:true})
    email?:string

    @Property({hidden:true})
    password:string

    @Property()
    role:UserRoles

    @Property({default:false})
    isActive?:boolean=false
    
    @Property({default:false})
    isDeleted?:boolean=false

    @OneToMany(()=>Product,"owner")
    products = new Collection<Product>(this);

    @OneToMany(()=>Order,"affiliate")
    ordersCreated = new Collection<Order>(this)

    @OneToMany(()=>Order,"confirmedBy")
    ordersConfirmed = new Collection<Order>(this)

    constructor(firstName:string,lastName:string,phone:string,email:string,password:string){
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.email = email;
        this.password = password;
    }
}
@Entity()
@Unique({properties:["user","order"]})
export class FinancialRecord extends BaseEntity {
    @ManyToOne(() => User, { onDelete: "cascade", ref: true })
    user: Ref<User>;
    @ManyToOne(() => Order, { onDelete: "cascade", ref: true})
    order: Ref<Order>;
    @Property()
    recordType:RecordTypes
    @Property()
    amount:number

    @Property({persist:false})
    confirmedBalance?:number
    @Property({persist:false})
    unconfirmedBalance?:number
    @Property({persist:false})
    ordersCount?:number;

    constructor(amount:number,recordType:RecordTypes,user:User,order:Order){
        super()
        this.amount = amount
        this.recordType = recordType
        this.user = ref(user)
        this.order = ref(order)
    }
}
@Entity()
export class WithdrawRequest extends BaseEntity {
    @ManyToOne(() => User, { onDelete: "cascade", ref: true })
    user: Ref<User>;

    @Property({default:false})
    accepted?:boolean=false

    @Property()
    amount:number
    constructor(amount:number,user:User){
        super()
        this.user = ref(user)
        this.amount = amount
    }
}

export enum RecordTypes{
    CONFIRMED = "مؤكد",
    UNCONFIRMED = "تحت التاكيد",
}

export enum UserRoles {
    ADMIN = "ADMIN",
    VENDOR = "VENDOR",
    AFFILIATE = "AFFILIATE",
    CALL_CENTER = "CALL_CENTER",
    OPERATION = "OPERATION",
};