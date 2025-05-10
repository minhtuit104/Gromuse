import "./message.css";
import { formatDistanceToNow } from "date-fns";

interface MessageProps {
  own: boolean;
  content: string; //nội dung tin nhắn
  avarta: string; //ảnh đại diện
  time: string; //thời gian
}

const Message = ({ own, content, avarta, time }: MessageProps) => {
  const messageTime = new Date(time);
  return (
    <div className={own ? "message own" : "message"}>
      <div className="messageTop">
        <img
          src={avarta ?? "https://www.gravatar.com/avatar/?d=mp"}
          alt="User Avatar"
          className="messageImg"
        />
        <span className="messageText">{content}</span>
      </div>
      <div className="messageBottom">
        {formatDistanceToNow(messageTime, { addSuffix: true })}
      </div>
    </div>
  );
};

export default Message;
