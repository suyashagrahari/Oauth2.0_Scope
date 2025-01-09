const User = require("../models/User");

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

module.exports = updateDatabaseWithEvents;
