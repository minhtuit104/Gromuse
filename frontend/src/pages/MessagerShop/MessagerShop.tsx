import { useEffect, useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import IconSend from "../../assets/images/icons/ic_ send.svg";
import Conversation from "../../components/Conversation/Conversation";
import Message from "../../components/Message/Message";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { getMessageWithUser } from "../../Service/MessageService";
import { fectchUserName } from "../../Service/UserService";
import { fetchAllCustomers } from "../../Service/UserService";
import HeaderDashboard from "../DashboardPage/Header/HeaderDashboard";
import "../MessagerUser/Messager.css";

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

const MessagerShop = () => {
  const { socket, isConnected } = useWebSocket();
  const [customerList, setCustomerList] = useState<UserData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // ID of receiver
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null); // Info of receiver
  const [messages, setMessages] = useState<any[]>([]); // Messages
  const [newMessage, setNewMessage] = useState<string>(""); // New message content
  const [avatar, setAvatar] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

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
            console.log(
              "[MessagerShop] Current user data loaded:",
              userData.data
            );
          } else {
            console.warn(
              "[MessagerShop] User data response format unexpected:",
              userData
            );
          }
        } catch (err) {
          console.error("[MessagerShop] Error fetching user data:", err);
          setError("Failed to load user profile. Please refresh the page.");
        }
      } else {
        console.error("[MessagerShop] No current user ID available from token");
        setError("Authentication required. Please log in again.");
      }
    };
    getUser();
  }, [currentUserId]);

  // Trong hàm sendMessage
  const sendMessage = () => {
    // Kiểm tra socket và isConnected trước khi gửi
    if (selectedUserId && newMessage.trim() && socket && isConnected) {
      console.log("[MessagerShop] Sending message to:", selectedUserId);
      socket.emit("sendMessage", {
        receiverId: selectedUserId,
        content: newMessage,
      });

      // Add message to display list temporarily (sender)
      // Đổi tên thành setMessages để nhất quán
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: newMessage,
          own: true,
          avarta: avatar ?? "https://www.gravatar.com/avatar/?d=mp",
          time: new Date().toISOString(),
        },
      ]);
      setNewMessage(""); // Reset message input
    }
  };

  // Trong useEffect lắng nghe receiveMessage
  useEffect(() => {
    if (socket && socket.connected) {
      socket?.on("receiveMessage", (message: any) => {
        // Chỉ thêm tin nhắn vào state nếu là tin nhắn từ người khác gửi đến
        if (message.sender.idUser !== currentUserId) {
          setMessage((prevMessages) => [
            ...prevMessages,
            {
              avarta:
                message.sender.avarta ??
                "https://www.gravatar.com/avatar/?d=mp",
              content: message.content,
              own: false,
              time: new Date(message.createAt).toISOString(),
            },
          ]);
        }
      });

      return () => {
        socket?.off("receiveMessage");
      };
    }
  }, [socket, currentUserId]);

  // Handle Enter key press to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Listen for receiving messages from socket
  useEffect(() => {
    // Chỉ phụ thuộc vào socket
    if (socket) {
      console.log(
        "[MessagerShop] Socket connected, setting up message listener"
      );

      const handleReceiveMessage = (message: any) => {
        console.log("[MessagerShop] Received message via socket:", message);
        // Đổi tên thành setMessages
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            avarta:
              message.sender.avarta ?? "https://www.gravatar.com/avatar/?d=mp",
            content: message.content,
            own: false, // Tin nhắn nhận được không bao giờ là "own"
            time: new Date(message.createAt).toISOString(),
          },
        ]);
      };

      socket.on("receiveMessage", handleReceiveMessage);

      // Cleanup when component unmounts
      return () => {
        console.log("[MessagerShop] Cleaning up socket listener");
        socket.off("receiveMessage", handleReceiveMessage);
      };
    }
  }, [socket]); // Chỉ phụ thuộc vào socket

  // Enhanced customer fetching logic with improved error handling
  const getCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      setError(null);
      setDebugInfo("Fetching customers data...");
      console.log("[MessagerShop - getCustomers] Fetching customers data...");

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("[MessagerShop - getCustomers] No token available");
        setError("Authentication required. Please log in again.");
        setDebugInfo("No authentication token found");
        setLoadingCustomers(false);
        return;
      }

      // Fetch customers (users with role=1)
      const response = await fetchAllCustomers();
      console.log(
        "[MessagerShop - getCustomers] Response from fetchAllCustomers:",
        response
      );

      if (!response) {
        setError("Failed to load customer data - no response received");
        setDebugInfo("API returned no data");
        setCustomerList([]);
        return;
      }

      setDebugInfo(
        `API response received with ${
          Array.isArray(response) ? response.length : 0
        } customers`
      );

      // Handle different response formats
      if (Array.isArray(response)) {
        // Direct array format
        const customers = response.filter(
          (customer: UserData) =>
            customer &&
            customer.idUser !== undefined &&
            customer.idUser !== currentUserId
        );

        console.log(
          "[MessagerShop - getCustomers] Filtered customers to display:",
          customers
        );

        if (customers.length > 0) {
          setCustomerList(customers);
          setDebugInfo(`Found ${customers.length} customers`);
        } else {
          setCustomerList([]);
          setDebugInfo("No customers found");
        }
      } else if (
        response.status === "success" &&
        Array.isArray(response.data)
      ) {
        // Standard response format
        const customers = response.data.filter(
          (customer: UserData) =>
            customer &&
            customer.idUser !== undefined &&
            customer.idUser !== currentUserId
        );

        console.log(
          "[MessagerShop - getCustomers] Filtered customers to display:",
          customers
        );

        if (customers.length > 0) {
          setCustomerList(customers);
          setDebugInfo(`Found ${customers.length} customers`);
        } else {
          setCustomerList([]);
          setDebugInfo("No customers found");
        }
      } else if (response.status === "error") {
        setError(`Failed to load customer data: ${response.message}`);
        setDebugInfo(response.message || "Unknown error");
        setCustomerList([]);
      } else {
        console.warn(
          "[MessagerShop - getCustomers] Unexpected response format:",
          response
        );
        setError("Failed to load customer data - unexpected format");
        setDebugInfo("API returned unexpected data format");
        setCustomerList([]);
      }
    } catch (error: any) {
      console.error(
        "[MessagerShop - getCustomers] Failed to fetch customers:",
        error
      );
      setError(
        `Failed to load customer data: ${error.message || "Unknown error"}`
      );
      setDebugInfo(`Error: ${error.message || "Unknown error"}`);
      setCustomerList([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, [currentUserId]);

  // Fetch customers on component mount
  useEffect(() => {
    if (currentUserId) {
      getCustomers();
    } else {
      setDebugInfo("Waiting for user ID before fetching customers");
    }
  }, [getCustomers, currentUserId]);

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
        `[MessagerShop] Fetching messages between ${userId1} and ${userId2}, page ${page}`
      );

      const res = await getMessageWithUser(userId1, userId2, page);
      console.log("[MessagerShop] Message API response:", res);

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
            "[MessagerShop] Set initial messages:",
            sortedMessages.length
          );
        } else {
          setMessages((prevMessages) => {
            const allMessages = [...prevMessages, ...updateMessage];
            const sorted = allMessages.sort(
              (a: any, b: any) =>
                new Date(a.time).getTime() - new Date(b.time).getTime()
            );
            console.log(
              "[MessagerShop] Updated messages, total:",
              sorted.length
            );
            return sorted;
          });
        }
        setPaginationInfo(pagination);
        setHasMore(page < pagination.last_page);
      } else {
        if (page === 1) {
          setMessages([]);
          console.log("[MessagerShop] No messages found or invalid response");
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("[MessagerShop] Failed to fetch messages:", error);
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
    const selectUser = customerList.find(
      (user: UserData) => user.idUser === idUser
    );
    setSelectedUserInfo(selectUser);
    console.log("[MessagerShop] Selected user:", selectUser);

    if (currentUserId) {
      try {
        await fetchMessages(currentUserId, idUser, 1);
      } catch (error) {
        console.error("[MessagerShop] Failed to fetch messages:", error);
        setError("Failed to load conversation messages");
      }
    }
  };

  // Filter customers based on search query
  const filteredUsers = customerList.filter(
    (customer: UserData) =>
      customer.name &&
      customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load more messages when scrolling
  useEffect(() => {
    if (currentUserId && selectedUserId && page > 1) {
      fetchMessages(currentUserId, selectedUserId, page);
    }
  }, [page, currentUserId, selectedUserId]);

  // Reload customers if there was an error
  const handleRetry = () => {
    setDebugInfo("Retrying customer data fetch...");
    getCustomers();
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
    <div className="messager_shop">
      <HeaderDashboard />
      <div className="messager-container">
        <div className="chatMenu">
          <div className="chatMenuWrapper">
            <div className="search-container">
              <img src={IconSearch} alt="" className="ic_28 ic-search" />
              <input
                type="text"
                placeholder="Search for customers"
                className="chatMenuInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loadingCustomers ? (
              <div className="loading-indicator">Loading customers...</div>
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
                <p>No customers available for chat.</p>
                <button onClick={handleRetry} className="retry-button">
                  Refresh
                </button>
              </div>
            ) : (
              <>
                {filteredUsers.map((customer: UserData) => (
                  <Conversation
                    key={customer.idUser}
                    user={customer}
                    onClick={() => handleSelectUserId(customer.idUser)}
                    isSelected={selectedUserId === customer.idUser}
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
                      : "Select a customer to start chatting"}
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
                    : "Select a customer first..."
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

export default MessagerShop;
