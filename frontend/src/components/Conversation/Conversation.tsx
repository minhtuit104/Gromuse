import "./conversation.css";

const Conversation = ({
  data,
  onClick,
  isSelected,
}: {
  data: any;
  onClick: (idUser: number) => void;
  isSelected: boolean;
}) => {
  return (
    <div
      className={`conversation ${isSelected ? "selecteddata" : ""}`}
      onClick={() => onClick(data.idUser)}
    >
      <div className="conversationImgContainer">
        <img
          src={data.avarta ?? "https://www.gravatar.com/avatar/?d=mp"}
          alt=""
          className="conversationImg"
        />
      </div>
      <div className="wrapperConversation">
        <span className="conversationName">{data.name ?? "Loading..."}</span>
        <span className="conversationMessage">
          {data.isLastMessageMine ? "You: " : ""}
          {data.lastMessage ?? "Loading..."}
        </span>
      </div>
    </div>
  );
};

export default Conversation;
