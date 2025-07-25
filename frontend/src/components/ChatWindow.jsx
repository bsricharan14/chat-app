import React, { useState, useEffect, useRef } from "react";
import "../styles/ChatWindow.css";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { useOnlineUsers } from "../contexts/OnlineUsersContext";

const ChatWindow = ({ leftSidebarCollapsed, rightSidebarCollapsed }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const {
    selectedChat,
    selectedMessages,
    setSelectedMessages,
    selectionMode,
    setSelectionMode,
    selectingForSummary,
    setSelectingForSummary,
    messages,
    setMessages,
  } = useChat();
  const onlineUsers = useOnlineUsers();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef();

  // Fetch messages when selectedChat changes
  useEffect(() => {
    if (!selectedChat || !user) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/left/messages/${selectedChat._id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setMessages(data.slice(-20));
    };
    fetchMessages();
  }, [selectedChat, user]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      if (
        selectedChat &&
        ((msg.sender === user._id && msg.receiver === selectedChat._id) ||
          (msg.sender === selectedChat._id && msg.receiver === user._id))
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleSeen = ({ by }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === user._id && m.receiver === selectedChat._id
            ? { ...m, seen: true }
            : m
        )
      );
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messageSent", handleReceive);
    socket.on("messageSeen", handleSeen);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageSent", handleReceive);
      socket.off("messageSeen", handleSeen);
    };
  }, [socket, selectedChat, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !user || !selectedChat || !socket) {
      return;
    }
    socket.emit("sendMessage", {
      senderId: user._id,
      receiverId: selectedChat._id,
      content: input,
    });
    setInput("");
  };

  // Typing indicator logic
  useEffect(() => {
    if (!socket || !selectedChat || !user) return;

    const inputElem = document.querySelector(".message-input");
    if (!inputElem) return;

    const handleInput = (e) => {
      setInput(e.target.value);

      // Always emit stopTyping if input is empty
      if (e.target.value.trim() === "") {
        setIsTyping(false);
        socket.emit("stopTyping", { to: selectedChat._id, from: user._id });
        clearTimeout(typingTimeoutRef.current);
        return;
      }

      if (!isTyping) {
        setIsTyping(true);
        socket.emit("typing", { to: selectedChat._id, from: user._id });
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit("stopTyping", { to: selectedChat._id, from: user._id });
      }, 1000); // 1 second after last keypress
    };

    inputElem.addEventListener("input", handleInput);

    return () => {
      inputElem.removeEventListener("input", handleInput);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, selectedChat, user, isTyping]);

  // Listen for typing events from the other user
  useEffect(() => {
    if (!socket || !selectedChat) return;

    let otherTypingTimeout;
    const handleTyping = ({ from }) => {
      if (from === selectedChat._id) {
        setTypingUsers((prev) => [...new Set([...prev, from])]);
        clearTimeout(otherTypingTimeout);
        otherTypingTimeout = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== from));
        }, 1500); // Hide after 1.5s of no typing event
      }
    };
    const handleStopTyping = ({ from }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== from));
      clearTimeout(otherTypingTimeout);
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      clearTimeout(otherTypingTimeout);
    };
  }, [socket, selectedChat]);

  // Mark messages as seen when chat is opened or messages change
  useEffect(() => {
    if (socket && user && selectedChat) {
      socket.emit("markAsSeen", {
        userId: user._id,
        otherUserId: selectedChat._id,
      });
    }
  }, [socket, user, selectedChat, messages]);

  // Emit your online status on mount
  useEffect(() => {
    if (socket && user) {
      socket.emit("join", user._id);
      socket.emit("userOnline", user._id);
    }
  }, [socket, user]);

  const contactOnline =
    selectedChat && onlineUsers.includes(selectedChat._id);

  // Utility to group messages by date (returns {date: [messages]})
  const groupMessagesByDate = (messages) => {
    return messages.reduce((groups, msg) => {
      const dateObj = new Date(msg.timestamp);
      const date = `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`;
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
      return groups;
    }, {});
  };

  const handleDeleteMessages = async () => {
    if (!selectedMessages.length || !socket || !user || !selectedChat) return;
    // Optimistically update UI
    setMessages((prev) =>
      prev.map((msg) =>
        selectedMessages.includes(msg._id)
          ? { ...msg, content: "[ deleted message ]", deleted: true, edited: false }
          : msg
      )
    );
    setSelectedMessages([]);
    // Emit delete event to server for real-time update
    socket.emit("deleteMessages", {
      messageIds: selectedMessages,
      userId: user._id,
      otherUserId: selectedChat._id,
    });
  };

  const toggleSelectMessage = (id) => {
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  // Listen for deleted messages from server
  useEffect(() => {
    if (!socket) return;
    const handleMessagesDeleted = ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id)
            ? { ...msg, content: "[ deleted message ]", deleted: true, edited: false }
            : msg
        )
      );
    };
    socket.on("messagesDeleted", handleMessagesDeleted);
    return () => {
      socket.off("messagesDeleted", handleMessagesDeleted);
    };
  }, [socket]);

  // Listen for edited messages from server
  useEffect(() => {
    if (!socket) return;
    const handleEditMessage = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === updatedMsg._id
            ? { ...m, content: updatedMsg.content, edited: true }
            : m
        )
      );
    };
    socket.on("editMessage", handleEditMessage);
    return () => {
      socket.off("editMessage", handleEditMessage);
    };
  }, [socket]);

  if (!selectedChat) {
    return (
      <div className="chat-window empty-state">
        <div className="chat-header">Select a user to start chatting</div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div
      className={`chat-window ${leftSidebarCollapsed ? "left-collapsed" : ""} ${
        rightSidebarCollapsed ? "right-collapsed" : ""
      }`}
    >
      <div className="chat-header">
        <div className="chat-contact-avatar">
          {selectedChat.username
            ? selectedChat.username.slice(0, 2).toUpperCase()
            : ""}
        </div>
        <div>
          <div className="chat-contact-name">
            {selectedChat.username || selectedChat.name}
          </div>
          <div
            className={`chat-contact-status ${
              contactOnline ? "online" : "offline"
            }`}
          >
            {contactOnline ? "Online" : "Offline"}
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className="menu-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            tabIndex={0}
            aria-label="Open menu"
          >
            {/* Three dots SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#888">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div className="chat-header-menu">
              <button
                className="menu-item"
                onClick={() => {
                  setSelectionMode(true);
                  setMenuOpen(false);
                }}
              >
                {/* Example icon (checkbox) */}
                <svg
                  width="18"
                  height="18"
                  fill="#888"
                  viewBox="0 0 20 20"
                  style={{ marginRight: 6 }}
                >
                  <rect
                    x="3"
                    y="3"
                    width="14"
                    height="14"
                    rx="3"
                    fill="#e0e0e0"
                  />
                  <path
                    d="M7 10.5l2 2 4-4"
                    stroke="#888"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                Select Messages
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Fix: Remove inline overflowY and rely on CSS for scrolling */}
      <div className="chat-messages">
        {Object.keys(groupedMessages).map((date) => (
          <div key={date}>
            <div className="date-label">{date}</div>
            {groupedMessages[date].map((msg) => {
              const isSent = msg.sender === user._id;
              const showCheckbox =
                selectingForSummary || (selectionMode && isSent);
              return (
                <div
                  key={msg._id}
                  className={`message ${isSent ? "sent" : "received"}${
                    selectedMessages.includes(msg._id) ? " selected" : ""
                  }`}
                >
                  {showCheckbox && (
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(msg._id)}
                      onChange={() => toggleSelectMessage(msg._id)}
                      className={`msg-checkbox left`}
                    />
                  )}
                  <div className={`message-col ${isSent ? "align-end" : "align-start"}`}>
                    <div className="message-row">
                      <div
                        className={`message-content${msg.deleted || msg.content === "[ deleted message ]" ? " deleted" : ""}`}
                      >
                        {msg.deleted || msg.content === "[ deleted message ]"
                          ? "[ deleted message ]"
                          : msg.content}
                      </div>
                    </div>
                    <div className={`message-meta ${isSent ? "align-end" : "align-start"}`}>
                      {isSent && msg.edited && (
                        <>
                          <span className="edited-tag">edited</span>
                          <span className="dot-separator" style={{ margin: "0 4px", color: "#888" }}>&#8226;</span>
                        </>
                      )}
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      {!isSent && msg.edited && (
                        <>
                          <span className="dot-separator" style={{ margin: "0 4px", color: "#888" }}>&#8226;</span>
                          <span className="edited-tag">edited</span>
                        </>
                      )}
                      {isSent && !msg.deleted && (
                        <span className="read-receipt">
                          {msg.seen ? (
                            // Double check for read
                            <svg
                              width="16"
                              height="16"
                              fill="#4caf50"
                              viewBox="0 0 16 16"
                            >
                              <path
                                d="M1.5 8.5l4 4 9-9"
                                stroke="#4caf50"
                                strokeWidth="2"
                                fill="none"
                              />
                              <path
                                d="M5.5 8.5l2 2 5-5"
                                stroke="#4caf50"
                                strokeWidth="2"
                                fill="none"
                              />
                            </svg>
                          ) : (
                            // Single check for sent
                            <svg
                              width="16"
                              height="16"
                              fill="#888"
                              viewBox="0 0 16 16"
                            >
                              <path
                                d="M1.5 8.5l4 4 9-9"
                                stroke="#888"
                                strokeWidth="2"
                                fill="none"
                              />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {typingUsers.includes(selectedChat._id) && (
          <div className="typing-indicator">Typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="message-input-container" onSubmit={handleSend}>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="send-btn" type="submit">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="white"
            viewBox="0 0 16 16"
          >
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
          </svg>
        </button>
      </form>
      {selectionMode && (
        <div className="delete-actions-bar">
          <button
            onClick={handleDeleteMessages}
            className="delete-btn"
            disabled={selectedMessages.length === 0}
          >
            Delete Selected
          </button>
          {selectedMessages.length === 1 && (() => {
            const msg = messages.find(m => m._id === selectedMessages[0]);
            return msg && msg.sender === user._id;
          })() && (
            <button
              onClick={() => {
                const msg = messages.find(m => m._id === selectedMessages[0]);
                setEditValue(msg.content);
                setEditMode(true);
              }}
              className="update-btn"
            >
              Update
            </button>
          )}
          <button
            onClick={() => {
              setSelectedMessages([]);
              setSelectionMode(false);
            }}
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      )}
      {editMode && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-title">Edit Message</div>
            <textarea
              className="edit-modal-input"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="edit-modal-actions">
              <button
                className="edit-modal-confirm"
                onClick={async () => {
                  const msgId = selectedMessages[0];
                  const token = localStorage.getItem("token");
                  const res = await fetch(
                    `${process.env.REACT_APP_API_URL}/api/left/edit-message/${msgId}`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ content: editValue }),
                    }
                  );
                  if (res.ok) {
                    const updated = await res.json();
                    setMessages(prev =>
                      prev.map(m =>
                        m._id === updated._id
                          ? { ...m, content: updated.content, edited: true }
                          : m
                      )
                    );
                    setEditMode(false);
                    setSelectionMode(false);
                    setSelectedMessages([]);
                    // Optionally emit socket event for real-time update
                    if (socket) {
                      socket.emit("editMessage", updated);
                    }
                  }
                }}
              >
                Save
              </button>
              <button
                className="edit-modal-cancel"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
