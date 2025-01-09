const User = require("../models/User");
const { google } = require("googleapis");
const oauth2Client = require("../utils/googleClient");
const { v4: uuidv4 } = require("uuid");

exports.getAuthUrl = (req, res) => {
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
  res.json({ url });
};

exports.googleCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // Get tokens from Google
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Initialize calendar client
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Find or create user using findOneAndUpdate
    const user = await User.findOneAndUpdate(
      { googleId: data.id },
      {
        $set: {
          email: data.email,
          name: data.name,
          accessToken: tokens.access_token,
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // Set up watch for calendar changes
    await calendar.events.watch({
      calendarId: "primary",
      resource: {
        id: user.googleId + uuidv4() + user._id,
        type: "web_hook",
        address: `${process.env.WEBHOOK_URL}/api/webhook?googleId=${user.googleId}`,
        params: { ttl: 300 },
      },
    });

    // Get calendar list
    const calendarList = await calendar.calendarList.list();

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

        const userCreatedEvents = events.data.items.filter(
          (event) => !event.transparency || event.transparency !== "transparent"
        );
        allEvents.push(...userCreatedEvents);
        pageToken = events.data.nextPageToken;
      } while (pageToken);
    }

    // Prepare events data
    const eventsData = allEvents.map((event) => ({
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

    // Update events using findOneAndUpdate to avoid version conflicts
    await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { events: eventsData } },
      { new: true }
    );

    res.redirect(`http://localhost:3000/dashboard?userId=${user._id}`);
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};
