const User = require("../models/User");
const { google } = require("googleapis");
const oauth2Client = require("../utils/googleClient");
const { v4: uuidv4 } = require("uuid");
exports.getAuthUrl = (req, res) => {
  console.log("evejbvnjejvberjvnb");
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly",
    ],
    prompt: "consent",
  });
  console.log("url-->", url);
  res.json({ url });
};

exports.googleCallback = async (req, res) => {
  const { code } = req.query;
  console.log("code--->", code);
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    let user = await User.findOne({ googleId: data.id });
    if (!user) {
      user = new User({
        googleId: data.id,
        email: data.email,
        name: data.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
    } else {
      user.accessToken = tokens.access_token;
      if (tokens.refresh_token) user.refreshToken = tokens.refresh_token;
    }

    // Set up watch for calendar changes
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    console.log("caleder -->", calendar);
    await calendar.events.watch({
      calendarId: "primary",
      resource: {
        id: user.googleId + uuidv4() + user._id, // Unique channel ID
        type: "web_hook",
        address: `${process.env.WEBHOOK_URL}/api/webhook`, // Your webhook URL
        params: { ttl: 3600 }, // Time-to-live for the notification channel
      },
    });
    // Get calendar list
    const calendarList = await calendar.calendarList.list();

    console.log("calnederlist-->", calendarList);
    // Get all events from all calendars
    const allEvents = [];
    for (const cal of calendarList.data.items) {
      let pageToken = null;
      do {
        const events = await calendar.events.list({
          calendarId: cal.id,
          pageToken: pageToken,
          singleEvents: true,
          orderBy: "startTime",
        });
        // Filter out holidays and non-user-created events
        const userCreatedEvents = events.data.items.filter(
          (event) => !event.transparency || event.transparency !== "transparent"
        );
        allEvents.push(...userCreatedEvents);
        pageToken = events.data.nextPageToken;
      } while (pageToken);
    }

    // Update user's events in the database
    user.events = allEvents.map((event) => ({
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
    }));

    await user.save();

    res.redirect(`http://localhost:3000/dashboard?userId=${user._id}`);
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};
