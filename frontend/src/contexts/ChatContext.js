import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        selectedMessages,
        setSelectedMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
