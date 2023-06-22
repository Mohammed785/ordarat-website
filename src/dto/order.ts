import {
    IsArray,
    IsEnum,
    IsInt,
    IsNumber,
    IsObject,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
    ValidateNested,
} from "class-validator";
import { City, Gov } from "../models/Order";
import { Type } from "class-transformer";

export class OrderItemDTO {
    @IsInt({ message: "يجب توفير معرف منتج صحيح" })
    product: number;

    @IsInt({ message: "يجب توفير معرف منتج صحيح" })
    variant: number;

    @IsInt({ message: "الكمية يجب ان تكون رقم صحيح" })
    qty: number;

    @IsNumber({}, { message: "التكلفة يجب ان تكون رقم" })
    cost: number;
}

export class OrderDTO {
    @Length(2, 50, {
        message: "يجب ان توفير اسم العميل وان يكون  طولة مابين 2 لي 50 حرف",
    })
    clientName: string;

    @IsEnum(Gov, { message: "يجب توفير اسم محافظة صحيح" })
    clientGov: Gov;

    @IsEnum(City, { message: "يجب توفير اسم مدينة صحيح" })
    clientCity: City;

    @IsString({ message: "يجب توفير عنوان العميل" })
    clientAddress: string;

    @IsPhoneNumber("EG")
    clientPhone: string;

    @IsOptional()
    @IsString()
    clientNotes: string;

}

export class OrderWithItemsDTO {
    @IsObject()
    @ValidateNested()
    @Type(() => OrderDTO)
    order: OrderDTO;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDTO)
    items: OrderItemDTO[];
}