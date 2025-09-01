const { 
  addMessage, 
  getMessages, 
  editMessage, 
  deleteMessage, 
  addReaction, 
  markAsRead 
} = require("../controllers/messageController");
const router = require("express").Router();

// Basic message operations
router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);

// Advanced message features
router.put("/editmsg/", editMessage);
router.delete("/deletemsg/", deleteMessage);
router.post("/reaction/", addReaction);
router.post("/markread/", markAsRead);

module.exports = router;
