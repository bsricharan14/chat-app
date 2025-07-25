import React, { useState } from "react";
import LeftSidebar from "../components/LeftSidebar";
import ChatWindow from "../components/ChatWindow";
import RightSidebar from "../components/RightSidebar";
import { useEffect } from "react";
import "../styles/ChatPage.css";

const ChatPage = () => {
  useEffect(() => {
    document.title = "SlateChat | Chat";
  }, []);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    setRightSidebarCollapsed(!rightSidebarCollapsed);
  };

  return (
    <div className="chat-container">
      <LeftSidebar
        isCollapsed={leftSidebarCollapsed}
        toggleSidebar={toggleLeftSidebar}
      />
      <ChatWindow
        leftSidebarCollapsed={leftSidebarCollapsed}
        rightSidebarCollapsed={rightSidebarCollapsed}
      />
      <RightSidebar
        isCollapsed={rightSidebarCollapsed}
        toggleSidebar={toggleRightSidebar}
      />
    </div>
  );
};

export default ChatPage;
