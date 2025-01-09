const { google } = require("googleapis");
// Function to fetch updated events
async function fetchUpdatedEvents(auth, User) {
  const calendar = google.calendar({ version: "v3", auth });

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

  return eventsData;
  // Update events using findOneAndUpdate to avoid version conflicts
}

module.exports = { fetchUpdatedEvents };
