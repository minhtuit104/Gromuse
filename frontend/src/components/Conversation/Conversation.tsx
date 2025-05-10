import "./conversation.css";

const Conversation = ({user, onClick, isSelected}: {user: any, onClick: (idUser: number) => void, isSelected: boolean}) => {
  return (   
      <div className={`conversation ${isSelected ? 'selectedUser' : ''}`} onClick={() => onClick(user.idUser)}>
        <div className="conversationImgContainer">
            <img src={user.avarta ?? 'https://www.gravatar.com/avatar/?d=mp'} alt="" className="conversationImg" />
            <div className="conversationBadge"></div>
        </div>
        <span className="conversationName">{user.name ?? 'Loading...'}</span>
      </div>
  )
};

export default Conversation;
