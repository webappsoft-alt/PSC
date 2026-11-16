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
  // the signed-in account: switching accounts must reconnect the socket even
  // if a token store lags behind (messages were being sent as the previous
  // account — sender and receiver both the old user)
  const userId = useSelector((state) => state.users?.userData?._id);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const initializeSocket = async () => {
    const key = currentKey.current;
    // same credential as the REST calls (ApiRequest reads AsyncStorage)
    let authToken = token;
    try {
      authToken = (await AsyncStorage.getItem("token")) || token;
    } catch (e) {
      // fall back to the store's token
    }
    if (!authToken) return;
    // a newer account/token arrived while we were reading storage
    if (key !== currentKey.current) return;

    const newSocket = io(endPoints.SOCKET_BASE_URL, {
      auth: { token: authToken },
      transports: ["websocket"],
      reconnectionAttempts: 15,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    // only the current socket may drive state; an older one is closed
    const isCurrent = () => socketRef.current === newSocket;

    // Connection events
    newSocket.on("connect", () => {
      if (!isCurrent()) {
        newSocket.disconnect();
        return;
      }
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
      if (!isCurrent()) return;
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
      if (!isCurrent()) return;
      console.log("Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socketRef.current = newSocket;
  };

  const currentKey = useRef(null);

  useEffect(() => {
    currentKey.current = `${userId || ""}:${token || ""}`;
    if (token) {
      socketRef.current = null;
      initializeSocket();
    } else {
      console.log("No token found for authentication");
      setIsConnected(false);
      setSocket(null);
    }

    // Clean up on unmount or app kill
    return () => {
      const old = socketRef.current;
      socketRef.current = null;
      if (old) old.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, userId]);

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
