import React, { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import "../styles/LeftSidebar.css";
import { useNavigate } from "react-router-dom";

const LeftSidebar = ({ isCollapsed, toggleSidebar }) => {
  const [activeChat, setActiveChat] = useState("JD");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [timerPercent, setTimerPercent] = useState(100);
  const timerRef = useRef();
  const { setSelectedChat } = useChat();
  const { user, setUser } = useAuth();
  const [recentChats, setRecentChats] = useState([]);
  const socket = useSocket();
  const navigate = useNavigate();

  // Fetch recent chats (memoized for reuse)
  const fetchRecent = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/left/latest-messages`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setRecentChats(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecentChats([]);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Refetch on new message via socket
  useEffect(() => {
    if (!socket) return;
    const updateRecent = () => {
      fetchRecent();
    };
    socket.on("receiveMessage", updateRecent);
    socket.on("messageSent", updateRecent);
    return () => {
      socket.off("receiveMessage", updateRecent);
      socket.off("messageSent", updateRecent);
    };
  }, [socket, fetchRecent]);

  useEffect(() => {
    if (search.trim() === "") {
      setSearchResults([]);
    }
  }, [search]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) {
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    setShowDropdown(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/left/search?query=${encodeURIComponent(search)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setSearchResults(data);
      if (Array.isArray(data) && data.length === 0) {
        setShowNoResults(true);
        setTimerPercent(100);
      }
    } catch (err) {
      setSearchResults([]);
      setShowNoResults(true);
      setTimerPercent(100);
    } finally {
      setSearching(false);
    }
  };

  // Timer effect for "No results found"
  useEffect(() => {
    if (!showNoResults) return;
    setTimerPercent(100);
    const duration = 1500;
    const interval = 30; // ms
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const percent = Math.max(0, 100 - (elapsed / duration) * 100);
      setTimerPercent(percent);
      if (elapsed >= duration) {
        setShowNoResults(false);
        setShowDropdown(false);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [showNoResults]);

  // Hide dropdown when clicking a user
  const handleSelectUser = (user) => {
    setActiveChat(user.username);
    setSelectedChat(user);
    setShowDropdown(false);
    setSearch(""); // Optionally clear search input
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("chat-user");
    setUser(null);
    setSelectedChat(null);
    // Optionally, reload the page to clear all state and socket connections
    window.location.href = "/login";
  };

  return (
    <div className={`left-sidebar ${isCollapsed ? "collapsed" : ""}`}>
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
              <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#444"
              viewBox="0 0 16 16"
            >
              <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
            </svg>
          )}
        </button>
      </div>
      {!isCollapsed && (
        <>
          <div
            className="sidebar-brand"
            style={{
              fontWeight: 700,
              fontSize: 22,
              color: "#444",
              background: "#f5f5f5",
              padding: "16px 0",
              textAlign: "center",
              letterSpacing: "1px",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            SlateChat
          </div>
          {user && (
            <div className="left-username"  >
              Hi, {user.username}
            </div>
          )}
          <div className="search-container">
            <form className="search-bar" onSubmit={handleSearch} autoComplete="off">
              <input
                type="text"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.trim() === "") {
                    setShowDropdown(false);
                    setSearchResults([]);
                    setShowNoResults(false);
                  }
                }}
                onFocus={() => {
                  if (search.trim()) setShowDropdown(true);
                }}
              />
              <button type="submit">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="#777777"
                  viewBox="0 0 16 16"
                >
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                </svg>
              </button>
            </form>
            {/* Search Dropdown - always outside chat-list */}
            {showDropdown && (
              <div className="search-dropdown search-dropdown-centered">
                {searching ? (
                  <div className="search-status">Searching...</div>
                ) : showNoResults ? (
                  <>
                    <div className="search-status">No results found</div>
                    <div className="search-timer-bar">
                      <div
                        className="search-timer-bar-inner"
                        style={{ width: `${timerPercent}%` }}
                      />
                    </div>
                  </>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => {
                    const recent = recentChats.find(
                      (rc) => rc.user._id === user._id && rc.latestMessage
                    );
                    return (
                      <div
                        key={user._id}
                        className="search-dropdown-item"
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="chat-avatar">
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="chat-info">
                          <div className="chat-name">{user.username}</div>
                          {recent && recent.latestMessage ? (
                            <div className="chat-preview" title={recent.latestMessage.content}>
                              {recent.latestMessage.content.length > 30
                                ? recent.latestMessage.content.slice(0, 30) + "..."
                                : recent.latestMessage.content}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                ) : null}
              </div>
            )}
          </div>
          <div className="chat-list">
            {Array.isArray(recentChats) && recentChats.filter(rc => rc.latestMessage).length > 0 ? (
              recentChats
                .filter(({ latestMessage }) => !!latestMessage)
                .map(({ user: chatUser, latestMessage }) => (
                  <div
                    key={chatUser._id}
                    className={`chat-item ${activeChat === chatUser.username ? "active" : ""}`}
                    onClick={() => {
                      setActiveChat(chatUser.username);
                      setSelectedChat(chatUser);
                    }}
                  >
                    <div className="chat-avatar">
                      {chatUser.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="chat-info">
                      <div className="chat-info-row">
                        <div className="chat-name">{chatUser.username}</div>
                        <div className="chat-preview-time">
                          {latestMessage?.timestamp &&
                            new Date(latestMessage.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                        </div>
                      </div>
                      <div className="chat-info-row">
                        <div className="chat-preview" title={latestMessage?.content || ""}>
                          {latestMessage?.sender === user._id && latestMessage?.content
                            ? (
                                <>
                                  <span style={{ color: "#888", fontWeight: 500 }}>you: </span>
                                  {latestMessage.content.length > 30
                                    ? latestMessage.content.slice(0, 30) + "..."
                                    : latestMessage.content}
                                </>
                              )
                            : latestMessage?.content
                              ? latestMessage.content.length > 30
                                ? latestMessage.content.slice(0, 30) + "..."
                                : latestMessage.content
                              : ""}
                        </div>
                        <div className="chat-preview-date">
                          {latestMessage?.timestamp &&
                            (() => {
                              const d = new Date(latestMessage.timestamp);
                              return `${String(d.getDate()).padStart(2, "0")}/${String(
                                d.getMonth() + 1
                              ).padStart(2, "0")}/${d.getFullYear()}`;
                            })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="search-status">
                Start chatting to see recent chats here.<br />
                Use the search above to find users and start a conversation.
              </div>
            )}
          </div>
          <div className="logout-container">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LeftSidebar;
