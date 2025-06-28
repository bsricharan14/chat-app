import React, { useState } from "react";
import "../styles/RightSidebar.css";
import { useChat } from "../contexts/ChatContext";

const RightSidebar = ({ isCollapsed, toggleSidebar }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [replies, setReplies] = useState([]);
  const {
    messages,
    selectedMessages,
    setSelectedMessages,
    selectingForSummary,
    setSelectingForSummary,
  } = useChat();

  // Enable selection mode in ChatWindow for summary
  const handleStartSummary = () => {
    setShowSummary(true);
    setShowReply(false);
    setSummary("");
    setSelectingForSummary(true);
    setSelectedMessages([]);
  };

  const handleCancelSummary = () => {
    setSelectingForSummary(false);
    setSelectedMessages([]);
    setShowSummary(false);
    setSummary("");
  };

  const handleRefreshSummary = () => {
    setShowSummary(false);
    setSummary("");
    setSelectedMessages([]);
  };

  // Call Gemini summarization API
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummary("");
    try {
      const selectedMsgs = messages.filter(m => selectedMessages.includes(m._id));
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/gemini/summarize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: selectedMsgs.map(m => m.content) }),
        }
      );
      const data = await res.json();
      setSummary(data.summary || "No summary generated.");
    } catch {
      setSummary("Failed to generate summary.");
    }
    setSummaryLoading(false);
    setSelectingForSummary(false);
    setSelectedMessages([]);
  };

  // Reply recommendation
  const handleStartReply = () => {
    setShowReply(true);
    setShowSummary(false);
    setReplies([]);
  };

  const handleRefreshReply = () => {
    setShowReply(false);
    setReplies([]);
  };

  const handleGenerateReply = async () => {
    setReplyLoading(true);
    setReplies([]);
    try {
      const chatMessages = messages.slice(-5).map(m => m.content);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/gemini/recommend-reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatMessages, n: 3 }),
        }
      );
      const data = await res.json();
      setReplies(data.replies || ["No reply generated."]);
    } catch {
      setReplies(["Failed to generate reply."]);
    }
    setReplyLoading(false);
  };

  // Insert reply into input (replace value)
  const handleInsertReply = (reply) => {
    const input = document.querySelector(".message-input");
    if (input) {
      input.value = reply;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }
  };

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
          <div className="ai-tools-header">SlateChat AI Tools</div>
          <div className="ai-tools-container">
            {/* Chat Summary Tool */}
            <div className={`ai-tool${showSummary ? " active" : ""}`}>
              <div className="ai-tool-title">Chat Summary</div>
              <div className="ai-tool-desc">
                Generate a summary of selected messages
              </div>
              {!showSummary && (
                <button className="ai-tool-btn" onClick={handleStartSummary}>
                  Start Summarization
                </button>
              )}
              {showSummary && (
                <>
                  {selectingForSummary ? (
                    <div className="ai-tool-prompt">
                      Select messages in chat, then click Generate.
                      <button
                        className="ai-tool-btn"
                        style={{ marginTop: 10 }}
                        disabled={!selectedMessages.length}
                        onClick={handleGenerateSummary}
                      >
                        {summaryLoading ? "Generating..." : "Generate Summary"}
                      </button>
                      <button
                        className="ai-tool-btn cancel-btn"
                        style={{ marginTop: 10, background: "#fff", color: "#888", border: "1px solid #ccc" }}
                        onClick={handleCancelSummary}
                        disabled={summaryLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="ai-tool-result">
                      {summaryLoading ? "Generating..." : summary}
                      <button
                        className="ai-tool-btn"
                        style={{ marginTop: 10 }}
                        onClick={handleRefreshSummary}
                        disabled={summaryLoading}
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Reply Recommendation Tool */}
            <div className={`ai-tool${showReply ? " active" : ""}`}>
              <div className="ai-tool-title">Recommended Reply</div>
              <div className="ai-tool-desc">
                Get AI-generated responses to the last message
              </div>
              {!showReply && (
                <button className="ai-tool-btn" onClick={handleStartReply}>
                  Start Reply Suggestion
                </button>
              )}
              {showReply && (
                <>
                  <button
                    className="ai-tool-btn"
                    style={{ marginTop: 10 }}
                    onClick={handleGenerateReply}
                  >
                    {replyLoading ? "Generating..." : "Generate Reply"}
                  </button>
                  <div className="ai-tool-result">
                    {replyLoading
                      ? "Generating..."
                      : replies.map((r, i) => (
                          <button
                            key={i}
                            className="ai-reply-option"
                            onClick={() => handleInsertReply(r)}
                          >
                            {r}
                          </button>
                        ))}
                    {!replyLoading && replies.length > 0 && (
                      <button
                        className="ai-tool-btn"
                        style={{ marginTop: 10 }}
                        onClick={handleRefreshReply}
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RightSidebar;
