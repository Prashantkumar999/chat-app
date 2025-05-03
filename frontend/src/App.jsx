import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import { PaperAirplaneIcon, FaceSmileIcon } from "@heroicons/react/24/outline";
import "./App.css";

const socket = io(import.meta.env.VITE_BACKEND_URL);
console.log(import.meta.env.VITE_BACKEND_URL);


function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, { ...data, id: Date.now() }]);
    });

    socket.on("user_list", (userList) => {
      setUsers(userList);
    });

    socket.on("message_reaction", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reaction: data.reaction } : msg
        )
      );
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_list");
      socket.off("message_reaction");
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit("user_join", username);
      setIsLoggedIn(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send_message", message);
      setMessage("");
      setShowEmojiPicker(false);
    }
  };

  const handleTyping = () => {
    socket.emit("typing", true);
    setTimeout(() => {
      socket.emit("typing", false);
    }, 1000);
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleStatusUpdate = (status) => {
    socket.emit("update_status", status);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            Welcome to Chat App
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-4 gap-4 h-[90vh]">
          {/* Online Users Sidebar */}
          <div className="bg-white rounded-2xl shadow-lg p-4 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Online Users
            </h2>
            <div className="space-y-3">
              {users.map((user, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 rounded-md bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-700">{user.username}</p>
                    <p className="text-sm text-gray-500">{user.status}</p>
                  </div>
                  {user.typing && (
                    <span className="text-sm text-blue-500 italic">
                      typing...
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-3 bg-white rounded-2xl shadow-lg flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Chat Room</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.username === username ? "justify-end" : "justify-start"
                  }`}
                >
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{msg.username}</p>
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        msg.username === username
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.message}
                    </div>
                    {msg.reaction && (
                      <p className="text-sm text-gray-500 mt-1">
                        {msg.username} reacted with {msg.reaction}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 items-center"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type a message..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-blue-600"
                  >
                    <FaceSmileIcon className="h-6 w-6" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-14 right-0 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
                >
                  <PaperAirplaneIcon className="h-6 w-6 transform rotate-45" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
