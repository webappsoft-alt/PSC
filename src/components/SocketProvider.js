import { createContext, useContext, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

import { endPoints } from "../services/ENV";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return {
    ...context,
    socketId: context.socket?.id || null,
  };
};

const SocketProvider = ({ children }) => {
  const token = useSelector((state) => state.authConfig.token);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const initializeSocket = () => {
    if (!token) return;

    const newSocket = io(endPoints.SOCKET_BASE_URL, {
      auth: { token: token },
      transports: ["websocket"],
      reconnectionAttempts: 15,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("Socket connected successfully");
      setIsConnected(true);
      setSocket(newSocket);

      // Save socketId to AsyncStorage
      if (newSocket.id) {
        AsyncStorage.setItem("socketId", newSocket.id);
        console.log("SocketId saved:", newSocket.id);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      setSocket(null);

      // Remove socketId from AsyncStorage
      AsyncStorage.removeItem("socketId");
    });

    // Error handling
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Reconnection events
    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socketRef.current = newSocket;
  };

  useEffect(() => {
    if (token) {
      initializeSocket();
    } else {
      console.log("No token found for authentication");
      setIsConnected(false);
      setSocket(null);
    }

    // Clean up on unmount or app kill
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  const socketValue = {
    socket,
    isConnected,
    socketId: socket?.id || null,
  };

  return (
    <SocketContext.Provider value={socketValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
