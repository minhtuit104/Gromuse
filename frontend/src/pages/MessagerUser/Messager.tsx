import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import IconSend from "../../assets/images/icons/ic_ send.svg";
import Conversation from "../../components/Conversation/Conversation";
import Message from "../../components/Message/Message";
import { useWebSocket } from "../../contexts/WebSocketContext";
import Header from "../../layouts/Header/Header";
import {
  getAllMessages,
  getMessageWithUser,
} from "../../Service/MessageService";
import { fectchUserName } from "../../Service/UserService";
import "./Messager.css";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null);
  const [message, setMessage] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [avarta, setAvarta] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

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

  // Send message function
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

  // Fetch conversations
  useEffect(() => {
    getAllConversations();
  }, []);

  const getAllConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await getAllMessages();
      if (res) {
        setConversations(res);
      } else {
        console.error("No user data found");
      }
    } catch (error) {
      console.error("Failed to fetch user name:", error);
    }
    setLoadingConversations(false);
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

  useEffect(() => {
    const shopIdFromState = location.state?.shopToChatId as number | undefined;

    if (shopIdFromState && shopIdFromState !== selectedUserId) {
      if (!loadingConversations) {
        const shopExistsInConversations = conversations.some(
          (convo: any) => convo.idUser === shopIdFromState
        );

        if (shopExistsInConversations) {
          handleSelectUserId(shopIdFromState);
        } else {
          setSelectedUserId(shopIdFromState);
          setPage(1);
          setHasMore(true);
          setMessage([]);

          fectchUserName(shopIdFromState)
            .then((shopInfo) => {
              if (shopInfo) {
                setSelectedUserInfo({
                  idUser: shopInfo.idUser,
                  name: shopInfo.name,
                  avarta: shopInfo.avarta,
                });
              } else {
                setSelectedUserInfo({
                  idUser: shopIdFromState,
                  name: "Shop " + shopIdFromState,
                  avarta: null,
                });
              }
            })
            .catch((err) => {
              console.error("Failed to fetch shop info for new chat:", err);
              setSelectedUserInfo({
                idUser: shopIdFromState,
                name: "Shop " + shopIdFromState,
                avarta: null,
              });
            });

          if (currentUserId) fetchMessages(currentUserId, shopIdFromState, 1);
        }
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [
    location.state,
    selectedUserId,
    conversations,
    currentUserId,
    handleSelectUserId,
    navigate,
    location.pathname,
    fetchMessages,
    loadingConversations,
  ]);

  useEffect(() => {
    if (conversations) {
      const count = Array.isArray(conversations) ? conversations.length : 0;
      const event = new CustomEvent("messagerUserConversationCountUpdate", {
        detail: count,
      });
      window.dispatchEvent(event);
    }
  }, [conversations]);

  return (
    <div className="messager_user">
      <Header />
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
