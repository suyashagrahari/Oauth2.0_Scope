const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
dotenv.config();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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

module.exports = fetchUpdatedEvents;
