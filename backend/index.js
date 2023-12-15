const express = require("express");
const env = require("dotenv")
const userRoutes = require('./Routes/userRoutes')
const app = express()
const chatRoutes = require("./Routes/chatRoutes")
const messageRoutes = require("./Routes/messageRoutes");
const { Socket } = require("socket.io");
env.config({ path: '../.env' });
require("./db")
app.use(express.json())
app.get('/', (req, res) => {
    res.send("Fine", console.log("hi"))
})

app.use('/api/user', userRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/message", messageRoutes)

const Port = process.env.Port || 5000;
const server = app.listen(Port, console.log(`server started on port ${Port}`))

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:3000",
    }
})

io.on("connection", (socket) => {
    console.log("connected to socket.io")
    socket.on('setup', (userData) => {
        socket.join(userData._id);
        console.log(userData._id)
        socket.emit("connected")
    });
    socket.on('join chat', (room) => {
        socket.join(room)
        console.log("User joined room" + room);
    })

    socket.on('typing', (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"))

    socket.on('new message', (newmessageReceived) => {
        var chat = newmessageReceived.chat;

        if (!chat.users) return console.log("chat users isn;t defined")
        chat.users.forEach(element => {
            if (element._id === newmessageReceived.sender._id) {
                return;
            }
            socket.in(element._id).emit("message received", newmessageReceived)
        });
    })
    socket.off("setup", () => {
        console.log("User disconnected")
        socket.leave(userData._id)
    })
})