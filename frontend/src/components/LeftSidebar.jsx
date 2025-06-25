import React, { useState, useEffect, useCallback } from "react";
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
    if (!search.trim()) return;
    setSearching(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${
          process.env.REACT_APP_API_URL
        }/api/left/search?query=${encodeURIComponent(search)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
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
          <div className="search-container">
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
          </div>
          <div className="chat-list">
            {search ? (
              searching ? (
                <div className="search-status">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="chat-item"
                    onClick={() => {
                      setActiveChat(user.username);
                      setSelectedChat(user);
                    }}
                  >
                    <div className="chat-avatar">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="chat-info">
                      <div className="chat-name">{user.username}</div>
                      <div className="chat-preview">{user.email}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-status">No results</div>
              )
            ) : Array.isArray(recentChats) && recentChats.length > 0 ? (
              recentChats.map(({ user: chatUser, latestMessage }) => (
                <div
                  key={chatUser._id}
                  className={`chat-item ${
                    activeChat === chatUser.username ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveChat(chatUser.username);
                    setSelectedChat(chatUser);
                  }}
                >
                  <div className="chat-avatar">
                    {chatUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name">{chatUser.username}</div>
                    <div className="chat-preview">
                      {latestMessage
                        ? `${latestMessage.sender === user._id ? "You: " : ""}${
                            latestMessage.content
                          }`
                        : "No messages yet"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="search-status">No recent chats</div>
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
