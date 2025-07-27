"use client"

import { useState, useEffect } from "react"
import "../styles/RightSidebar.css"
import { useChat } from "../contexts/ChatContext"
import { useAuth } from "../contexts/AuthContext"

const RightSidebar = ({ isCollapsed, toggleSidebar }) => {
  const [showSummary, setShowSummary] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [replyLoading, setReplyLoading] = useState(false)
  const [summary, setSummary] = useState("")
  const [replies, setReplies] = useState([])

  // Animation states
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  const [showContent, setShowContent] = useState(!isCollapsed)

  const { messages, selectedMessages, setSelectedMessages, selectingForSummary, setSelectingForSummary } = useChat()
  const { user, setUser } = useAuth()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Handle the two-step animation
  const handleToggleSidebar = () => {
    if (!isCollapsed) {
      // Closing: fade content first, then collapse
      setIsCollapsing(true)
      setShowContent(false)

      setTimeout(() => {
        toggleSidebar()
        setIsCollapsing(false)
      }, 250) // Wait for fade out
    } else {
      // Opening: expand first, then fade content in
      setIsExpanding(true)
      toggleSidebar()

      setTimeout(() => {
        setShowContent(true)
        setIsExpanding(false)
      }, 300) // Wait for width expansion
    }
  }

  // Update showContent when isCollapsed changes externally
  useEffect(() => {
    if (!isCollapsed && !isExpanding) {
      setShowContent(true)
    }
  }, [isCollapsed, isExpanding])

  // Enable selection mode in ChatWindow for summary
  const handleStartSummary = () => {
    setShowSummary(true)
    setShowReply(false)
    setSummary("")
    setSelectingForSummary(true)
    setSelectedMessages([])
  }

  const handleCancelSummary = () => {
    setSelectingForSummary(false)
    setSelectedMessages([])
    setShowSummary(false)
    setSummary("")
  }

  const handleRefreshSummary = () => {
    setShowSummary(false)
    setSummary("")
    setSelectedMessages([])
  }

  // Call Gemini summarization API
  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    setSummary("")
    try {
      const selectedMsgs = messages.filter((m) => selectedMessages.includes(m._id))
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/gemini/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: selectedMsgs.map((m) => m.content) }),
      })
      const data = await res.json()
      setSummary(data.summary || "No summary generated.")
    } catch {
      setSummary("Failed to generate summary.")
    }
    setSummaryLoading(false)
    setSelectingForSummary(false)
    setSelectedMessages([])
  }

  // Reply recommendation
  const handleStartReply = () => {
    setShowReply(true)
    setShowSummary(false)
    setReplies([])
  }

  const handleRefreshReply = () => {
    setShowReply(false)
    setReplies([])
  }

  const handleGenerateReply = async () => {
    setReplyLoading(true)
    setReplies([])
    try {
      const chatMessages = messages.slice(-5).map((m) => m.content)
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/gemini/recommend-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, n: 3 }),
      })
      const data = await res.json()
      setReplies(data.replies || ["No reply generated."])
    } catch {
      setReplies(["Failed to generate reply."])
    }
    setReplyLoading(false)
  }

  // Insert reply into input (replace value)
  const handleInsertReply = (reply) => {
    const input = document.querySelector(".message-input")
    if (input) {
      input.value = reply
      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.focus()
    }
  }

  // Helper to check if last message is from the other user
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
  const isLastMsgFromOther = lastMessage && lastMessage.sender && lastMessage.sender !== (user && user._id)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        // Log out and redirect
        localStorage.removeItem("token")
        localStorage.removeItem("chat-user")
        setUser(null)
        window.location.href = "/login"
      } else {
        setDeleting(false)
        alert("Failed to delete account.")
      }
    } catch {
      setDeleting(false)
      alert("Server error.")
    }
  }

  // Generate CSS classes for animation states
  const sidebarClasses = [
    "right-sidebar",
    isCollapsed ? "collapsed" : "",
    isCollapsing ? "collapsing" : "",
    isExpanding ? "expanding" : "",
    isExpanding && showContent ? "show-content" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={sidebarClasses}>
      <div className="sidebar-toggle-container">
        <button className="sidebar-toggle-btn" onClick={handleToggleSidebar}>
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#444" viewBox="0 0 16 16">
              <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#444" viewBox="0 0 16 16">
              <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
            </svg>
          )}
        </button>
      </div>

      <div className="sidebar-content">
        <div className="ai-tools-header">SlateChat AI Tools</div>

        <div className="ai-tools-container">
          {/* Chat Summary Tool */}
          <div className={`ai-tool${showSummary ? " active" : ""}`}>
            <div className="ai-tool-title">Chat Summary</div>
            <div className="ai-tool-desc">Generate a summary of selected messages</div>
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
                    <div className="ai-tool-btn-row">
                      <button
                        className="ai-tool-btn"
                        disabled={!selectedMessages.length}
                        onClick={handleGenerateSummary}
                      >
                        {summaryLoading ? "Generating..." : "Generate"}
                      </button>
                      <button
                        className="ai-tool-btn cancel-btn"
                        onClick={handleCancelSummary}
                        disabled={summaryLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`ai-tool-result${summaryLoading ? " loading" : ""}`}>
                    {summaryLoading ? "Generating..." : summary}
                  </div>
                )}
                <button
                  className="ai-tool-btn ai-tool-refresh-btn"
                  onClick={handleRefreshSummary}
                  disabled={summaryLoading}
                >
                  Refresh
                </button>
              </>
            )}
          </div>

          {/* Reply Recommendation Tool */}
          <div className={`ai-tool${showReply ? " active" : ""}`}>
            <div className="ai-tool-title">Recommended Reply</div>
            <div className="ai-tool-desc">Get AI-generated responses to the last message</div>
            {!showReply && (
              <button
                className="ai-tool-btn"
                onClick={handleStartReply}
                disabled={!isLastMsgFromOther}
                title={
                  !lastMessage
                    ? "No messages in this chat"
                    : !isLastMsgFromOther
                      ? "No recent message from the other user"
                      : ""
                }
              >
                Start Reply Suggestion
              </button>
            )}
            {showReply && (
              <>
                {!isLastMsgFromOther ? (
                  <div className="ai-tool-prompt" style={{ color: "#b00", marginTop: 10 }}>
                    {messages.length === 0 ? "No messages to reply to." : "No recent message from the other user."}
                  </div>
                ) : (
                  <>
                    <button
                      className="ai-tool-btn"
                      style={{ marginTop: 10 }}
                      onClick={handleGenerateReply}
                      disabled={replyLoading}
                    >
                      {replyLoading ? "Generating..." : "Generate Reply"}
                    </button>
                    <div className={`ai-tool-result${replyLoading ? " loading" : ""}`}>
                      {replyLoading
                        ? "Generating..."
                        : replies.length === 0
                          ? "No reply generated."
                          : replies.map((r, i) => (
                              <button key={i} className="ai-reply-option" onClick={() => handleInsertReply(r)}>
                                {r}
                              </button>
                            ))}
                    </div>
                    {!replyLoading && replies.length > 0 && (
                      <button className="ai-tool-btn ai-tool-refresh-btn" onClick={handleRefreshReply}>
                        Refresh
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="delete-account-section">
          <button className="delete-account-btn" onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </button>
        </div>

        {showDeleteModal && (
          <div className="delete-modal-overlay">
            <div className="delete-modal">
              <div className="delete-modal-title">Delete Account</div>
              <div className="delete-modal-text">
                Are you sure you want to delete your account? <br />
                <b>This action cannot be undone.</b>
              </div>
              <div className="delete-modal-actions">
                <button className="delete-modal-confirm" onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting ? "Deleting..." : "Confirm"}
                </button>
                <button className="delete-modal-cancel" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RightSidebar
