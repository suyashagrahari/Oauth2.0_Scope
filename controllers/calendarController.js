const User = require("../models/User");
const {
  getEventsByDateRange: fetchEventsByDateRange,
} = require("../services/eventService");

exports.getUserDataAndEvents = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      profile: {
        name: user.name,
        email: user.email,
      },
      events: user.events,
    });
  } catch (error) {
    console.error("Error fetching user data and calendar events:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch user data and calendar events" });
  }
};

exports.getEventsByDateRange = async (req, res) => {
  try {
    const userId = req.body.userId; // Extract userId from URL params
    const { startDate, endDate } = req.body; // Extract startDate and endDate from the request body

    // Validate startDate and endDate
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Both startDate and endDate are required in the request body.",
      });
    }

    // Fetch events by date range
    const events = await fetchEventsByDateRange(userId, startDate, endDate);

    // If no events found
    if (events.length === 0) {
      return res
        .status(404)
        .json({ error: "No events found for the given date range." });
    }

    // Respond with events
    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events by date range:", error);
    res.status(500).json({ error: "Failed to fetch events by date range." });
  }
};
