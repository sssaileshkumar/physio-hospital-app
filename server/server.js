/*
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Middleware

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://physio-frontend.onrender.com" // YOUR ACTUAL FRONTEND URL
  ],
  credentials: true
}));

// Also update Socket.io CORS:
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://physio-frontend.onrender.com" // YOUR ACTUAL FRONTEND URL
    ],
    methods: ["GET", "POST"]
  }
});
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/physio-app')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/modules', require('./routes/modules'));

// Socket.io for chat

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their own room
  socket.on('join-room', async (userData) => {
    socket.userId = userData.userId;
    socket.userRole = userData.role;
    socket.join(userData.userId);
    console.log(`User ${userData.userId} (${userData.role}) joined room`);
    
    // Load previous messages for this user
    try {
      let messages;
      if (userData.role === 'admin') {
        // Admin sees all messages
        messages = await Message.find()
          .populate('sender', 'name role')
          .populate('recipient', 'name role')
          .sort({ createdAt: 1 })
          .limit(50);
      } else {
        // Patient sees only messages between them and admin
        const adminUsers = await require('./models/User').find({ role: 'admin' });
        const adminIds = adminUsers.map(admin => admin._id);
        
        messages = await Message.find({
          $or: [
            { sender: userData.userId, recipient: { $in: adminIds } },
            { sender: { $in: adminIds }, recipient: userData.userId }
          ]
        })
        .populate('sender', 'name role')
        .populate('recipient', 'name role')
        .sort({ createdAt: 1 })
        .limit(50);
      }
      
      socket.emit('load-messages', messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  });
  
  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      // Save message to database
      const message = new Message({
        sender: data.senderId,
        recipient: data.recipientId,
        message: data.message
      });
      
      await message.save();
      
      // Populate sender and recipient info
      await message.populate('sender', 'name role');
      await message.populate('recipient', 'name role');
      
      // Send to recipient's room
      socket.to(data.recipientId).emit('receive-message', {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        message: message.message,
        createdAt: message.createdAt
      });
      
      // Send confirmation back to sender
      socket.emit('message-sent', {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        message: message.message,
        createdAt: message.createdAt
      });
      
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
*/

//deepseek
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://physio-frontend.onrender.com"
  ],
  credentials: true
}));

// Socket.io CORS configuration
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://physio-frontend.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());

// Serve static files with proper MIME types and CORS - FIXED
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, filePath) => {
    // Set proper MIME types for videos
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    } else if (filePath.endsWith('.ogg')) {
      res.setHeader('Content-Type', 'video/ogg');
    } else if (filePath.endsWith('.mov')) {
      res.setHeader('Content-Type', 'video/quicktime');
    } else if (filePath.endsWith('.avi')) {
      res.setHeader('Content-Type', 'video/x-msvideo');
    }
    
    // Allow CORS for all origins (important for browser extensions)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/physio-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Physio Backend Server is running!',
    timestamp: new Date().toISOString(),
    uploadsDirectory: fs.existsSync(uploadsDir) ? 'Exists' : 'Missing'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/modules', require('./routes/modules'));

// Socket.io for chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their own room
  socket.on('join-room', async (userData) => {
    socket.userId = userData.userId;
    socket.userRole = userData.role;
    socket.join(userData.userId);
    console.log(`User ${userData.userId} (${userData.role}) joined room`);
    
    // Load previous messages for this user
    try {
      let messages;
      if (userData.role === 'admin') {
        // Admin sees all messages
        messages = await Message.find()
          .populate('sender', 'name role')
          .populate('recipient', 'name role')
          .sort({ createdAt: 1 })
          .limit(50);
      } else {
        // Patient sees only messages between them and admin
        const adminUsers = await require('./models/User').find({ role: 'admin' });
        const adminIds = adminUsers.map(admin => admin._id);
        
        messages = await Message.find({
          $or: [
            { sender: userData.userId, recipient: { $in: adminIds } },
            { sender: { $in: adminIds }, recipient: userData.userId }
          ]
        })
        .populate('sender', 'name role')
        .populate('recipient', 'name role')
        .sort({ createdAt: 1 })
        .limit(50);
      }
      
      socket.emit('load-messages', messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  });
  
  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      // Save message to database
      const message = new Message({
        sender: data.senderId,
        recipient: data.recipientId,
        message: data.message
      });
      
      await message.save();
      
      // Populate sender and recipient info
      await message.populate('sender', 'name role');
      await message.populate('recipient', 'name role');
      
      // Send to recipient's room
      socket.to(data.recipientId).emit('receive-message', {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        message: message.message,
        createdAt: message.createdAt
      });
      
      // Send confirmation back to sender
      socket.emit('message-sent', {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        message: message.message,
        createdAt: message.createdAt
      });
      
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));