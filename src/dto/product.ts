import { Type } from "class-transformer";
import { IsArray, IsInt, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

export class VariantDTO{

    @IsString({message:"يرجي ادخال لون"})
    color:string

    @IsString({message:"يرجي ادخال مقاس صحيح"})
    size:string

    @IsInt({message:"يرجي ادخال كمية صحيح"})
    unitAmount:number
}

export class ProductDTO {

    @IsString({message:"يرجي ادخال اسم المنتج"})
    name: string;

    @IsString({message:"يرجي ادخال كود المنتج"})
    @MinLength(3,{message:"يجب ان يكون كود المنتج علي الاقل 3 حروف"})
    code: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsNumber({},{message:"يرجي ادخال سعر بيع"})
    sellPrice: number;

    @IsNumber({},{message:"يرجي ادخال سعر شراء"})
    buyPrice: number;

    @IsNumber({},{message:"يرجي ادخال عمولة المسوق"})
    affiliatePrice: number;

}

export class ProductWithVariantsDTO extends ProductDTO{
    @IsArray({message:"يجب توفير الالوان والمقاسات والكميات المتوفر"})
    @ValidateNested({each:true})
    @Type(() => VariantDTO)
    variants: VariantDTO[];
}