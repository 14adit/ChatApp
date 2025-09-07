import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import connectDB from "./lib/db.js"
import router from "./Routes/api/userController.js"
import messageRouter from "./Routes/api/messageController.js"
import { Server } from "socket.io"

// Create Express app and HTTP server
const app = express()
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
})

// Store online users
export const userSocketMap = {}; // {userId: socketId}

// socket.io connection handler
io.on("connection", (Socket)=>{
    const userId = Socket.handshake.query.userId
    console.log("User Connected", userId)

    if(userId){
        userSocketMap[userId] = Socket.id
    }

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    Socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}))
// app.use(cors())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "token"] // Add 'token' here
}));

// Route Setup
app.use("/api/status", (req, res)=> res.send("Server is live"))
app.use("/api/auth",router)
app.use("/api/messages", messageRouter)

// Connect to MongoDb
await connectDB()

//If and only if the project is not deployed it will open on the local server with 5000 port
if(process.env.NODE_ENV !== "production"){
    const PORT = process.env.PORT || 5000
    server.listen(PORT, ()=>console.log("Server is running on PORT: "+ PORT))
}

//Export server for Vercel
export default server