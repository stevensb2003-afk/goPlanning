import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Función para obtener la app de admin de forma segura
function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const app = admin.apps[0];
    if (app) return app;
  }

  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  // 1. Check if the environment variable is missing or a placeholder (${...})
  // This happens if GitHub secrets or App Hosting params are not correctly injected.
  const isPlaceholder = saEnv?.trim().startsWith("${");
  
  if (!saEnv || isPlaceholder) {
    console.log("Firebase Service Account JSON not found or is a placeholder. Using Application Default Credentials.");
    try {
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (err: any) {
      const reason = isPlaceholder ? "PLACEHOLDER_DETECTED" : "MISSING_ENV";
      throw new Error(`AUTHENTICATION_ERROR: [${reason}] Fallback to Application Default Credentials failed: ${err.message}. Please ensure the Cloud Run service identity has 'Firebase Messaging Admin' permissions.`);
    }
  }

  // 2. If we have a potential JSON string, try to parse and use it
  const trimmedSa = saEnv.trim();
  try {
    const serviceAccount = JSON.parse(trimmedSa);
    if (!serviceAccount.project_id || !serviceAccount.private_key) {
      throw new Error("Invalid service account JSON structure: missing project_id or private_key");
    }
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err: any) {
    const preview = trimmedSa.length > 20 
      ? `${trimmedSa.substring(0, 10)}...${trimmedSa.substring(trimmedSa.length - 10)}`
      : trimmedSa;
    
    // Last ditch effort: try ADC if JSON parsing failed but we are on GCP
    console.warn(`JSON Parse failed for Service Account. Preview: ${preview}. Error: ${err.message}. Trying ADC fallback.`);
    try {
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (adcErr: any) {
      throw new Error(`CONFIGURATION_ERROR: [Length: ${trimmedSa.length}] [Preview: ${preview}] - JSON error: ${err.message}. ADC fallback also failed: ${adcErr.message}`);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const app = getAdminApp();
    const { userId, title, body, data } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Usar la instancia específica de la app
    const userDoc = await app.firestore().collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    
    // 1. Check if user has disabled push notifications globally
    if (userData?.notificationSettings?.pushEnabled === false) {
      return NextResponse.json({ message: "Push notifications are disabled for this user" });
    }

    // 2. Gather tokens from BOTH formats (legacy array and new map)
    const legacyTokens: string[] = userData?.fcmTokens || [];
    const mapTokens: string[] = userData?.fcmTokensMap ? Object.values(userData.fcmTokensMap) : [];
    
    // Use a Set to ensure absolute uniqueness before sending
    const allTokens = Array.from(new Set([...legacyTokens, ...mapTokens])).filter(t => typeof t === 'string' && t.length > 0);

    if (allTokens.length === 0) {
      return NextResponse.json({ message: "No tokens found for user" });
    }

    // 3. Prepare messages with collapseKey for deduplication at device level
    const messages: admin.messaging.Message[] = allTokens.map((token) => ({
      token,
      data: {
        ...data,
        title,
        body,
        url: data?.url || "/",
        tag: data?.tag || "default", // Tag for collapse logic in browsers
      },
      fcmOptions: {
        analyticsLabel: "go_planning_notification",
      },
      webpush: {
        headers: {
          'Urgency': 'high',
          'Topic': data?.tag || 'default', // Webpush topic acts as a collapse key
        },
        fcmOptions: {
          link: data?.url || "/",
        },
      },
    }));

    // Send messages in batch
    const responses = await app.messaging().sendEach(messages);
    
    const successCount = responses.successCount;
    const failureCount = responses.failureCount;

    // 4. Cleanup failing tokens (Important for keeping the map/array clean)
    if (failureCount > 0) {
      const failedTokens = allTokens.filter((_, index) => !responses.responses[index].success);
      
      // Clean legacy array
      const newLegacyTokens = legacyTokens.filter(t => !failedTokens.includes(t));
      
      // Clean map
      let newMap = { ...(userData?.fcmTokensMap || {}) };
      let mapChanged = false;
      Object.entries(newMap).forEach(([deviceId, token]) => {
        if (failedTokens.includes(token as string)) {
          delete newMap[deviceId];
          mapChanged = true;
        }
      });

      const updates: any = {};
      if (newLegacyTokens.length !== legacyTokens.length) updates.fcmTokens = newLegacyTokens;
      if (mapChanged) updates.fcmTokensMap = newMap;
      
      if (Object.keys(updates).length > 0) {
        await app.firestore().collection("users").doc(userId).update(updates);
      }
    }

    return NextResponse.json({ 
      success: true, 
      successCount, 
      failureCount 
    });

  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
