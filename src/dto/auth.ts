import { IsEmail, IsIn, IsPhoneNumber, Length } from "class-validator"

export class LoginDTO{
    @IsPhoneNumber("EG",{message:"يرجي ادخال رقم هاتف صحيح"})
    phone:string
    @Length(8,30,{message:"يجت ان تكون كلمة المرور مابين 8 الي 30 حرف"})
    password:string
}

export class RegisterDTO {
    @Length(2, 25,{message:"يرجي ادخال ادخال اسم اول طولة من 2 الي 25 حرف"})
    firstName: string;
    @Length(2, 25,{message:"يرجي ادخال ادخال اسم اول طولة من 2 الي 25 حرف"})
    lastName: string;
    @IsEmail({},{message:"يرجي ادخال بريد الكتروني صحيح"})
    email:string
    @IsPhoneNumber("EG", { message: "يرجي ادخال رقم هاتف صحيح" })
    phone: string;
    @Length(8, 30, { message: "يجت ان تكون كلمة المرور مابين 8 الي 30 حرف" })
    password: string;
    @IsIn(["VENDOR","AFFILIATE"],{message:"يجب ان يكون نوع المستخدم اما مورد او مسوق"})
    role:string
}

export class ChangePasswordDTO {
    @Length(8, 30, { message: "يجت ان تكون كلمة المرور القديمة مابين 8 الي 30 حرف" })
    oldPassword: string;
    @Length(8, 30, { message: "يجت ان تكون كلمة المرور الجديدة مابين 8 الي 30 حرف" })
    newPassword: string;
    @Length(8, 30, { message: "يجت ان تكون كلمة المرور مابين 8 الي 30 حرف" })
    confirmPassword: string;
}