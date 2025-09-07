import protectRoute from "../../middleware/auth.js";
import Message from "../../models/Message.js";
import User from "../../models/User.js";
import express from "express";
import cloudinary from "../../lib/cloudinary.js"
import { io, userSocketMap } from "../../server.js"

const messageRouter = express.Router()

// Get all users except login user
messageRouter.get('/users', protectRoute, async (req, res)=>{
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password") // When the id is not equal to the current user (userId), then filter all the other users

        // Count number of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user)=>{
            const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false})
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length
            }
        })
        await Promise.all(promises)
        res.json({success: true, users: filteredUsers, unseenMessages})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
})

// Get all message for selected user
messageRouter.get('/:id', protectRoute, async (req,res) =>{
    try {
        const {id : selectedUserId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId},
            ]
        })
        await Message.updateMany({senderId: selectedUserId, receiverId: myId},
            {seen: true});
            res.json({success: true, messages})
    } catch (error) {
         console.log(error.message)
         res.json({successs: false, message: error.message})
    }
})

// api to mark message as seen using message id
messageRouter.put('/mark/:id', protectRoute, async (req, res)=>{
    try {
        const { id } = req.params
        await Message.findByIdAndUpdate(id, {seen: true})
        res.json({success: true})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
})

// Send message to selected user
messageRouter.post('/send/:id', protectRoute, async (req, res)=>{
    try {
        const {text, image} = req.body
        const receiverId = req.params.id
        const senderId = req.user._id

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
            //console.log(imageUrl)
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })

        //Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId]
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.json({success: true, newMessage})

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
})

export default messageRouter