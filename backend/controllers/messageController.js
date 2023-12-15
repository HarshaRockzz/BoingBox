const expressAsyncHandler = require('express-async-handler')
const Message = require('../models/msgmodel');
const User = require('../models/User');
const chat = require('../models/chatModel');

const sendMsg = expressAsyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    var newmessage = {
        sender: req.user._id,
        content: content,
        chat: chatId
    };
    try {
        var message = await Message.create(newmessage);

        message = await message.populate("sender", "username profile").execPopulate();
        message = await message.populate("chat").execPopulate();
        message = await User.populate(message, {
            path: "chat.users",
            select: "username profile pic"
        })

        await chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message,
        });
        res.json(message)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
        console.log(error)
    }
}
)
const allMessages = expressAsyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId }).populate("sender", "username profile email").populate("chat")

        res.json(messages)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})


module.exports = { sendMsg, allMessages }