import express,{type Request,type Response} from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth.route";
import messageRoutes from "./routes/message.route";
import { PORT } from "./config";
import {connectDB} from "./lib/db";
import cookieParser from "cookie-parser";
import { app,server } from "./lib/socket";
dotenv.config();

const __dirname = path.resolve();

// const app = express();

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",authRoutes);
app.use("/api/messages",messageRoutes);

//serve frontend
if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"../frontend/dist")));
    app.get(/.*/,(req:Request,res:Response)=>{
	    res.sendFile(path.join(__dirname,"../frontend","dist","index.html"));
    });
}

server.listen(PORT, () => {
    console.log("Server started on port 8080");
    connectDB();
});


