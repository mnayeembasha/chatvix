import mongoose from "mongoose";
interface MessageDocument extends mongoose.Document {
    senderId: mongoose.Schema.Types.ObjectId;
    receiverId: mongoose.Schema.Types.ObjectId;
    text: string;
    image: string;
}

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    receiverId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    text: {
        type: String,
        trim: true,
    },
    image:{
        type:String,
        default:""
    },
}, {
    timestamps: true,
});

export const Message = mongoose.model("Message", messageSchema);