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
    throw new Error("ENVIRONMENT_ERROR: FIREBASE_SERVICE_ACCOUNT is missing");
  }

  try {
    const serviceAccount = JSON.parse(saEnv);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err: any) {
    throw new Error(`JSON_ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT - ${err.message}`);
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
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        notification: {
          icon: "https://goplanning-audiovisual-church.web.app/favicon.svg",
          badge: "https://goplanning-audiovisual-church.web.app/favicon.svg",
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
