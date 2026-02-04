const express = require("express");
const cors = require("cors");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const app = express();

// ==================== CONFIGURATION ====================
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

// 🔥 VÉRIFICATION CRITIQUE AU DÉMARRAGE
if (!APP_ID || !APP_CERTIFICATE) {
  console.error("❌ ERREUR FATALE: Variables d'environnement manquantes !");
  console.error("   APP_ID:", APP_ID ? "✓ Défini" : "✗ MANQUANT");
  console.error("   APP_CERTIFICATE:", APP_CERTIFICATE ? "✓ Défini" : "✗ MANQUANT");
  console.error("   Assure-toi de les définir dans Render > Environnement");
  process.exit(1); // Arrête le serveur si les variables sont manquantes
}

console.log("✅ Configuration chargée avec succès");
console.log("   APP_ID: ✓ Présent");
console.log("   APP_CERTIFICATE: ✓ Présent");

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logging des requêtes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==================== ROUTES ====================

// Health check - Vérifie que le serveur fonctionne
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Agora Token Server",
    timestamp: new Date().toISOString(),
    config: {
      appId: APP_ID ? "✓ Défini" : "✗ Manquant",
      appCertificate: APP_CERTIFICATE ? "✓ Défini" : "✗ Manquant"
    },
    endpoints: [
      "GET /token?channel=CHANNEL_NAME&uid=USER_ID",
      "POST /token (body: {channelName: '...', uid: '...'})"
    ],
    documentation: "Utilise /token avec un nom de canal pour générer un token Agora"
  });
});

// Route pour générer un token (GET)
app.get("/token", (req, res) => {
  console.log("📡 GET Token Request:", req.query);
  
  const channelName = req.query.channel || req.query.channelName;
  const uid = parseInt(req.query.uid) || Math.floor(Math.random() * 1000000);

  if (!channelName) {
    return res.status(400).json({ 
      error: "Le nom du canal est requis",
      example: "/token?channel=ma-salle-123&uid=456",
      paramètres: {
        channel: "Nom unique de la salle (requis)",
        uid: "ID utilisateur (optionnel, généré automatiquement sinon)"
      }
    });
  }

  try {
    // Token valable 24 heures
    const expirationTimeInSeconds = 24 * 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Génération du token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER, // Permet de publier audio/vidéo
      privilegeExpiredTs
    );

    console.log("✅ Token généré avec succès:", {
      channel: channelName,
      uid: uid,
      tokenLength: token.length,
      expiresIn: expirationTimeInSeconds + " secondes"
    });

    res.json({
      success: true,
      token: token,
      appId: APP_ID,
      channel: channelName,
      uid: uid,
      role: "publisher",
      expiresIn: expirationTimeInSeconds,
      expiresAt: new Date(privilegeExpiredTs * 1000).toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Erreur lors de la génération du token:", error);
    res.status(500).json({ 
      success: false,
      error: "Échec de la génération du token",
      message: error.message,
      details: "Vérifie tes credentials Agora"
    });
  }
});

// Route pour générer un token (POST)
app.post("/token", (req, res) => {
  console.log("📡 POST Token Request:", req.body);
  
  const { channelName, uid } = req.body;
  const userUid = uid || Math.floor(Math.random() * 1000000);
  
  if (!channelName) {
    return res.status(400).json({ 
      success: false,
      error: "channelName est requis dans le corps de la requête" 
    });
  }

  try {
    const expirationTimeInSeconds = 24 * 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      parseInt(userUid),
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      token: token,
      appId: APP_ID,
      channel: channelName,
      uid: userUid,
      expiresIn: expirationTimeInSeconds,
      expiresAt: new Date(privilegeExpiredTs * 1000).toISOString()
    });

  } catch (error) {
    console.error("❌ Erreur génération token:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Route de test simple
app.get("/test", (req, res) => {
  res.json({
    message: "Serveur fonctionnel!",
    configCheck: {
      appId: APP_ID ? "OK" : "MANQUANT",
      certificate: APP_CERTIFICATE ? "OK" : "MANQUANT"
    }
  });
});

// ==================== GESTION DES ERREURS ====================
app.use((req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    availableRoutes: ["/", "/token", "/test"]
  });
});

app.use((err, req, res, next) => {
  console.error("🔥 Erreur serveur:", err);
  res.status(500).json({ 
    success: false,
    error: "Erreur interne du serveur",
    message: err.message 
  });
});

// ==================== DÉMARRAGE DU SERVEUR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`✅ Agora Token Server démarré sur le port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/`);
  console.log(`✅ Test: http://localhost:${PORT}/test`);
  console.log(`✅ Token endpoint: http://localhost:${PORT}/token`);
  console.log(`✅ App ID: ${APP_ID ? "Configuré" : "NON CONFIGURÉ"}`);
  console.log(`=========================================`);
  
  // Test de génération de token au démarrage (en mode développement)
  if (process.env.NODE_ENV !== 'production') {
    console.log("\n🧪 Test de génération de token au démarrage...");
    try {
      const testToken = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        "test-channel",
        123,
        RtcRole.PUBLISHER,
        Math.floor(Date.now() / 1000) + 3600
      );
      console.log("✅ Test réussi! Token généré avec succès");
      console.log(`   Token preview: ${testToken.substring(0, 30)}...`);
    } catch (testError) {
      console.error("❌ Échec du test:", testError.message);
    }
  }
});