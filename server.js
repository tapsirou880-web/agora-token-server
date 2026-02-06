const express = require("express");
const cors = require("cors");
const { RtcTokenBuilder, RtcRole } = require("agora-token");

const app = express();
app.use(cors());

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

if (!APP_ID || !APP_CERTIFICATE) {
  console.error("APP_ID ou APP_CERTIFICATE manquant");
  process.exit(1);
}

app.get("/token", (req, res) => {
  const channelName = req.query.channel;
  const uid = req.query.uid ? Number(req.query.uid) : 0;

  if (!channelName) {
    return res.status(400).json({ error: "channel requis" });
  }

  const role = RtcRole.PUBLISHER;
  const expireTime = 24 * 3600;
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );

  console.log("TOKEN LENGTH =", token.length);

  res.json({
    success: true,
    token, // ✅ TOKEN BRUT
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agora token server running on port ${PORT}`);
});
