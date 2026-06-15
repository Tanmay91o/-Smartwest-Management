import express from "express"
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './config/db.js'
import userRouter from "./routes/userRoute.js"
import incomeRouter from "./routes/incomeRoute.js"
import expenseRouter from "./routes/expenseRoute.js"
import dashboardRouter from "./routes/dashboardRoute.js"

const app = express()
const port = 4000

//middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//db
connectDB();

//routes
app.use("/api/user", userRouter)
app.use("/api/income", incomeRouter)
app.use("/api/expense", expenseRouter)
app.use("/api/dashboard", dashboardRouter)

app.get('/', (req, res) => {
    res.send("api working")
})

app.listen(port, () => {
    console.log(`server started on http://localhost:${port}`);
})