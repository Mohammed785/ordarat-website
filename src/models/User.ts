import { Collection, Entity, OneToMany, Property } from "@mikro-orm/core";
import BaseEntity from "./BaseEntity";
import { Product } from "./Product";
import { Order } from "./Order";

@Entity()
export class User extends BaseEntity{
    @Property()
    firstName:string

    @Property()
    lastName:string

    @Property()
    phone:string
    
    @Property()
    email:string

    @Property({hidden:true})
    password:string

    @Property()
    role:UserRoles

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

export enum UserRoles {
    ADMIN = "ADMIN",
    VENDOR = "VENDOR",
    AFFILIATE = "AFFILIATE",
    CALL_CENTER = "CALL_CENTER",
    OPERATION = "OPERATION",
};