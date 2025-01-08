const express = require("express");
const {
  getUserDataAndEvents,
  getEventsByDateRange,
} = require("../controllers/calendarController");
const router = express.Router();

router.get("/user/:userId", getUserDataAndEvents);
router.post("/user/events", getEventsByDateRange);
module.exports = router;
