const { 
  createStory, 
  getStories, 
  getAllStories, 
  viewStory, 
  replyToStory, 
  deleteStory 
} = require("../controllers/storyController");
const router = require("express").Router();

// Story management
router.post("/create", createStory);
router.get("/user/:userId", getStories);
router.get("/all/:userId", getAllStories);
router.post("/view", viewStory);
router.post("/reply", replyToStory);
router.delete("/delete", deleteStory);

module.exports = router;
