const { 
  createGroup, 
  getGroups, 
  addMember, 
  removeMember, 
  updateGroupRole, 
  generateInviteLink 
} = require("../controllers/groupController");
const router = require("express").Router();

// Group management
router.post("/create", createGroup);
router.get("/user/:userId", getGroups);
router.post("/addmember", addMember);
router.post("/removemember", removeMember);
router.put("/updaterole", updateGroupRole);
router.post("/invitelink", generateInviteLink);

module.exports = router;
