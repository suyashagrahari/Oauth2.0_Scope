const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  kind: String,
  etag: String,
  id: String,
  status: String,
  htmlLink: String,
  created: Date,
  updated: Date,
  summary: String,
  description: String,
  location: String,
  creator: {
    email: String,
    self: Boolean,
  },
  organizer: {
    email: String,
    self: Boolean,
  },
  start: {
    dateTime: Date,
    timeZone: String,
  },
  end: {
    dateTime: Date,
    timeZone: String,
  },
  transparency: String,
  visibility: String,
  iCalUID: String,
  sequence: Number,
  attendees: [
    {
      email: String,
      responseStatus: String,
    },
  ],
  guestsCanInviteOthers: Boolean,
  reminders: {
    useDefault: Boolean,
  },
  source: {
    url: String,
    title: String,
  },
  eventType: String,
  hangoutLink: String,
  conferenceData: {
    entryPoints: [
      {
        entryPointType: String,
        uri: String,
        label: String,
      },
    ],
    conferenceSolution: {
      key: {
        type: mongoose.Schema.Types.Mixed,
      },
      name: String,
      iconUri: String,
    },
    conferenceId: String,
  },
});

const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  accessToken: String,
  refreshToken: String,
  events: [eventSchema],
});

userSchema.index({ "events.start.dateTime": 1 });
userSchema.index({ "events.end.dateTime": 1 });

userSchema.statics.convertToObjectId = function (id) {
  return mongoose.Types.ObjectId(id);
};

module.exports = mongoose.model("User", userSchema);
