const asyncHandler = require("express-async-handler")
const Chat = require("../models/chatModel");
const User = require("../models/User");
const generateToken = require("../token")

const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        console.log("user ID param isn't sent ")
        return res.sendStatus(400)
    }

    var isChat = await Chat.find({
        isGrp: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ]

    }).populate("users", "-password")
        .populate("latestMessage")
    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "username profile email"
    });

    if (isChat.length > 0) {
        res.send(isChat[0])
    }
    else {
        var chatData = {
            chatName: "sender",
            isGrp: false,
            users: [req.user._id, userId],
        };
        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "-password"
            );
            res.status(200).send(FullChat)
        }
        catch (error) {
            res.status(400);
            throw new Error(error.message)
        }
    }
})

const fetchChat = asyncHandler(async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("admin", "-password")
            .populate("lastMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "username profile email"
                });
                res.status(200).send(results);
            })
    }
    catch (error) {
        res.status(400);
        throw new Error(error.message)

    }
})
const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please fill all the fields" })
    }
    var users = JSON.parse(req.body.users)
    if (users.length < 2) {
        return res
            .status(400)
            .send("MOre than 2 users are required to start a group chat")
    }
    users.push(req.user);
    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGrp: true,
            admin: req.user,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")

        res.status(200).json(fullGroupChat)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})
const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName
        },
        {
            new: true
        }

    )
        .populate("users", "-password")
        .populate("admin", "-password")

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat not found");
    }
    else {
        res.json(updatedChat)
    }

})
const addtogroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(chatId, {
        $push: { users: userId },

    }, {
        new: true,
    }
    ).populate("users", "-password")
        .populate("admin", "-password")
    if (!added) {
        res.status(404);
        throw new Error("Chat not found");
    }
    else {
        res.json(added);
    }

})

const removefrmgroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(chatId, {
        $pull: { users: userId },

    }, {
        new: true,
    }
    ).populate("users", "-password")
        .populate("admin", "-password")
    if (!removed) {
        res.status(404);
        throw new Error("Chat not found");
    }
    else {
        res.json(removed);
    }
})
module.exports = { accessChat, fetchChat, createGroupChat, renameGroup, addtogroup, removefrmgroup }