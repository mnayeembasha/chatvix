import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { AxiosError } from "axios";
import type { UserType } from "../types";
import type { MessageDataType } from "../components/MessageInput";

export interface MessageType {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  image: string;
  createdAt: string;
}

interface ChatStore {
  messages: MessageType[];
  users: UserType[];
  selectedUser: UserType | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: MessageDataType) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (user: UserType | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get<UserType[]>("/messages/users");
      set({ users: res.data });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data.message);
        } else {
          console.error("Error in getUsers:", error.message);
          toast.error(error.message);
        }
      } else {
        toast.error("An error occurred while fetching users.");
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get<MessageType[]>(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data.message);
        } else {
          console.error("Error in getMessages:", error.message);
          toast.error(error.message);
        }
      } else {
        toast.error("An error occurred while fetching messages.");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData: MessageDataType) => {
    const { selectedUser, messages } = get();
    if (!selectedUser?._id) {
      toast.error("No user selected to send message.");
      return;
    }

    // Validate that we have either text or image
    if (!messageData.text?.trim() && !messageData.image) {
      toast.error("Please enter a message or select an image.");
      return;
    }

    try {
      // Clean the message data - only send non-empty fields
      const cleanMessageData: MessageDataType = {};

      if (messageData.text?.trim()) {
        cleanMessageData.text = messageData.text.trim();
      }

      if (messageData.image) {
        cleanMessageData.image = messageData.image;
      }

      console.log("Sending message data:", cleanMessageData);

      const res = await axiosInstance.post<MessageType>(
        `/messages/send/${selectedUser._id}`,
        cleanMessageData
      );

      console.log("Message sent successfully:", res.data);
      set({ messages: [...messages, res.data] });
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      if (error instanceof Error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data.message || "Failed to send message");
        } else {
          console.error("Error in sendMessage:", error.message);
          toast.error(error.message);
        }
      } else {
        toast.error("An error occurred while sending the message.");
      }
    }
  },

  subscribeToMessages: () => {
    // console.log("🔌 Attempting to subscribe to messages...");

    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    // const { authUser } = useAuthStore.getState();

    // console.log("🔍 Socket exists:", !!socket);
    // console.log("🔍 Selected user:", selectedUser?._id);
    // console.log("🔍 Auth user:", authUser?._id);

    if (!socket) {
      console.error("❌ No socket connection available");
      return;
    }

    if (!selectedUser) {
      console.error("❌ No selected user");
      return;
    }

    // Remove any existing listener to prevent duplicates
    socket.off("newMessage");
    // console.log("🧹 Cleaned up existing listeners");

    socket.on("newMessage", (newMessage: MessageType) => {
      // console.log("📨 RAW MESSAGE RECEIVED:", newMessage);

      const currentState = get();
      const currentAuthUser = useAuthStore.getState().authUser;

      console.log("🔍 Current selected user in handler:", currentState.selectedUser?._id);
      console.log("🔍 Current auth user in handler:", currentAuthUser?._id);
      console.log("🔍 Message sender:", newMessage.senderId);
      console.log("🔍 Message receiver:", newMessage.receiverId);

      if (!currentState.selectedUser || !currentAuthUser) {
        console.log("❌ Missing user data in handler");
        return;
      }

      // Check if this message belongs to the current conversation
      const isMessageForCurrentChat =
        (newMessage.senderId === currentState.selectedUser._id && newMessage.receiverId === currentAuthUser._id) ||
        (newMessage.senderId === currentAuthUser._id && newMessage.receiverId === currentState.selectedUser._id);

      // console.log("🎯 Is message for current chat?", isMessageForCurrentChat);

      if (!isMessageForCurrentChat) {
        // console.log("❌ Message not for current chat - ignoring");
        return;
      }

      // Check if message already exists to prevent duplicates
      const messageExists = currentState.messages.some(msg => msg._id === newMessage._id);

      // console.log("🔍 Message already exists?", messageExists);

      if (!messageExists) {
        // console.log("✅ Adding new message to chat");
        // console.log("📝 Current messages count:", currentState.messages.length);
        set({ messages: [...currentState.messages, newMessage] });
        // console.log("📝 New messages count:", currentState.messages.length + 1);
      } else {
        // console.log("ℹ️ Message already exists, skipping");
      }
    });

    // console.log("✅ Socket listener registered for 'newMessage' event");
  },

  unsubscribeFromMessages: () => {
    // console.log("🔌 Unsubscribing from messages...");
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      // console.log("✅ Unsubscribed from newMessage events");
    } else {
      // console.log("❌ No socket to unsubscribe from");
    }
  },

  setSelectedUser: (user: UserType | null) => {
    // console.log("👤 Setting selected user:", user?._id);
    set({ selectedUser: user });
  },
}));