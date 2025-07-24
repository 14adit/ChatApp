import mongoose from "mongoose";

const connectDB = async ()=>{
    try{
       await mongoose.connect(`${process.env.mongodbURI}/chat-app`,{
        useNewUrlParser: true,
       })
       .then(()=>console.log("Successfully Connected to mongoDB"))
    } catch(error){
        console.error(error.message)
        process.exit(1)
    }
}

export default connectDB