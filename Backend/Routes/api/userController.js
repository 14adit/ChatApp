import { generateToken } from "../../lib/util.js"
import User from "../../models/User.js"
import cloudinary from "../../lib/cloudinary.js"
import express from "express"
import protectRoute from "../../middleware/auth.js"

const router = express.Router()


// Signup a new user
router.post('/signup', async (req, res)=>{
    const {fullname, email, password, bio} = req.body
    try{
        if(!fullname || !email || !password || !bio){
            return res.json({success: false, message: "Missing Details"})
        }
        const user = await User.findOne({email})

        if(user){
            return res.json({success: false, message: "Account already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({fullname, email, password: hashedPassword, bio})

        const token = generateToken(newUser._id)
        res.json({success: true, userData: newUser, token, message: "Accounted created successfully"})

    }catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
})

// Controller to login a user
router.post('/login', async (req, res)=>{
    try{
        const {email, password} = req.body
        const userData = await User.findOne({email})

        const isPasswordCorrect = await bcrypt.compare(password, userData.password)

        if(!isPasswordCorrect)
        {
            return res.json({success: false, message: "Invalid credentials"})
        }

        const token = generateToken(userData._id)
        res.json({success: true, userData, token, message: "Login successful"})

    } catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
})

// Controller to check if user is authenticated
router.get('/check', protectRoute, (req, res)=>{
    res.json({success: true, user: req.user})
})

// Controller to update user profile details
router.put('/update', protectRoute, async(req, res)=>{
    try{
        const {profilePic, fullname, bio} = req.body

        const userId = req.user._id
        let updatedUser;

        if(!profilePic){
          updatedUser = await User.findByIdAndUpdate(userId, {fullname, bio}, {new: true})
        } else{
            const upload = await cloudinary.uploader.upload(profilePic)
            updatedUser = await User.findByIdAndUpdate(userId, {profilePic: upload.secure_url, fullname, bio}, {new: true})
        }
        res.json({success: true, user: updatedUser})
    }catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
})

export default router