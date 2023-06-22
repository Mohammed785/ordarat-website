import { Collection, Entity, ManyToOne, OneToMany, Property, Ref, ref } from "@mikro-orm/core";
import BaseEntity from "./BaseEntity";
import { User } from "./User";
import { OrderItem } from "./Order";

@Entity()
export class Product extends BaseEntity {
    @Property()
    name: string;

    @Property({ unique: true, index: true })
    code: string;

    @Property({nullable:true})
    description?: string;

    @Property()
    sellPrice: number;

    @Property()
    buyPrice: number;

    @Property()
    affiliatePrice: number;

    @OneToMany(() => Variant, "product")
    variants = new Collection<Variant>(this);

    @ManyToOne(()=>User,{onDelete:"cascade",ref:true})
    owner:Ref<User>

    @OneToMany(()=>OrderItem,"product")
    orders = new Collection<OrderItem>(this)

    @Property({name:"fullName"})
    getFullName(){
        return `${this.name} ${this.code}`
    }

    constructor(name: string,code:string, sellPrice: number,buyPrice: number,affiliatePrice: number,owner:User) {
        super();
        this.name = name;
        this.code = code;
        this.sellPrice = sellPrice;
        this.buyPrice = buyPrice;
        this.affiliatePrice = affiliatePrice;
        this.owner = ref(owner);
    }
}

@Entity()
export class Variant extends BaseEntity {
    
    @Property()
    color:string

    @Property()
    size:string

    @Property()
    unitAmount:number

    @ManyToOne(() => Product, { onDelete: "cascade",ref:true })
    product: Ref<Product>;

    @OneToMany(()=>OrderItem,"variant")
    orders = new Collection<OrderItem>(this)

    @Property({name:"fullName"})
    getFullName(){
        return `${this.color} ${this.size}`
    }
    
    constructor(color:string,size:string,unitAmount:number,product:Product){
        super();
        this.color = color;
        this.size = size;
        this.unitAmount =unitAmount;
        this.product = ref(product)
    }
}
