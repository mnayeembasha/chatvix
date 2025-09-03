import bcrypt from "bcryptjs";
import mongoose,{Document} from "mongoose";

export interface UserDocument extends Document {
    _id:string;
    fullName: string;
    email: string;
    password: string;
    profilePic: string;
    createdAt: Date;
    updatedAt: Date;
  }
  export type SafeUser = Omit<UserDocument, "password">;

const userSchema = new mongoose.Schema<UserDocument>({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    profilePic:{
        type:String,
        default:""
    },
  },{
    timestamps:true
  });

   //pre hook to hash the password

   userSchema.pre("save",async function(next){
    if(!this.isModified("password")){ //If password isn't modified(User may be updating some other fields) then dont generate the hash
        return next();
    }
    try{
        this.password = await bcrypt.hash(this.password,10);
        next();
    }catch(error:any){
        next(error);
    }
  });

  export const User = mongoose.model<UserDocument>("User", userSchema);

