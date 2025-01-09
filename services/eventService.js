const mongoose = require("mongoose");
const User = require("../models/User");

const getEventsByDateRange = async (userId, start, end) => {
  try {
    // Validate and convert userId to ObjectId
    const objectId = new mongoose.Types.ObjectId(userId); // Use the 'new' keyword here
    if (!objectId) {
      throw new Error("Invalid user ID.");
    }

    // Convert start and end dates to ISODate objects
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Check if startDate and endDate are valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date range provided.");
    }

    // Aggregate query to fetch events within the date range
    const events = await User.aggregate([
      { $match: { _id: objectId } },
      { $unwind: "$events" },
      {
        $match: {
          "events.start.dateTime": { $gte: startDate },
          "events.end.dateTime": { $lte: endDate },
        },
      },
      { $sort: { "events.start.dateTime": 1 } },
      {
        $group: {
          _id: "$_id",
          events: { $push: "$events" },
        },
      },
      {
        $project: {
          _id: 0,
          events: 1,
        },
      },
    ]);

    // Return events or an empty array if none found
    return events[0]?.events || [];
  } catch (error) {
    console.error("Error in getEventsByDateRange:", error.message);
    throw new Error("Failed to fetch events by date range.");
  }
};

module.exports = {
  getEventsByDateRange,
};
