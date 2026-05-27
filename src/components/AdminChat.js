import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import API_URL from '../utils/api';

const AdminChat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(() => {
    // Restore selected chat from sessionStorage if available
    try {
      const saved = sessionStorage.getItem('adminSelectedChat');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  });
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Save selected chat to sessionStorage when it changes (for tab switching persistence)
  useEffect(() => {
    try {
      if (selectedChat) {
        sessionStorage.setItem('adminSelectedChat', JSON.stringify(selectedChat));
      } else {
        sessionStorage.removeItem('adminSelectedChat');
      }
    } catch (_) {}
  }, [selectedChat]);

  useEffect(() => {
    fetchChats();
    pollIntervalRef.current = setInterval(fetchChats, 3000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/chat/all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('Session expired. Please login again.');
        } else {
          setError('Failed to fetch chats');
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setChats(Array.isArray(data) ? data : []);
      setError('');
      
      // Don't update selectedChat here - it should only be updated by user interaction
      // This prevents the selected chat from being reset during polling or background updates
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Network error. Please check your connection.');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: selectedChat.userId, sender: 'admin', text: messageText })
      });
      
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      
      await fetchChats();
      setError('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setNewMessage(messageText);
    }
  };

  const markAsRead = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/chat/read/${userId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Don't call fetchChats here - it will be called by the polling effect
      // This prevents the selectedChat from being reset during the click
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] bg-white rounded-lg shadow-lg items-center justify-center">
        <p className="text-gray-500">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[600px] md:h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* User List - Full screen on mobile, 1/3 on desktop */}
      <div className={`${selectedChat ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r overflow-y-auto`}>
        <div className="p-4 bg-blue-600 text-white font-bold sticky top-0 z-10">User Chats</div>
        {error && <p className="text-red-500 text-sm p-4">{error}</p>}
        {chats.length === 0 ? (
          <p className="text-gray-500 text-center p-4">No chats yet</p>
        ) : (
          chats.map(chat => (
            <div
              key={chat.userId}
              onClick={() => { setSelectedChat(chat); markAsRead(chat.userId); }}
              className={`p-3 md:p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat?.userId === chat.userId ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm md:text-base truncate">{chat.username}</p>
                    {chat.userType === 'seller' && (
                      <span className="bg-green-100 text-green-800 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-semibold whitespace-nowrap">Seller</span>
                    )}
                    {chat.userType === 'approval_pending' && (
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-semibold whitespace-nowrap">Pending</span>
                    )}
                    {chat.userType === 'buyer' && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-semibold whitespace-nowrap">Buyer</span>
                    )}
                  </div>
                  {chat.propertyId && chat.userType === 'seller' && (
                    <p className="text-[10px] md:text-xs text-blue-600 font-semibold mt-1">ID: {chat.propertyId}</p>
                  )}
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1">📱 {chat.mobileNumber}</p>
                  <p className="text-xs md:text-sm text-gray-600 truncate mt-1">
                    {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1]?.text : 'No messages'}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] md:text-xs rounded-full px-1.5 md:px-2 py-0.5 md:py-1 flex-shrink-0">{chat.unreadCount}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Window - Full screen on mobile when chat selected */}
      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col w-full`}>
        {selectedChat ? (
          <>
            {/* Header with back button on mobile */}
            <div className="p-3 md:p-4 bg-blue-600 text-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                {/* Back button - mobile only */}
                <button 
                  onClick={() => setSelectedChat(null)} 
                  className="md:hidden text-white hover:bg-blue-700 p-2 rounded-full transition"
                >
                  ←
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base md:text-lg truncate">{selectedChat.username}</p>
                    {selectedChat.userType === 'seller' && (
                      <span className="bg-green-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap">Seller</span>
                    )}
                    {selectedChat.userType === 'approval_pending' && (
                      <span className="bg-yellow-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap">Pending</span>
                    )}
                    {selectedChat.userType === 'buyer' && (
                      <span className="bg-blue-400 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap">Buyer</span>
                    )}
                  </div>
                  <p className="text-[10px] md:text-xs mt-1">📱 {selectedChat.mobileNumber}</p>
                  {selectedChat.propertyId && selectedChat.userType === 'seller' && (
                    <p className="text-[10px] md:text-xs mt-1 bg-white text-blue-600 px-2 py-0.5 md:py-1 rounded inline-block font-semibold">ID: {selectedChat.propertyId}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Messages - WhatsApp style */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 bg-gray-50">
              {selectedChat.messages.length === 0 ? (
                <p className="text-gray-500 text-center mt-4 text-sm">No messages yet</p>
              ) : (
                selectedChat.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-lg shadow-sm ${msg.sender === 'admin' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                      <p className="text-sm break-words">{msg.text}</p>
                      <span className={`text-[10px] ${msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'} block text-right mt-1`}>
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input - Mobile friendly */}
            <form onSubmit={handleSendMessage} className="p-2 md:p-3 bg-white border-t flex gap-2 items-center">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border-0 bg-gray-100 p-2 md:p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button 
                type="submit" 
                className="bg-blue-600 text-white p-2 md:p-3 rounded-full hover:bg-blue-700 transition flex-shrink-0 disabled:opacity-50"
                disabled={!newMessage.trim()}
              >
                <FaPaperPlane className="text-sm md:text-base" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center">
            <div>
              <FaPaperPlane className="text-4xl md:text-6xl mx-auto mb-4 opacity-20" />
              <p className="text-sm md:text-base">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
