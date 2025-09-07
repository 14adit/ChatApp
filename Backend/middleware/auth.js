import User from "../models/User.js"
import jwt from "jsonwebtoken"

// Middleware to protect routes. If the token is valid, it proceeds the controller function by calling next()
const protectRoute = async (req, res, next)=>{
    try{
        //const token = req.headers.token
        //console.log(req.headers)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
           return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId).select("-password")

        if(!user) return res.json({success: false, message: "User not found"})

        req.user = user //It will add the user data in req and we can access the data in controller function
        next()
    }catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

export default protectRoute