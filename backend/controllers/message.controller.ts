import { type Request, type Response } from "express";
import { User } from "../models/User";
import { Message } from "../models/Message";
import cloudinary from "../lib/cloudinary";
import { getReceiverSocketId, io } from "../lib/socket";

export const getUsersForSidebar = async (req:Request,res:Response)=>{
    try {
        const loggedInUser = req.user?._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUser } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar controller",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export const getMessages = async (req:Request,res:Response)=>{
    try {
        const receiverId = req.params.id;
        const senderId = req.user?._id;
        const messages = await Message.find({
            $or:[
                {senderId:senderId,receiverId:receiverId},
                {senderId:receiverId,receiverId:senderId}
            ]
        })
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages controller",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export const sendMessage = async (req:Request,res:Response)=>{
    try {
        const receiverId = req.params.id;
        const {text,image} = req.body;
        const senderId = req.user?._id;
        let imageUrl = "";
        if(image){
            //upload base64 image to cloudinary
            const uploadedResponse = await cloudinary.uploader.upload(image,{folder:"chat-app"});
            imageUrl = uploadedResponse.secure_url;
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        });

        //real-time functionality

        const receiverSocketId = getReceiverSocketId(receiverId as string);
        const senderSocketId = getReceiverSocketId(senderId as string);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", newMessage);
        }

        res.status(200).json(newMessage);

    } catch (error) {
        console.error("Error in sendMessage controller",error);
        res.status(500).json({message:"Internal Server Error"});
    }
}
