import { Entity, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({abstract:true})
class BaseEntity{
    [OptionalProps]?:"createdAt"|"updatedAt"
    
    @PrimaryKey()
    id!:number

    @Property()
    createdAt:Date = new Date()

    @Property({onUpdate:()=>new Date()})
    updatedAt:Date = new Date()
}

export default BaseEntity