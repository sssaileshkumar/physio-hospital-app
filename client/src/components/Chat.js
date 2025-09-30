
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const Chat = ({ user }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch chat partners
  useEffect(() => {
    const fetchChatPartners = async () => {
      try {
        if (user.role === 'admin') {
          // Admin can chat with all patients
          const response = await axios.get('/videos/chat-users');
          setAvailableUsers(response.data);
        } else {
          // Patient chats with admin
          const response = await axios.get('/videos/admin');
          setChatPartner(response.data);
          setSelectedUserId(response.data._id);
        }
      } catch (error) {
        console.error('Error fetching chat partners:', error);
      }
    };

    fetchChatPartners();
  }, [user.role]);

  // Initialize socket connection
  useEffect(() => {
    //const newSocket = io('http://localhost:5000');
    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);

    // Join user's room
    newSocket.emit('join-room', { userId: user.id, role: user.role });

    // Connection status
    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Load previous messages
    newSocket.on('load-messages', (loadedMessages) => {
      const formattedMessages = loadedMessages.map(msg => ({
        _id: msg._id,
        sender: msg.sender,
        recipient: msg.recipient,
        message: msg.message,
        timestamp: new Date(msg.createdAt),
        isOwn: msg.sender._id === user.id
      }));
      setMessages(formattedMessages);
    });

    // Listen for incoming messages
    newSocket.on('receive-message', (data) => {
      setMessages(prev => [...prev, {
        _id: data._id,
        sender: data.sender,
        recipient: data.recipient,
        message: data.message,
        timestamp: new Date(data.createdAt),
        isOwn: false
      }]);
    });

    // Listen for sent message confirmation
    newSocket.on('message-sent', (data) => {
      // Message already added optimistically, just update with real ID
      setMessages(prev => prev.map(msg => 
        msg.tempId === data.tempId ? {
          ...msg,
          _id: data._id,
          timestamp: new Date(data.createdAt)
        } : msg
      ));
    });

    newSocket.on('message-error', (error) => {
      alert('Error sending message: ' + error.error);
    });

    return () => {
      newSocket.close();
    };
  }, [user.id, user.role]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle user selection for admin
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    const selected = availableUsers.find(u => u._id === userId);
    setChatPartner(selected);
    
    // Filter messages for this conversation
    const filteredMessages = messages.filter(msg => 
      (msg.sender._id === user.id && msg.recipient._id === userId) ||
      (msg.sender._id === userId && msg.recipient._id === user.id)
    );
    // Note: In a production app, you'd reload messages from server here
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !selectedUserId) return;

    const tempId = Date.now();
    const messageData = {
      tempId,
      senderId: user.id,
      recipientId: selectedUserId,
      message: newMessage,
      timestamp: new Date()
    };

    // Add optimistically to UI
    setMessages(prev => [...prev, {
      tempId,
      sender: { _id: user.id, name: user.name },
      recipient: { _id: selectedUserId, name: chatPartner?.name },
      message: newMessage,
      timestamp: new Date(),
      isOwn: true
    }]);

    // Send via socket
    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter messages for current conversation
  const currentMessages = selectedUserId ? 
    messages.filter(msg => 
      (msg.sender._id === user.id && msg.recipient._id === selectedUserId) ||
      (msg.sender._id === selectedUserId && msg.recipient._id === user.id)
    ) : [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h2>Chat</h2>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          fontSize: '14px',
          color: isConnected ? '#28a745' : '#dc3545'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#28a745' : '#dc3545',
            marginRight: '5px'
          }}></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '500px' }}>
        
        {/* User List - Only show for admin */}
        {user.role === 'admin' && (
          <div style={{ 
            width: '250px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: '#f8f9fa'
          }}>
            <h4 style={{ marginTop: 0 }}>Patients</h4>
            {availableUsers.map(u => (
              <div
                key={u._id}
                onClick={() => handleUserSelect(u._id)}
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedUserId === u._id ? '#007bff' : 'transparent',
                  color: selectedUserId === u._id ? 'white' : '#333',
                  marginBottom: '5px'
                }}
              >
                {u.name}
              </div>
            ))}
          </div>
        )}

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Chat Header */}
          <div style={{ 
            padding: '15px', 
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px 8px 0 0'
          }}>
            <h4 style={{ margin: 0 }}>
              {chatPartner ? `Chat with ${chatPartner.name}` : 'Select a user to chat'}
            </h4>
          </div>

          {/* Messages Container */}
          <div style={{
            flex: 1,
            padding: '15px',
            overflowY: 'auto',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderTop: 'none',
            borderBottom: 'none'
          }}>
            {!selectedUserId ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                paddingTop: '50px' 
              }}>
                <p>{user.role === 'admin' ? 'Select a patient to start chatting' : 'Loading...'}</p>
              </div>
            ) : currentMessages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                paddingTop: '50px' 
              }}>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {currentMessages.map((msg, index) => (
                  <div
                    key={msg._id || msg.tempId || index}
                    style={{
                      display: 'flex',
                      justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
                      marginBottom: '15px'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '10px 15px',
                        borderRadius: '18px',
                        backgroundColor: msg.isOwn ? '#007bff' : '#e9ecef',
                        color: msg.isOwn ? 'white' : '#333'
                      }}
                    >
                      <div>{msg.message}</div>
                      <div style={{ 
                        fontSize: '11px', 
                        marginTop: '5px', 
                        opacity: 0.7,
                        textAlign: 'right'
                      }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '0 0 8px 8px',
            border: '1px solid #ddd'
          }}>
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={!isConnected || !selectedUserId}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '25px',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                disabled={!isConnected || !newMessage.trim() || !selectedUserId}
                style={{
                  padding: '12px 20px',
                  backgroundColor: (!isConnected || !newMessage.trim() || !selectedUserId) ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: (!isConnected || !newMessage.trim() || !selectedUserId) ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;