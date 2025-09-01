const { 
  initiateCall, 
  joinCall, 
  leaveCall, 
  updateCallSettings, 
  updateParticipantStatus, 
  getCallHistory, 
  endCall 
} = require("../controllers/callController");
const router = require("express").Router();

// Call management routes
router.post("/initiate", initiateCall);
router.post("/join", joinCall);
router.post("/leave", leaveCall);
router.post("/settings", updateCallSettings);
router.post("/participant-status", updateParticipantStatus);
router.get("/history/:userId/:page?/:limit?", getCallHistory);
router.post("/end", endCall);

module.exports = router;
