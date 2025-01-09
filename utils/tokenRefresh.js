const { OAuth2Client } = require("google-auth-library");

async function refreshAccessToken(user) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: user.refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await user.updateAccessToken(credentials.access_token);
    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

module.exports = { refreshAccessToken };
