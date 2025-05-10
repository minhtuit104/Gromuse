import { useEffect, useState } from "react";
import "./Messager.css";
import IconSearch from "../../assets/images/icons/ic_ search.svg";
import Message from "../../components/Message/Message";
import { fectchUserName, fetchAllUser } from "../../Service/UserService";
import { useWebSocket } from "../../WebSocket/WebSocketProvider";
import { getMessageWithUser } from "../../Service/MessageService";
import InfiniteScroll from "react-infinite-scroll-component";
import Header from "../../layouts/Header/Header";
import ChatOnline from "../../components/chatOnline/ChatOnline";
import Conversation from "../../components/Conversation/Conversation";

//hàm giải mã lấy idUser
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
  const [user, setUser] = useState([]); //khởi tạo danh sách user
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); //lưu idUser của ngyời nhận
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null); //lưu thông tin của người nhận
  const [message, setMessage] = useState<any[]>([]); //lưu message
  const [newMessage, setNewMessage] = useState<string>(""); //lưu message mới
  const [avarta, setAvarta] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);
  // const chatBoxTopRef = useRef<HTMLDivElement>(null);

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

  //hàm gửi tin nhắn
  const sendMessage = () => {
    if (selectedUserId && newMessage.trim() && isConnected) {
      socket?.emit("sendMessage", {
        receiverId: selectedUserId,
        content: newMessage,
      });
      console.log("message gửi: ", newMessage);
      //thêm tin nhắn vào danh sách hiển thị tạm thời (người gửi)
      setMessage((prevMessages) => [
        ...prevMessages,
        {
          content: newMessage,
          own: true,
          avarta: avarta ?? "https://www.gravatar.com/avatar/?d=mp",
          time: new Date().toISOString(),
        },
      ]);
      setNewMessage(""); //Reset phần nhập message mới
    }
  };
  //lắng nghe sự kiện nhận tin nhắn từ socket
  useEffect(() => {
    if (socket && socket.connected) {
      socket?.on("receiveMessage", (message: any) => {
        console.log("message nhận: ", message);
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
      // Cleanup sự kiện khi component unmount
      return () => {
        socket?.off("receiveMessage");
      };
    }
  }, [socket, selectedUserId]);

  //gọi API lấy danh sách user
  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const res = await fetchAllUser();
      if (res && res.data) {
        setUser(res.data);
      } else {
        console.error("No user data not found");
      }
    } catch (error) {
      console.error("Failed to fetch user name:", error);
    }
  };

  //hàm fetch message với pagination
  const fetchMessages = async (
    userId1: number,
    userId2: number,
    page: number
  ) => {
    if (!userId1 || !userId2 || loading) {
      console.log("lỗi ở đây...");
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
          // sắp xếp tin nhắn theo thời gian mới nhất
          const sortedMessages = updateMessage.sort(
            (a: any, b: any) =>
              new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          setMessage(sortedMessages);
          //setTimeout(scrollToBottom, 100); //scroll xuống tin nhắn mới nhất
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

  //hàm chọn người nhận
  const handleSelectUserId = async (idUser: number) => {
    setSelectedUserId(idUser);
    console.log("idUser người nhận---------->: ", idUser);

    setPage(1); //reset page về 1 khi chọn người nhận
    setHasMore(true); //reset có thêm tin nhắn hay không
    setMessage([]); //reset tin nhắn
    //lấy thông tin người nhận
    const selectUser = user.find((user: any) => user.idUser === idUser);
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

  return (
    <>
      <div className="messager">
        <Header />
        <div className="chatBox">
          <div className="chatBoxWrapper">
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
                //height={window.innerHeight - 200}
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
                  <p>No messages</p>
                )}
              </InfiniteScroll>
            </div>
            <div className="chatBoxBottom">
              <textarea
                className="chatMessageInput"
                placeholder="write something..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              ></textarea>
              <button className="chatSubmitButton" onClick={sendMessage}>
                Send
              </button>
            </div>
          </div>
        </div>
        <div className="chatOnline">
          <div className="chatOnlineWrapper">
            {selectedUserInfo && (
              <ChatOnline
                name={selectedUserInfo.name}
                avarta={
                  selectedUserInfo.avarta ??
                  "https://www.gravatar.com/avatar/?d=mp"
                }
              />
            )}
          </div>
        </div>
        <div className="chatMenu">
          <div className="chatMenuWrapper">
            <img src={IconSearch} alt="" className="ic-22 ic-search" />
            <input
              type="text"
              placeholder="Search for friends"
              className="chatMenuInput"
            />
            {/* Map qua danh sách user và render Conversation */}
            {user.map((user: any) => (
              <Conversation
                key={user.idUser}
                user={user}
                onClick={() => handleSelectUserId(user.idUser)}
                isSelected={selectedUserId === user.idUser}
              /> //kiểm tra xem user có được chọn hay không
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Messager;
