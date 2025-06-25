import React, { useState } from "react";
import "../styles/RightSidebar.css";

const RightSidebar = ({ isCollapsed, toggleSidebar }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const toggleSummary = () => setShowSummary(!showSummary);
  const toggleReply = () => setShowReply(!showReply);

  return (
    <div className={`right-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-toggle-container">
        <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
          {isCollapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#444"
              viewBox="0 0 16 16"
            >
              <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#444"
              viewBox="0 0 16 16"
            >
              <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
            </svg>
          )}
        </button>
      </div>
      {!isCollapsed && (
        <>
          <div
            className="ai-tools-header"
            style={{ color: "#444", background: "#f5f5f5" }}
          >
            SlateChat AI Tools
          </div>
          <div className="ai-tools-container">
            <div className="ai-tool" onClick={toggleSummary}>
              <div className="ai-tool-title">Chat Summary</div>
              <div className="ai-tool-desc">
                Generate a summary of selected messages
              </div>
              {showSummary && (
                <div className="ai-tool-result">
                  Conversation overview: Discussing project progress,
                  specifically frontend components. Positive feedback on
                  completed chat interface with three main components.
                </div>
              )}
            </div>
            <div className="ai-tool" onClick={toggleReply}>
              <div className="ai-tool-title">Recommended Reply</div>
              <div className="ai-tool-desc">
                Get AI-generated response to last message
              </div>
              {showReply && (
                <div className="ai-tool-result">
                  Suggested reply: "Thanks! I'll share the demo link once it's
                  ready. Should be by end of day today."
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RightSidebar;
