const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
dotenv.config();
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

module.exports = oauth2Client;
