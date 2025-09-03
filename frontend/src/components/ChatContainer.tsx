import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import { ChatHeader } from "./ChatHeader";
import { MessageSkeleton } from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatDate } from "../lib/utils";
import { MessageInput } from "./MessageInput";

// define message type (should match backend schema)
interface Message {
  _id: string;
  senderId: string;
  createdAt: string;
  text?: string;
  image?: string;
}

export const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();

  // ensure correct ref type
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log("🔄 ChatContainer useEffect triggered");
    console.log("🔍 Selected user ID:", selectedUser?._id);
    console.log("🔍 Socket connected:", !!socket);
    console.log("🔍 Auth user:", authUser?._id);

    if (!selectedUser?._id) {
      console.log("❌ No selected user, skipping subscription");
      return;
    }

    // Fetch messages for the selected user
    console.log("📥 Fetching messages for user:", selectedUser._id);
    getMessages(selectedUser._id);

    // Subscribe to real-time messages
    console.log("🔌 Subscribing to real-time messages");
    subscribeToMessages();

    // Cleanup: unsubscribe when component unmounts or selectedUser changes
    return () => {
      console.log("🧹 Cleanup: Unsubscribing from messages");
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id]); // Only depend on the selectedUser ID

  useEffect(() => {
    console.log("📊 Messages updated, count:", messages.length);
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add debugging for socket connection status
  useEffect(() => {
    if (socket) {
      console.log("🔌 Socket connection established");

      socket.on("connect", () => {
        console.log("✅ Socket connected with ID:", socket.id);
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket.on("error", (error) => {
        console.error("🔴 Socket error:", error);
      });

      // Test if we're receiving any socket events at all
      socket.onAny((eventName, ...args) => {
        console.log(`🔔 Socket event received: ${eventName}`, args);
      });

      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("error");
        socket.offAny();
      };
    } else {
      console.log("❌ No socket connection available");
    }
  }, [socket]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!selectedUser || !authUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-500">Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message, index: number) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={index === messages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatDate(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};