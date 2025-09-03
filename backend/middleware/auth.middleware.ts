import jwt,{type JwtPayload} from "jsonwebtoken";
import {User} from "../models/User";
import { type Request, type Response, type NextFunction } from "express";
import {JWT_SECRET} from "../config";

interface CustomJwtPayload extends JwtPayload{
    userId:string;
}
export const protectedRoute = async(req:Request,res:Response,next:NextFunction) => {
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({message:"Unauthorized - No token Provided"});
        }
        const decodedData = jwt.verify(token,JWT_SECRET!) as CustomJwtPayload;
        if(!decodedData){
            return res.status(401).json({message:"Unauthorized - Invalid Token"});
        }

        const user = await User.findById(decodedData.userId).select("-password");
        if(!user){
            return res.status(401).json({message:"Unauthorized - User not found"});
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protectedRoute middleware",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}