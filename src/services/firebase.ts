import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle escaped newlines in environment variables
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export const messaging = admin.messaging();

/**
 * Helper to easily send notifications
 */
export async function sendNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!token) return false;

  try {
    const payload: admin.messaging.Message = {
      notification: { title, body },
      token,
      data: data || {},
    };

    const response = await messaging.send(payload);
    console.log('Successfully sent Firebase notification:', response);
    return true;
  } catch (error) {
    console.error('Error sending Firebase notification:', error);
    return false;
  }
}
