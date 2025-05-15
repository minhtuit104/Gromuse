import { useEffect, useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import IconSearch from "../../assets/images/icons/ic_ search.svg";
import IconSend from "../../assets/images/icons/ic_ send.svg";
import Conversation from "../../components/Conversation/Conversation";
import Message from "../../components/Message/Message";
import { useWebSocket } from "../../contexts/WebSocketContext";
import Header from "../../layouts/Header/Header";
import { getMessageWithUser } from "../../Service/MessageService";
import { fectchUserName } from "../../Service/UserService";
import { fetchAllShops } from "../../Service/UserService";

interface UserData {
  idUser: number;
  name: string;
  avarta: string | null;
  email?: string;
  phoneNumber?: string;
}

// Decode user from token
const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }
  return null;
};

const Messager = () => {
  const { socket, isConnected } = useWebSocket();
  const [shopList, setShopList] = useState<UserData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // ID of receiver
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null); // Info of receiver
  const [messages, setMessages] = useState<any[]>([]); // Messages
  const [newMessage, setNewMessage] = useState<string>(""); // New message content
  const [avatar, setAvatar] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingShops, setLoadingShops] = useState<boolean>(true);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  // Add a pending messages state to track sent messages
  const [pendingMessageIds, setPendingMessageIds] = useState<Set<string>>(
    new Set()
  );

  const userInfo = getUserFromToken();
  const currentUserId = userInfo?.idUser;

  // Fetch current user data
  useEffect(() => {
    const getUser = async () => {
      if (currentUserId) {
        try {
          const userData = await fectchUserName(currentUserId);
          if (userData?.data) {
            setAvatar(userData.data.avarta);
            console.log("[Messager] Current user data loaded:", userData.data);
          } else {
            console.warn(
              "[Messager] User data response format unexpected:",
              userData
            );
          }
        } catch (err) {
          console.error("[Messager] Error fetching user data:", err);
          setError("Failed to load user profile. Please refresh the page.");
        }
      } else {
        console.error("[Messager] No current user ID available from token");
        setError("Authentication required. Please log in again.");
      }
    };
    getUser();
  }, [currentUserId]);

  // Generate a unique message ID
  const generateMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendMessage = () => {
    if (selectedUserId && newMessage.trim() && socket && isConnected) {
      console.log("[Messager] Sending message to:", selectedUserId);

      // Generate a unique ID for this message
      const messageId = generateMessageId();

      // Send message with ID
      socket.emit("sendMessage", {
        receiverId: selectedUserId,
        content: newMessage,
        messageId: messageId,
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: newMessage,
          own: true,
          avarta: avatar ?? "https://www.gravatar.com/avatar/?d=mp",
          time: new Date().toISOString(),
          messageId: messageId, // Store the ID with the message
        },
      ]);

      setPendingMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(messageId);
        return newSet;
      });

      setNewMessage(""); // Reset message input
    }
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (socket) {
      console.log("[Messager] Socket connected, setting up message listener");

      const handleReceiveMessage = (message: any) => {
        console.log("[Messager] Received message via socket:", message);

        // Check if this is a message we sent (has messageId in our pending set)
        if (message.messageId && pendingMessageIds.has(message.messageId)) {
          console.log(
            "[Messager] Skipping own message echo:",
            message.messageId
          );

          // Remove from pending set as we've now seen it come back
          setPendingMessageIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(message.messageId);
            return newSet;
          });

          return; // Skip adding this message again
        }

        // Add message from other users
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            avarta:
              message.sender.avarta ?? "https://www.gravatar.com/avatar/?d=mp",
            content: message.content,
            own: false,
            time: new Date(message.createAt).toISOString(),
            messageId: message.messageId,
          },
        ]);
      };

      socket.on("receiveMessage", handleReceiveMessage);

      return () => {
        console.log("[Messager] Cleaning up socket listener");
        socket.off("receiveMessage", handleReceiveMessage);
      };
    }
  }, [socket, pendingMessageIds]);

  const getShops = useCallback(async () => {
    try {
      setLoadingShops(true);
      setError(null);
      setDebugInfo("Fetching shops data...");
      console.log("[Messager - getShops] Fetching shops data...");

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("[Messager - getShops] No token available");
        setError("Authentication required. Please log in again.");
        setDebugInfo("No authentication token found");
        setLoadingShops(false);
        return;
      }

      // Fetch shops (users with role=2)
      const response = await fetchAllShops();
      console.log(
        "[Messager - getShops] Response from fetchAllShops:",
        response
      );

      if (!response) {
        setError("Failed to load shop data - no response received");
        setDebugInfo("API returned no data");
        setShopList([]);
        return;
      }

      setDebugInfo(`API response status: ${response.status}`);

      if (response.status === "success" && Array.isArray(response.data)) {
        // Filter out current user from shop list
        const shops = response.data.filter(
          (shop: UserData) =>
            shop && shop.idUser !== undefined && shop.idUser !== currentUserId
        );

        console.log("[Messager - getShops] Filtered shops to display:", shops);

        if (shops.length > 0) {
          setShopList(shops);
          setDebugInfo(`Found ${shops.length} shops`);
        } else {
          setShopList([]);
          setDebugInfo("No shops found or you are the only shop");
        }
      } else if (response.status === "error") {
        setError(`Failed to load shop data: ${response.message}`);
        setDebugInfo(response.message || "Unknown error");
        setShopList([]);
      } else {
        console.warn(
          "[Messager - getShops] Unexpected response format:",
          response
        );
        setError("Failed to load shop data - unexpected format");
        setDebugInfo("API returned unexpected data format");
        setShopList([]);
      }
    } catch (error: any) {
      console.error("[Messager - getShops] Failed to fetch shops:", error);
      setError(`Failed to load shop data: ${error.message || "Unknown error"}`);
      setDebugInfo(`Error: ${error.message || "Unknown error"}`);
      setShopList([]);
    } finally {
      setLoadingShops(false);
    }
  }, [currentUserId]);

  // Fetch shops on component mount
  useEffect(() => {
    if (currentUserId) {
      getShops();
    } else {
      setDebugInfo("Waiting for user ID before fetching shops");
    }
  }, [getShops, currentUserId]);

  // Fetch messages with pagination
  const fetchMessages = async (
    userId1: number,
    userId2: number,
    page: number
  ) => {
    if (!userId1 || !userId2 || loading) {
      return;
    }
    try {
      setLoading(true);
      console.log(
        `[Messager] Fetching messages between ${userId1} and ${userId2}, page ${page}`
      );

      const res = await getMessageWithUser(userId1, userId2, page);
      console.log("[Messager] Message API response:", res);

      if (res && res.data && res.data.data) {
        const {
          data: { data: newMessages, pagination },
        } = res;

        const updateMessage = newMessages.map((msg: any) => ({
          ...msg,
          own: msg.sender.idUser === userId1,
          time: msg.createAt,
          avarta: msg.sender.avarta ?? "https://www.gravatar.com/avatar/?d=mp",
        }));

        if (page === 1) {
          // Sort messages by time
          const sortedMessages = updateMessage.sort(
            (a: any, b: any) =>
              new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          setMessages(sortedMessages);
          console.log(
            "[Messager] Set initial messages:",
            sortedMessages.length
          );
        } else {
          setMessages((prevMessages) => {
            const allMessages = [...prevMessages, ...updateMessage];
            const sorted = allMessages.sort(
              (a: any, b: any) =>
                new Date(a.time).getTime() - new Date(b.time).getTime()
            );
            console.log("[Messager] Updated messages, total:", sorted.length);
            return sorted;
          });
        }
        setPaginationInfo(pagination);
        setHasMore(page < pagination.last_page);
      } else {
        if (page === 1) {
          setMessages([]);
          console.log("[Messager] No messages found or invalid response");
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("[Messager] Failed to fetch messages:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Select a user to chat with
  const handleSelectUserId = async (idUser: number) => {
    setSelectedUserId(idUser);

    setPage(1); // Reset page to 1 when selecting a user
    setHasMore(true); // Reset has more messages flag
    setMessages([]); // Reset messages

    // Get receiver information
    const selectUser = shopList.find(
      (user: UserData) => user.idUser === idUser
    );
    setSelectedUserInfo(selectUser);
    console.log("[Messager] Selected user:", selectUser);

    if (currentUserId) {
      try {
        await fetchMessages(currentUserId, idUser, 1);
      } catch (error) {
        console.error("[Messager] Failed to fetch messages:", error);
        setError("Failed to load conversation messages");
      }
    }
  };

  // Filter shops based on search query
  const filteredUsers = shopList.filter(
    (shop: UserData) =>
      shop.name && shop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load more messages when scrolling
  useEffect(() => {
    if (currentUserId && selectedUserId && page > 1) {
      fetchMessages(currentUserId, selectedUserId, page);
    }
  }, [page, currentUserId, selectedUserId]);

  // Reload shops if there was an error
  const handleRetry = () => {
    setDebugInfo("Retrying shop data fetch...");
    getShops();
  };

  // Show token debug info
  const showTokenInfo = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const firstTenChars = token.slice(0, 10);
      const lastTenChars = token.slice(-10);
      setDebugInfo(`Token exists: ${firstTenChars}...${lastTenChars}`);
    } else {
      setDebugInfo("No token found in localStorage");
    }
    setTimeout(() => setDebugInfo(null), 5000);
  };

  return (
    <div className="messager_user">
      <Header />
      <div className="messager-container">
        <div className="chatMenu">
          <div className="chatMenuWrapper">
            <div className="search-container">
              <img src={IconSearch} alt="" className="ic_28 ic-search" />
              <input
                type="text"
                placeholder="Search for shops"
                className="chatMenuInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loadingShops ? (
              <div className="loading-indicator">Loading shops...</div>
            ) : error ? (
              <div className="error-container">
                <p>{error}</p>
                {debugInfo && <p className="debug-info">{debugInfo}</p>}
                <div className="error-actions">
                  <button onClick={handleRetry} className="retry-button">
                    Retry
                  </button>
                  <button onClick={showTokenInfo} className="debug-button">
                    Check Token
                  </button>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-data-message">
                <p>No shops available for chat.</p>
                <button onClick={handleRetry} className="retry-button">
                  Refresh
                </button>
              </div>
            ) : (
              <>
                {filteredUsers.map((shop: UserData) => (
                  <Conversation
                    key={shop.idUser}
                    user={shop}
                    onClick={() => handleSelectUserId(shop.idUser)}
                    isSelected={selectedUserId === shop.idUser}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="chatBox">
          <div className="chatBoxWrapper">
            {selectedUserInfo ? (
              <div className="chatHeader">
                <div className="chatOnlineFriend">
                  <img
                    src={
                      selectedUserInfo.avarta ??
                      "https://www.gravatar.com/avatar/?d=mp"
                    }
                    alt=""
                    className="chatOnlineImg"
                  />
                  <span className="chatOnlineName">
                    {selectedUserInfo.name ?? "Loading..."}
                  </span>
                </div>
              </div>
            ) : (
              <div className="chatHeader empty-header"></div>
            )}

            <div className="chatBoxTop" id="chatBoxTop">
              <InfiniteScroll
                dataLength={messages.length}
                next={() => {
                  if (!loading && hasMore) {
                    setTimeout(() => {
                      setPage((prevPage) => prevPage + 1);
                    }, 1000);
                  }
                }}
                hasMore={hasMore}
                loader={
                  <p style={{ textAlign: "center" }}>Loading messages...</p>
                }
                inverse={true}
                scrollableTarget="chatBoxTop"
                style={{ display: "flex", flexDirection: "column-reverse" }}
              >
                {Array.isArray(messages) && messages.length > 0 ? (
                  [...messages]
                    .reverse()
                    .map((msg, index) => (
                      <Message
                        key={`msg-${index}`}
                        own={msg.own}
                        content={msg.content}
                        avarta={
                          msg.avarta ?? "https://www.gravatar.com/avatar/?d=mp"
                        }
                        time={msg.time}
                      />
                    ))
                ) : (
                  <p style={{ textAlign: "center", color: "#888" }}>
                    {selectedUserId
                      ? "No messages yet. Start a conversation!"
                      : "Select a shop to start chatting"}
                  </p>
                )}
              </InfiniteScroll>
            </div>
            <div className="chatBoxBottom">
              <textarea
                className="chatMessageInput"
                placeholder={
                  selectedUserId
                    ? "Write a message..."
                    : "Select a shop first..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={!selectedUserId}
              ></textarea>
              <button
                className="chatSubmitButton"
                onClick={sendMessage}
                disabled={!selectedUserId || !newMessage.trim()}
              >
                <img src={IconSend} alt="Send" className="ic_32" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messager;
