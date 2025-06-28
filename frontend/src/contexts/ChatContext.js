import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectingForSummary, setSelectingForSummary] = useState(false);
  const [messages, setMessages] = useState([]); // <-- Add this if not present

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        selectedMessages,
        setSelectedMessages,
        selectionMode,
        setSelectionMode,
        selectingForSummary,
        setSelectingForSummary,
        messages,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
