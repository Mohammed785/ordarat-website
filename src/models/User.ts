import { Entity, Property } from "@mikro-orm/core";
import BaseEntity from "./BaseEntity";

@Entity()
class User extends BaseEntity{
    @Property()
    firstName:string

    @Property()
    lastName:string

    @Property()
    phone:string
    
    @Property()
    email:string

    @Property()
    password:string

    @Property()
    role:UserRoles

    constructor(firstName:string,lastName:string,phone:string,email:string,password:string){
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.email = email;
        this.password = password;
    }
}

enum UserRoles {
    ADMIN = "ADMIN",
    VENDOR = "VENDOR",
    AFFILIATE = "AFFILIATE",
    CALL_CENTER = "CALL_CENTER",
    OPERATION = "OPERATION",
}

export default User;