import {create} from "zustand";
import type { UserType } from "../types";
import { axiosInstance } from "../lib/axios";
import type { LoginDataType, SignUpDataType } from "../pages/SignUp";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import {io,Socket} from "socket.io-client";

const BASE_URL = import.meta.env.MODE ==="development" ? "http://localhost:8080" : "/";



interface AuthStore{
    authUser: UserType | null,
    isSigningUp: boolean,
    isLoggingIn: boolean,
    isUpdatingProfile: boolean,
    isLoggingOut: boolean,
    isCheckingAuth: boolean,
    checkAuth: () => Promise<void>,
    signup:(data:SignUpDataType) => Promise<void>,
    login:(data:LoginDataType) => Promise<void>,
    updateProfile:(data:Partial<UserType>) => Promise<void>
    logout:() => Promise<void>,
    socket: Socket | null,
    onlineUsers:string[],
    connectSocket: () => void,
    disconnectSocket: () => void
}

export const useAuthStore = create<AuthStore>((set,get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile:false,
    isCheckingAuth: true,
    isLoggingOut:false,
    socket: null,
    onlineUsers:[],

    checkAuth : async()=>{
        try {
           const res = await axiosInstance.get("/auth/check");
           set({authUser:res.data, isCheckingAuth: false});
        } catch (error) {
            console.log("error in checking auth",error);
            set({authUser: null, isCheckingAuth: false});
        }
    },

    signup:async(data:SignUpDataType)=>{
        set({isSigningUp:true});
        try {
            const res = await axiosInstance.post("/auth/signup",data);
            set({authUser:res.data});
            get().connectSocket();
            toast.success("Account created Successfully");

        } catch (error:unknown) {
            if(error instanceof Error){
                if(error instanceof AxiosError){
                    toast.error(error.response?.data.message);
                }else{
                    console.log("error during signup",error.message);
                    toast.error(error.message);
                }
            }
            else{
                toast.error("Error Occoured")
            }
        }finally{
            set({isSigningUp:false});
        }
    },

    login:async(data:LoginDataType)=>{
        set({isLoggingIn:true});
        try {
            const res = await axiosInstance.post("/auth/login",data);
            set({authUser:res.data});
            get().connectSocket();
            toast.success("Login Successfull");
        } catch (error:unknown) {
            if(error instanceof Error){
                if(error instanceof AxiosError){
                    toast.error(error.response?.data.message);
                }else{
                    console.log("error during login",error.message);
                    toast.error(error.message);
                }
            }
            else{
                toast.error("Error Occoured")
            }
        }finally{
            set({isLoggingIn:false});
        }
    },

    updateProfile: async (data:Partial<UserType>) =>{
        set({isUpdatingProfile:true});
        try {
            const res = await axiosInstance.put("/auth/update-profile",data);
            set({authUser:res.data});
            toast.success("Profile Updated Successfully");
        } catch (error:unknown) {
            if(error instanceof Error){
                if(error instanceof AxiosError){
                    toast.error(error.response?.data.message);
                }else{
                    console.log("error during updating profile",error.message);
                    toast.error(error.message);
                }
            }
            else{
                toast.error("Error Occoured")
            }
        }finally{
            set({isUpdatingProfile:false});
        }
    },

    logout: async ()=>{
        set({isLoggingOut:true});
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser:null});
            get().disconnectSocket();
            toast.success("Logged out Successfully");
        } catch (error:unknown) {
            if(error instanceof Error){
                if(error instanceof AxiosError){
                    toast.error(error.response?.data.message);
                }else{
                    console.log("error during logout",error.message);
                    toast.error(error.message);
                }
            }
            else{
                toast.error("Error Occoured");
            }
        }finally{
            set({isLoggingOut:false});
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
          query: {
            userId: authUser._id,
            transports: ["websocket"], // ensures stable connection
          },
        });
        // socket.connect();

        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds:string[]) => {
          set({ onlineUsers: userIds });
        });
      },
      disconnectSocket: () => {
        if (get().socket?.connected) {
            get().socket?.disconnect();
        }
      },
}))