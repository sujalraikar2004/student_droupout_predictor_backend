import express from 'express';


import cors from 'cors'

const app = express();




app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://student-droupout-predictor.vercel.app'
  ], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.get('/',(req,res)=>{
    res.send("these is trial route")
})






import facultyRouter from './routes/faculty.routes.js'
import studentRouter from './routes/student.routes.js'

app.use("/api/v1/faculty", facultyRouter)
app.use("/api/vi/student", studentRouter)






export default  app