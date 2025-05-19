import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "react-toastify";
import IconSend from "../../assets/images/icons/ic_ send.svg";
import Conversation from "../../components/Conversation/Conversation";
import Message from "../../components/Message/Message";
import { useWebSocket } from "../../contexts/WebSocketContext";
import {
  getAllMessages,
  getMessageWithUser,
} from "../../Service/MessageService";
import { fectchUserName } from "../../Service/UserService";
import HeaderDashboard from "../DashboardPage/Header/HeaderDashboard";
import "../MessagerUser/Messager.css";

// Decode user from token
const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
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
  }
  return null;
};

const Messager = () => {
  const { socket, isConnected } = useWebSocket();
  const [conversations, setConversations] = useState<any>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // ID of receiver
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null); // Info of receiver
  const [message, setMessage] = useState<any[]>([]); // Messages
  const [newMessage, setNewMessage] = useState<string>(""); // New message content
  const [avarta, setAvarta] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  const userInfo = getUserFromToken();
  const currentUserId = userInfo?.idUser;

  useEffect(() => {
    const getUser = async () => {
      if (currentUserId) {
        const userData = await fectchUserName(currentUserId);
        setAvarta(userData?.avarta);
      }
    };
    getUser();
  }, [currentUserId]);

  // Trong hàm sendMessage
  const sendMessage = () => {
    if (selectedUserId && newMessage.trim() && isConnected) {
      socket?.emit(
        "sendMessage",
        {
          receiverId: selectedUserId,
          content: newMessage,
        },
        (response: any) => {
          if (response.status === "success") {
            setMessage((prevMessages) => [
              ...prevMessages,
              {
                content: newMessage,
                own: true,
                avarta: avarta ?? "https://www.gravatar.com/avatar/?d=mp",
                time: new Date().toISOString(),
                ...response.message,
              },
            ]);
          } else {
            toast.error("Không thể gửi tin nhắn");
          }
        }
      );

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
    if (socket && socket.connected) {
      socket?.on("receiveMessage", (message: any) => {
        setMessage((prevMessages) => [
          ...prevMessages,
          {
            avarta:
              message.sender.avarta ?? "https://www.gravatar.com/avatar/?d=mp",
            content: message.content,
            own: false,
            time: new Date(message.createAt).toISOString(),
          },
        ]);
      });

      // Cleanup when component unmounts
      return () => {
        socket?.off("receiveMessage");
      };
    }
  }, [socket, selectedUserId, currentUserId]);

  // Fetch all conversations
  useEffect(() => {
    getAllConversations();
  }, []);

  const getAllConversations = async () => {
    try {
      const res = await getAllMessages();
      if (res) {
        setConversations(res);
      } else {
        console.error("No user data found");
      }
    } catch (error) {
      console.error("Failed to fetch user name:", error);
    }
  };

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
      const res = await getMessageWithUser(userId1, userId2, page);

      if (res && res.data) {
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
          setMessage(sortedMessages);
        } else {
          setMessage((prevMessages) => {
            const allMessages = [...prevMessages, ...updateMessage];
            return allMessages.sort(
              (a: any, b: any) =>
                new Date(a.time).getTime() - new Date(b.time).getTime()
            );
          });
        }
        setPaginationInfo(pagination);
        setHasMore(page < pagination.last_page);
      } else {
        if (page === 1) {
          setMessage([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
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
    setMessage([]); // Reset messages

    // Get receiver information
    const selectUser = conversations.find(
      (user: any) => user.idUser === idUser
    );
    setSelectedUserInfo(selectUser);

    if (currentUserId) {
      try {
        await fetchMessages(currentUserId, idUser, 1);
      } catch (error) {
        console.error("Failed to fetch message:", error);
      }
    }
  };

  useEffect(() => {
    if (currentUserId && selectedUserId && page > 1) {
      fetchMessages(currentUserId, selectedUserId, page);
    }
  }, [page, currentUserId, selectedUserId]);

  // Gửi sự kiện cập nhật số lượng cuộc trò chuyện cho HeaderDashboard
  useEffect(() => {
    if (conversations) {
      const event = new CustomEvent("messagerShopConversationCountUpdate", {
        detail: conversations.length,
      });
      window.dispatchEvent(event);
    }
  }, [conversations]);

  return (
    <div className="messager_shop">
      <HeaderDashboard />
      <div className="messager-container">
        <div className="chatMenu">
          <div className="chatMenuWrapper">
            {conversations.map((data: any) => (
              <Conversation
                key={data.idUser}
                data={data}
                onClick={() => handleSelectUserId(data.idUser)}
                isSelected={selectedUserId === data.idUser}
              />
            ))}
          </div>
        </div>

        <div className="chatBox">
          <div className="chatBoxWrapper">
            {selectedUserInfo && (
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
            )}

            <div className="chatBoxTop" id="chatBoxTop">
              <InfiniteScroll
                dataLength={message.length}
                next={() => {
                  if (!loading && hasMore) {
                    setTimeout(() => {
                      setPage((prevPage) => prevPage + 1);
                    }, 1000);
                  }
                }}
                hasMore={hasMore}
                loader={<p style={{ textAlign: "center" }}>Loading...</p>}
                inverse={true}
                scrollableTarget="chatBoxTop"
                style={{ display: "flex", flexDirection: "column-reverse" }}
              >
                {Array.isArray(message) && message.length > 0 ? (
                  [...message]
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
                    No messages yet
                  </p>
                )}
              </InfiniteScroll>
            </div>
            <div className="chatBoxBottom">
              <textarea
                className="chatMessageInput"
                placeholder="write something..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
              ></textarea>
              <button className="chatSubmitButton" onClick={sendMessage}>
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
