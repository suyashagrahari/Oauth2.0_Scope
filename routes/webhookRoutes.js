const express = require("express");
const User = require("../models/User");
const { fetchUpdatedEvents } = require("../utils/fetchUpdatedEvents");
const { updateUserEvents } = require("../utils/updateDatabaseWithEvents");
const { createOAuth2Client } = require("../services/oauth2ClientService");
const router = express.Router();

// Webhook endpoint
router.post("/webhook", async (req, res) => {
  try {
    const googleId = req.query.googleId;

    const user = await User.findOne({ googleId: googleId });
    if (!user) {
      console.error("User not found for resourceId:", resourceId);
      return res.status(404).send("User not found");
    }
    const oauth2Client = createOAuth2Client(user);
    const updatedEvents = await fetchUpdatedEvents(oauth2Client, user);

    await updateUserEvents(user, updatedEvents);

    res.status(200).send("Notification processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Error processing notification");
  }
});

module.exports = router;
