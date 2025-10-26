// backend/src/index.js
import { connect } from "mongoose";
import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./dbConfig/index.js";

dotenv.config()

connectDB()
.then(()=>{
    // For local development
    if (process.env.NODE_ENV !== "production") {
        app.listen(process.env.PORT || 4500, '0.0.0.0',()=>{
            console.log(`Server is listening on http://localhost:${process.env.PORT || 4500}`);
        })
    }
})
.catch((error)=>{
    console.log('MongoDB connection Failed',error)
})

// Export for Vercel serverless function
export default app