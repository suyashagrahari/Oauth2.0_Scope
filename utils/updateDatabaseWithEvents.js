async function updateUserEvents(user, events) {
  // Get all event IDs from Google Calendar
  const googleEventIds = new Set(events.map((event) => event.id));

  // Remove events that are no longer in Google Calendar
  user.events = user.events.filter((event) => googleEventIds.has(event.id));

  // Update existing events and add new ones
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

module.exports = { updateUserEvents };
