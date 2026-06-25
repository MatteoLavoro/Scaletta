/**
 * Firebase Cloud Functions per Scaletta
 *
 * Questo file contiene le Cloud Functions necessarie per il funzionamento
 * delle notifiche push e dell'esportazione PDF nell'app Scaletta.
 */

const functions = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

// Inizializza Firebase Admin
admin.initializeApp();

/**
 * Cloud Function per inviare notifiche push multicast
 *
 * Endpoint: POST /sendNotification
 *
 * Body:
 * {
 *   tokens: string[],  // Array di token FCM
 *   notification: {
 *     title: string,
 *     body: string,
 *     data: object     // Dati custom opzionali
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   successCount: number,
 *   failureCount: number,
 *   invalidTokens: string[]  // Token da rimuovere dal database
 * }
 */
exports.sendNotification = functions.https.onRequest(async (req, res) => {
  // ====================================
  // CORS Configuration
  // ====================================
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Use POST.",
    });
  }

  try {
    // ====================================
    // Validate Request Body
    // ====================================
    const {
      recipientIds,
      groupId,
      projectId,
      projectName,
      senderId,
      senderName,
      title,
      body,
    } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds)) {
      return res.status(400).json({
        success: false,
        error: "recipientIds must be an array",
      });
    }

    if (recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "recipientIds array cannot be empty",
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: "title and body are required",
      });
    }

    // ====================================
    // Get FCM Tokens from Firestore
    // ====================================
    const db = admin.firestore();
    const tokens = [];

    console.log(
      `📋 Recupero token per ${recipientIds.length} destinatari:`,
      recipientIds,
    );

    // Recupera i token in batch (Firestore limita "in" a 10 elementi)
    // Filtra solo gli utenti che hanno enabled !== false
    const batchSize = 10;
    for (let i = 0; i < recipientIds.length; i += batchSize) {
      const batch = recipientIds.slice(i, i + batchSize);
      const snapshot = await db
        .collection("userTokens")
        .where(admin.firestore.FieldPath.documentId(), "in", batch)
        .get();

      console.log(
        `📦 Batch ${i / batchSize + 1}: trovati ${snapshot.size} documenti`,
      );

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`🔍 Documento ${doc.id}:`, {
          hasToken: !!data?.token,
          enabled: data?.enabled,
          tokenPreview: data?.token
            ? data.token.substring(0, 20) + "..."
            : "N/A",
        });
        // Aggiungi il token solo se l'utente ha le notifiche abilitate
        if (data && data.token && data.enabled !== false) {
          tokens.push(data.token);
        }
      });
    }

    console.log(
      `✅ Token raccolti: ${tokens.length} di ${recipientIds.length} destinatari`,
    );

    if (tokens.length === 0) {
      console.log(
        "⚠️ Nessun token FCM trovato o tutte le notifiche disabilitate",
      );
      return res.status(200).json({
        success: true,
        message:
          "No FCM tokens found for recipients or all notifications disabled",
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
      });
    }

    // ====================================
    // Prepare Notification Message
    // ====================================
    const message = {
      notification: {
        title,
        body,
      },
      // Data payload per aprire il progetto
      data: {
        groupId: groupId || "",
        projectId: projectId || "",
        projectName: projectName || "",
        senderId: senderId || "",
        senderName: senderName || "",
        url: `/projects/${projectId}`,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      // Configurazione Android
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "scaletta_notifications",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
          visibility: "public",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      // Configurazione web
      webpush: {
        notification: {
          icon: "/web-app-manifest-192x192.png",
          badge: "/favicon-96x96.png",
          vibrate: [200, 100, 200],
          requireInteraction: false,
        },
        fcmOptions: {
          link: `/projects/${projectId}`,
        },
      },
      // Configurazione Apple (iOS)
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            alert: {
              title,
              body,
            },
          },
        },
      },
    };

    // ====================================
    // Send Notifications in Batches
    // ====================================
    // Firebase multicast ha un limite di 500 token per richiesta
    const sendBatchSize = 500;
    const responses = [];
    const invalidTokens = [];

    for (let i = 0; i < tokens.length; i += sendBatchSize) {
      const batch = tokens.slice(i, i + sendBatchSize);

      try {
        const response = await admin.messaging().sendMulticast({
          tokens: batch,
          ...message,
        });

        responses.push(response);

        // Raccogli i token invalidi da rimuovere
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const error = resp.error;
              // Token non validi o non registrati - da rimuovere dal database
              if (
                error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered"
              ) {
                invalidTokens.push(batch[idx]);
              }
            }
          });
        }
      } catch (error) {
        console.error(`Errore invio batch ${i / sendBatchSize}:`, error);
        // Continua con il prossimo batch anche se questo fallisce
      }
    }

    // ====================================
    // Calculate Results
    // ====================================
    const successCount = responses.reduce((sum, r) => sum + r.successCount, 0);
    const failureCount = responses.reduce((sum, r) => sum + r.failureCount, 0);

    console.log(
      `Notifiche inviate: ${successCount} successi, ${failureCount} fallimenti, ${invalidTokens.length} token invalidi`,
    );

    // ====================================
    // Return Response
    // ====================================
    return res.status(200).json({
      success: true,
      successCount,
      failureCount,
      invalidTokens,
      totalProcessed: tokens.length,
    });
  } catch (error) {
    console.error("Errore generale invio notifiche:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
});

// TODO: Implementare scheduled function per notifiche programmate
// Richiede firebase-functions v2 con sintassi diversa:
// const {onSchedule} = require("firebase-functions/v2/scheduler");
// exports.sendScheduledNotifications = onSchedule("every 1 minutes", async (event) => { ... });

// ============================================================
// Cloud Function: generatePdf
// ============================================================
/**
 * Genera un PDF da una stringa HTML tramite Puppeteer headless (Chromium).
 * Usata dal frontend per esportare le note Markdown come PDF scaricabile.
 *
 * Endpoint: POST /generatePdf
 * Headers:  Authorization: Bearer <Firebase ID Token>
 * Body:     { html: string, title: string }
 * Response: application/pdf  (binary)
 *
 * Nota: usa firebase-functions/v2 per poter configurare memoria (1 GiB)
 * e timeout (120 s) necessari per avviare Chromium headless.
 */
exports.generatePdf = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 120,
    // cors è gestito manualmente per restituire binary (non JSON)
  },
  async (req, res) => {
    // ── CORS ────────────────────────────────────────────────────────────────
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed. Use POST." });
    }

    // ── Verifica Firebase Auth token ─────────────────────────────────────────
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Autorizzazione mancante. Accedi all'app prima di esportare.",
      });
    }
    try {
      await admin.auth().verifyIdToken(authHeader.slice(7));
    } catch {
      return res
        .status(401)
        .json({ error: "Token di autorizzazione non valido." });
    }

    // ── Validazione body ─────────────────────────────────────────────────────
    const { html, title } = req.body || {};
    if (!html || typeof html !== "string" || html.length < 20) {
      return res
        .status(400)
        .json({ error: "Campo 'html' mancante o non valido nel body." });
    }

    // ── Generazione PDF con Puppeteer ────────────────────────────────────────
    let browser = null;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });

      const page = await browser.newPage();

      // Carica il documento HTML (include CDN KaTeX CSS + SVG Graphviz inline)
      // networkidle0: attende che tutte le risorse esterne (font KaTeX, CSS) siano caricate
      await page.setContent(html, {
        waitUntil: "networkidle0",
        timeout: 25000,
      });

      // Genera il PDF — i margini corrispondono a quelli del CSS .pdf-body
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          right: "22mm",
          bottom: "22mm",
          left: "22mm",
        },
        // Numerazione pagine affidata a Puppeteer (più affidabile di CSS @page)
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate:
          '<div style="width:100%;font-size:7pt;color:#9ca3af;' +
          "text-align:center;padding:0 22mm;box-sizing:border-box;" +
          "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif\">" +
          '<span class="pageNumber"></span> di <span class="totalPages"></span>' +
          "</div>",
      });

      // Nome file sicuro per Content-Disposition
      const safeName =
        (title || "nota")
          .replace(/[^\w\u00C0-\u024F\s\-]/g, "")
          .trim()
          .slice(0, 100) || "nota";

      res.set("Content-Type", "application/pdf");
      res.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}.pdf`,
      );
      res.set("Content-Length", pdfBuffer.length.toString());
      return res.status(200).end(Buffer.from(pdfBuffer));
    } catch (err) {
      console.error(
        "[generatePdf] Errore generazione PDF:",
        err.message,
        err.stack,
      );
      return res.status(500).json({
        error: "Generazione PDF non riuscita.",
        message: err.message,
      });
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
    }
  },
);
