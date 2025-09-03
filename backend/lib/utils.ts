import jwt from "jsonwebtoken";
import {type Response } from "express";
import { JWT_SECRET, NODE_ENV } from "../config";
export const generateToken = (userId:string,res:Response)=>{
    const token = jwt.sign({
        userId:userId, //payload
    },JWT_SECRET!,{
        expiresIn:"7d"
    });

    res.cookie("jwt",token,{
        maxAge:7*24*60*60*1000,
        httpOnly:true, //Prevent XSS Attacks
        sameSite:"strict",
        secure:NODE_ENV !== "development"
    });

    return token;
}