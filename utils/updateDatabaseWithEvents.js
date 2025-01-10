async function updateUserEvents(user, events) {
  try {
    // Ensure user.events is initialized as an array
    if (!Array.isArray(user.events)) {
      user.events = [];
    }

    // Create a map of existing events for faster lookup
    const existingEventsMap = new Map(
      user.events.map((event) => [event.id, event])
    );

    // Create a new array for updated events
    const updatedEvents = [];

    // Process each event from Google Calendar
    for (const newEvent of events) {
      if (!newEvent.id) {
        console.warn("Skipping event without ID:", newEvent);
        continue;
      }

      const existingEvent = existingEventsMap.get(newEvent.id);

      if (existingEvent) {
        // Update existing event while preserving any custom fields
        updatedEvents.push({
          ...existingEvent,
          ...newEvent,
          lastUpdated: new Date(),
        });
      } else {
        // Add new event
        updatedEvents.push({
          ...newEvent,
          lastUpdated: new Date(),
        });
      }
    }

    // Replace the entire events array with the new updated array
    user.events = updatedEvents;

    // Save the user document with the updated events
    const savedUser = await user.save();

    if (!savedUser) {
      throw new Error("Failed to save user document");
    }

    return savedUser;
  } catch (error) {
    console.error("Error in updateUserEvents:", error);
    throw error;
  }
}

module.exports = {
  updateUserEvents,
};
