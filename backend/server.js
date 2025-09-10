import http from "http";
import app from "./app.js";
import 'dotenv/config';
import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import {generateResult, generateChatResult, generateCodeResult} from "./services/ai.service.js"


const PORT=process.env.PORT || 3000;




const server=http.createServer(app);
const io=new Server(server,{
    cors:{
        origin: '*',
        credentials: true,
    }
});

io.use(async (socket,next)=>{
    try {

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[ 1 ];
        if (!token) {
            return next(new Error('Authentication error'))
        }

        const projectId = socket.handshake.query.projectId;
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }


        socket.project = await projectModel.findById(projectId);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'))
        }


        socket.user = decoded;

        next();

    } catch (error) {
        next(error)
    }
})


io.on('connection', (socket)=>{
    console.log("User Connected",socket.id);
    socket.roomId = socket.project._id.toString()


    socket.join(socket.roomId);

    socket.on('project-message',async (data) => {
        try {
            const message = data.message;

            const aiIsPresentInMessage = message.includes('@ai');
            const aiCodeIsPresentInMessage = message.includes('@ai_code');

            // If message triggers code mode (@ai_code)
            if (aiCodeIsPresentInMessage) {
                const prompt = message.replace('@ai_code', '').trim();
                const result = await generateCodeResult(prompt);
                io.to(socket.roomId).emit('project-message', {
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
                return
            }

            // If message contains @ai (chat mode - no files)
            if (aiIsPresentInMessage) {
                const prompt = message.replace('@ai', '').trim();
                const result = await generateChatResult(prompt);
                io.to(socket.roomId).emit('project-message', {
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
                return
            }

            socket.broadcast.to(socket.roomId).emit('project-message', data)
        } catch (error) {
            console.error('Error in project-message handler:', error);
            // Send error message to the user
            io.to(socket.roomId).emit('project-message', {
                message: `Sorry, I encountered an error: ${error.message}`,
                sender: {
                    _id: 'ai',
                    email: 'AI'
                }
            })
        }
    })

    socket.on('event',()=>{

    })

    socket.on('disconnect',()=>{
        socket.leave(socket.roomId);
        console.log('user Disconnected');
    })

})




server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});