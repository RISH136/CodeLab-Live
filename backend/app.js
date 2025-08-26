import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connect from "./db/db.js";
import userRouter from "./routers/user.router.js";
import projectRouter from "./routers/project.router.js"
import aiRoutes from './routers/ai.routes.js';
import cookieParser from "cookie-parser";


// Load environment variables first
dotenv.config();
const app = express();



connect();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/users',userRouter);
app.use('/projects',projectRouter);
app.use('/ai',aiRoutes);






export default app;