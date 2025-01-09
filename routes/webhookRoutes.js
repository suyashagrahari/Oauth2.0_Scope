const express = require("express");
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const router = express.Router();

// Function to create a new OAuth2Client with user's tokens
function createOAuth2Client(user) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
  });

  return oauth2Client;
}

// Function to fetch updated events
async function fetchUpdatedEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items;
}

// Function to update user's events in the database
async function updateUserEvents(user, events) {
  for (const event of events) {
    const existingEventIndex = user.events.findIndex((e) => e.id === event.id);

    if (existingEventIndex !== -1) {
      // Update existing event
      user.events[existingEventIndex] = {
        ...user.events[existingEventIndex],
        ...event,
      };
    } else {
      // Add new event
      user.events.push(event);
    }
  }

  await user.save();
}

// Webhook endpoint
router.post("/webhook", async (req, res) => {
  try {
    console.log("Webhook payload:", req.body);
    const { id } = req.body;

    // Find the user based on the resourceId (which should be the user's Google ID)
    const user = await User.findOne({ _id: id });

    if (!user) {
      console.error("User not found for resourceId:", resourceId);
      return res.status(404).send("User not found");
    }

    // Create OAuth2Client with user's tokens
    const oauth2Client = createOAuth2Client(user);

    // Fetch updated events
    const updatedEvents = await fetchUpdatedEvents(oauth2Client);
    console.log("Updated events:", updatedEvents);

    // Update user's events in the database
    await updateUserEvents(user, updatedEvents);

    res.status(200).send("Notification processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Error processing notification");
  }
});

module.exports = router;
