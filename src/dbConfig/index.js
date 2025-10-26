import mongoose from "mongoose";

const connectDB= async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log('mongoDB connected successfully');
    } catch (error) {
        console.log('mongoDB connection failed',error)
        process.exit(1)
    }
}

export default connectDB