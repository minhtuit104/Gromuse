import "./chatonline.css";

interface ChatOnlineProps {
    name: string;
    avarta: string;
}

const ChatOnline = ({name, avarta}: ChatOnlineProps) => {
    return (
        <div className="chatOnline">
            <div className="chatOnlineFriend">                
                <img src={avarta ?? 'https://www.gravatar.com/avatar/?d=mp'} alt="" className="chatOnlineImg" />
                <span className="chatOnlineName">{name ?? 'loading...'}</span>
            </div>
        </div>
    );
};

export default ChatOnline;