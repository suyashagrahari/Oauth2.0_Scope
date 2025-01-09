// In your main server file or a new routes file (e.g., webhookRoutes.js)
const express = require("express");
const User = require("../models/User"); // Adjust the path as necessary
const { google } = require("googleapis");
const router = express.Router();

const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
dotenv.config();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  access_token:
    "ya29.a0ARW5m74BRby51VqqCPhLvF6b7JwZ2fgd2218x_8l-1Ix2-wCfqlNvg0gjan8R_kBMP32PPtFplFuAtOQHDWUJM93SXRJWiZNzbFQiKGlvoJMJOW3wOXeTPU4fEY0-ZDrackAgXBlca0nhRDEuZ1O9LpG2z0IMnQKGQbAfHibaCgYKAQISARMSFQHGX2Mi8mHU4qLV6c7zDt25roBvQQ0175",
  refresh_token:
    "1//0g7sR5FuAr31sCgYIARAAGBASNwF-L9IrpsPALROoF_QymLzezb0ybo9kdpKZdJbdWmmkrs1FqbQpEMjllXERoUqBSL0MH0ztWGU",
});

async function fetchUpdatedEvents(resourceId) {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Fetch events using the resource ID or other identifiers as needed
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(), // Get events from now onwards
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items; // Return the list of updated events
}

async function updateDatabaseWithEvents(events) {
  for (const event of events) {
    let userEvent = await User.findOne({ "events.id": event.id }); // Assuming you have a User model with an embedded events array

    if (!userEvent) {
      userEvent = new User({
        googleId: event.creator.email, // Adjust as necessary
        email: event.creator.email,
        name: event.summary,
        events: [
          {
            id: event.id,
            summary: event.summary,
            start: event.start,
            end: event.end,
            // Add other fields as necessary
          },
        ],
      });
    } else {
      // Update existing event or add new one if it doesn't exist
      const existingEventIndex = userEvent.events.findIndex(
        (e) => e.id === event.id
      );
      if (existingEventIndex !== -1) {
        userEvent.events[existingEventIndex] = {
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          // Update other fields as necessary
        };
      } else {
        userEvent.events.push({
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          // Add other fields as necessary
        });
      }
    }

    await userEvent.save();
  }
}

// webhookRoutes.js
router.post("/webhook", async (req, res) => {
  console.log("Webhook received:", req.body); // Log incoming webhook data

  try {
    const resourceId = req.body.resourceId; // Extract resource ID from the notification

    // Fetch updated events based on resourceId
    const updatedEvents = await fetchUpdatedEvents(resourceId);

    // Update user's events in the database
    for (const event of updatedEvents) {
      let userEvent = await User.findOne({ "events.id": event.id }); // Check if event already exists

      if (!userEvent) {
        // If event does not exist
        const userId = req.body.userId; // Assuming you pass userId in the request body
        const user = await User.findById(userId); // Find user by ID

        if (user) {
          // If user found
          user.events.push({
            kind: event.kind,
            etag: event.etag,
            id: event.id,
            status: event.status,
            htmlLink: event.htmlLink,
            created: event.created,
            updated: event.updated,
            summary: event.summary,
            description: event.description,
            location: event.location,
            creator: event.creator,
            organizer: event.organizer,
            start: event.start,
            end: event.end,
            transparency: event.transparency,
            visibility: event.visibility,
            iCalUID: event.iCalUID,
            sequence: event.sequence,
            attendees: event.attendees,
            guestsCanInviteOthers: event.guestsCanInviteOthers,
            reminders: event.reminders,
            source: event.source,
            eventType: event.eventType,
            hangoutLink: event.hangoutLink,
            conferenceData: event.conferenceData,
          });

          await user.save(); // Save updated user with new event
        }
      }
    }

    res.status(200).send("Notification processed");
  } catch (error) {
    console.error("Error processing notification:", error);
    res.status(500).send("Error processing notification");
  }
});

module.exports = router;
