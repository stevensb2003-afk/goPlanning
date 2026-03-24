import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Inicializar el SDK de Admin solo una vez
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, data } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Obtener tokens de FCM del usuario desde Firestore
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    
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

    // Enviar mensajes de forma masiva
    const responses = await admin.messaging().sendEach(messages);
    
    const successCount = responses.successCount;
    const failureCount = responses.failureCount;

    // Opcional: Limpiar tokens inválidos (que fallaron)
    if (failureCount > 0) {
      const validTokens = tokens.filter((_, index) => responses.responses[index].success);
      if (validTokens.length !== tokens.length) {
        await admin.firestore().collection("users").doc(userId).update({
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
