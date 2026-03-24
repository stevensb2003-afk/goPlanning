import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Función para obtener la app de admin de forma segura
function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const app = admin.apps[0];
    if (app) return app;
  }

  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saEnv) {
    throw new Error("ENVIRONMENT_ERROR: FIREBASE_SERVICE_ACCOUNT is missing in process.env");
  }

  // Pre-check for common formatting issues (like being truncated or having extra quotes)
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
    // If it's a JSON parse error, provide some context (length, start/end)
    const preview = trimmedSa.length > 20 
      ? `${trimmedSa.substring(0, 10)}...${trimmedSa.substring(trimmedSa.length - 10)}`
      : trimmedSa;
    throw new Error(`CONFIGURATION_ERROR: [Length: ${trimmedSa.length}] [Preview: ${preview}] - ${err.message}`);
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
    const tokens: string[] = userData?.fcmTokens || [];

    if (tokens.length === 0) {
      return NextResponse.json({ message: "No tokens found for user" });
    }

    const messages: admin.messaging.Message[] = tokens.map((token) => ({
      token,
      // Standard notification block (for OS level handling)
      notification: {
        title,
        body,
      },
      // Data block (for our robust SW listener)
      data: {
        ...data,
        title,
        body,
        url: data?.url || "/",
      },
      webpush: {
        notification: {
          icon: "/favicon.svg",
          badge: "/favicon.svg",
        },
        fcmOptions: {
          link: data?.url || "/",
        },
      },
    }));

    // Enviar mensajes de forma masiva usando la instancia de messaging de la app
    const responses = await app.messaging().sendEach(messages);
    
    const successCount = responses.successCount;
    const failureCount = responses.failureCount;

    // Opcional: Limpiar tokens inválidos (que fallaron)
    if (failureCount > 0) {
      const validTokens = tokens.filter((_, index) => responses.responses[index].success);
      if (validTokens.length !== tokens.length) {
        await app.firestore().collection("users").doc(userId).update({
          fcmTokens: validTokens
        });
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
