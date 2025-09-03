import {User} from "../models/User";
import {type Request,type Response } from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils";
import cloudinary from "../lib/cloudinary";

export const signup = async(req:Request,res:Response)=>{
    const {fullName,email,password} = req.body;

    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }
        if(password.length < 6){
            return res.status(400).json({message:"Password must be atleast 6 characters"});
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({message:"Invalid email"});
        }
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"Email already exists"});
        }

        const idx = Math.floor(Math.random()*100)+1;
        const randomAvatarUrl = `https://avatar.iran.liara.run/public/${idx}.png`;

        const newUser = await User.create({
            fullName,
            email,
            password,
            profilePic:randomAvatarUrl
        });

        if(newUser){
            generateToken(newUser._id,res);
            res.status(201).json({
                _id:newUser._id,
                fullName,
                email,
                profilePic:randomAvatarUrl
            });
        } else{
            res.status(400).json({
                message:"Invalid user data"
            })
        }



    }catch(error){
        console.log("Error in signup controller",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}
export const login = async(req:Request,res:Response)=>{
    const {email,password} = req.body;

    try{
        if( !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid Email"});
        }

        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid Password"});
        }

        generateToken(user._id,res);
        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic
        });

    }catch(error){
        console.log("Error in login controller",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}
export const logout = (req:Request,res:Response)=>{
    res.clearCookie("jwt");
    res.status(200).json({success:true,message:"Logout successfull"});
}

export const updateProfile = async (req:Request,res:Response)=>{
    try {
        const {profilePic} = req.body;
        const userId = req.user?._id;

        if(!profilePic){
            res.status(400).json({message:"Profile Pic is required"});
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic,{folder:"chat-app"});
        const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true});
        if(updatedUser){
            res.status(200).json({
                _id:updatedUser._id,
                fullName:updatedUser.fullName,
                email:updatedUser.email,
                profilePic:updatedUser.profilePic
            });
        }

    } catch (error) {
        console.error("Error in updateProfile controller",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export const checkAuth = (req:Request,res:Response)=>{
    try {
        res.status(200).json(req.user);
    } catch (error:any) {
        console.error("Error in checkAuth controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}

