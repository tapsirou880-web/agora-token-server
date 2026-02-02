const express = require("express");
const cors = require("cors");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const app = express();
app.use(cors());

// ⚠️ REMPLACE PAR TES INFOS AGORA
const APP_ID = "1f332d4a87c940a090e688a209548579";
const APP_CERTIFICATE = "67157947ac094269a1982b9ef191323b";

app.get("/rtc-token", (req, res) => {
  const channelName = req.query.channel;
  const uid = 0;

  if (!channelName) {
    return res.status(400).json({ error: "channel is required" });
  }

  const expirationTimeInSeconds = 86400; // 24 heures
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );

  res.json({ token });
});

app.listen(3000, () => {
  console.log("✅ Serveur Agora Token lancé sur le port 3000");
});
