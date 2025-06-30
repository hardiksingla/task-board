// pages/api/gmail-push.ts (or app/api/gmail-push/route.ts if using App Router)

// Import necessary modules
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { google, gmail_v1 } from 'googleapis';

// Import the Prisma Client instance
import prisma from '@/db'; // Adjust path based on your project structure

interface PubSubMessage {
  data: string; // Base64 encoded JSON
  messageId: string;
  publishTime: string;
  // Other properties like attributes are possible but not used here
}

interface GmailPushPayload {
  emailAddress: string;
  historyId: string;
}

// --- Global OAuth2 Client and Gmail API Instance (initialized once) ---
// These are initialized outside the handler function to reuse across requests
// in a Next.js API route, improving performance.
let oAuth2Client: any | null;
let gmail: gmail_v1.Gmail | null;

try {
  // --- Load credentials from Environment Variables ---
  const client_id = process.env.GOOGLE_CLIENT_ID_GMAIL;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET_GMAIL;
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI_GMAIL; // Assuming single redirect URI for simplicity

  // --- Load token from Environment Variables ---
  const refresh_token = process.env.GOOGLE_REFRESH_TOKEN_GMAIL;
  const access_token = process.env.GOOGLE_ACCESS_TOKEN_GMAIL; // Optional: for initial access, but refresh_token is key
  const expiry_date_str = process.env.GOOGLE_TOKEN_EXPIRY_DATE_GMAIL; // Optional: for client-side expiry check
  const expiry_date = expiry_date_str ? parseInt(expiry_date_str, 10) : undefined;


  // Basic validation for required credentials
  if (!client_id || !client_secret || !redirect_uri) {
    throw new Error('Missing Google API credentials environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI).');
  }

  // Basic validation for required token
  if (!refresh_token) {
    throw new Error('Missing Google OAuth refresh token environment variable (GOOGLE_REFRESH_TOKEN).');
  }

  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
  
  // Set credentials. The refresh_token is paramount for long-term access.
  oAuth2Client.setCredentials({
    refresh_token: refresh_token,
    access_token: access_token, // Access token can be short-lived; refresh_token will get a new one
    expiry_date: expiry_date,
  });

  gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  console.log('✅ Gmail API client and OAuth2 setup successfully using environment variables.');

} catch (setupError: any) { // Use 'any' for unknown error types from external libraries
  console.error('❌ FATAL: Failed to initialize Google API clients:', setupError.message);
  console.error('Please ensure all required Google API credentials and token environment variables are set.');
  oAuth2Client = null;
  gmail = null;
}


/**
 * Helper function to decode base64url strings.
 * Gmail API uses base64url for message body data.
 * @param {string} data The base64url encoded string.
 * @returns {string} The decoded string.
 */
function decodeBase64Url(data: string): string {
  let buff = Buffer.from(data, 'base64');
  return buff.toString('utf-8');
}

/**
 * Recursively extracts the plain text content from a Gmail message payload.
 * Prefers 'text/plain' parts.
 * @param {gmail_v1.Schema$MessagePart | undefined} payload The message payload object from Gmail API.
 * @returns {string} The extracted text content.
 */
function getMessageText(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return '';

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        // For HTML, you might want to strip tags for plain text display
        // For simplicity, returning raw HTML for now.
        return decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        const nestedText = getMessageText(part);
        if (nestedText) return nestedText;
      }
    }
  } else if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  return '';
}

// --- Next.js App Router POST handler ---
export async function POST(req: NextRequest) {
  // Ensure the API clients were initialized successfully
  if (!oAuth2Client || !gmail) {
    console.error('API clients not initialized. Returning 500.');
    return NextResponse.json({ error: 'Server initialization failed. Check logs.' }, { status: 500 });
  }

  let transactionSuccess: boolean = false;

  try {
    // App Router's Request object handles JSON parsing automatically
    const requestBody = await req.json(); // Parses the request body as JSON

    console.log('📬 Received Pub/Sub push notification (Next.js App Router):', JSON.stringify(requestBody));
    const pubsubMessage: PubSubMessage = requestBody.message;

    if (!pubsubMessage || !pubsubMessage.data) {
      console.warn('Received Pub/Sub message with no data property. Skipping processing.');
      return NextResponse.json('No data in message, skipping.', { status: 200 });
    }

    const dataBuffer = Buffer.from(pubsubMessage.data, 'base64');
    const dataJson: GmailPushPayload = JSON.parse(dataBuffer.toString('utf-8'));

    console.log('📨 Decoded Gmail push notification payload:', dataJson);

    const currentHistoryId: string = dataJson.historyId;
    const emailAddress: string = dataJson.emailAddress || 'me';

    if (!currentHistoryId) {
      console.warn('No historyId found in the push notification data. Cannot retrieve changes.');
      return NextResponse.json('No historyId, skipping.', { status: 200 });
    }

    // 1. Get the last history ID processed by our application using Prisma
    let setting = await prisma.setting.findUnique({
      where: { key: 'lastSeenHistoryId' },
    });
    let lastSeenHistoryId: string | null = setting ? setting.value : null;

    // 2. If no lastSeenHistoryId, perform initial sync
    if (!lastSeenHistoryId) {
      console.log('ℹ️ No lastSeenHistoryId found. Performing initial sync...');
      const profile = await gmail.users.getProfile({ userId: emailAddress });
      lastSeenHistoryId = profile.data.historyId?.toString() || '0';
      if (lastSeenHistoryId === '0') {
        console.warn('Initial profile historyId was undefined or 0. Using a fallback initial historyId.');
      }

      await prisma.setting.upsert({
        where: { key: 'lastSeenHistoryId' },
        update: { value: lastSeenHistoryId },
        create: { key: 'lastSeenHistoryId', value: lastSeenHistoryId },
      });
      console.log(`ℹ️ Initial sync complete. Stored initial historyId: ${lastSeenHistoryId}`);
      return NextResponse.json('Initial sync completed. Ready for future pushes.', { status: 200 });
    }

    // 3. Use the lastSeenHistoryId to list changes *since* that ID
    console.log(`🔄 Fetching history from ${lastSeenHistoryId} to ${currentHistoryId}`);
    const historyResponse = await gmail.users.history.list({
      userId: emailAddress,
      startHistoryId: lastSeenHistoryId,
      historyTypes: ['messageAdded'],
    });

    console.log('📜 Gmail History list response (simplified):', JSON.stringify(historyResponse.data.history));

    if (historyResponse.data.history && historyResponse.data.history.length > 0) {
      for (const historyRecord of historyResponse.data.history) {
        if (historyRecord.messagesAdded && historyRecord.messagesAdded.length > 0) {
          for (const messageAdded of historyRecord.messagesAdded) {
            const messageId: string = messageAdded.message?.id || '';
            if (!messageId) {
                console.warn('Skipping message with undefined ID in history record.');
                continue;
            }
            console.log(`\n--- Processing new message with ID: ${messageId} ---`);

            try {
              const messageRes = await gmail.users.messages.get({
                userId: emailAddress,
                id: messageId,
                format: 'full',
              });

              const payload: gmail_v1.Schema$MessagePart | undefined = messageRes.data.payload;

              const subjectHeader = payload?.headers?.find(header => header.name === 'Subject');
              const fromHeader = payload?.headers?.find(header => header.name === 'From');
              const toHeader = payload?.headers?.find(header => header.name === 'To');

              console.log('Subject:', subjectHeader ? subjectHeader.value : 'N/A');
              console.log('From:', fromHeader ? fromHeader.value : 'N/A');
              console.log('To:', toHeader ? toHeader.value : 'N/A');
              const from = fromHeader ? fromHeader.value : 'N/A';
              const emailContent: string = getMessageText(payload);
              console.log('Extracted Email Content (first 500 chars):');
              console.log(emailContent.substring(0, 500) + (emailContent.length > 500 ? '...' : ''));
              const emailMatch = from!.match(/<([^>]+)>/);

              let extractedEmail = '';
              if (emailMatch && emailMatch[1]) {
                extractedEmail = emailMatch[1];
              }
              // --- Your API Call Here ---

              const contentLines = emailContent.split('\n');
              const link = contentLines[0] ? contentLines[0].trim() : '';
              const message = contentLines[1] ? contentLines[1].trim() : '';

              try {
                await axios.post('http://localhost:3000/api/post/new-post', {
                  emailId: messageId,
                  subject: subjectHeader ? subjectHeader.value : 'N/A',
                  email: extractedEmail,
                  // fullContent: emailContent,
                  url: link,
                  // extractedMessage: message,
                });
                console.log(`✔️ Successfully called external API for message ID: ${messageId}`);
              } catch (apiError: any) {
                console.error(`❌ Error calling external API for message ID ${messageId}:`, apiError.message);
                if (apiError.response) {
                  console.error('  External API Response Data:', apiError.response.data);
                }
              }
              // --- End Your API Call ---

            } catch (messageErr: any) {
              console.error(`❌ Error retrieving details for message ID ${messageId}:`, messageErr.message);
              if (messageErr.response && messageErr.response.data) {
                console.error('  Gmail API Response Data:', messageErr.response.data);
              }
              // Do NOT re-throw here; continue processing other messages if one fails.
            }
          }
        } else {
          console.log('History record found, but no new messages added in this specific record.');
        }
      }
      transactionSuccess = true;
    } else {
      console.log(`No relevant history records (messages added) found between ${lastSeenHistoryId} and ${currentHistoryId}.`);
      transactionSuccess = true;
    }

    // 4. Update the lastSeenHistoryId in the database ONLY if processing was successful
    if (transactionSuccess) {
      await prisma.setting.upsert({
        where: { key: 'lastSeenHistoryId' },
        update: { value: currentHistoryId.toString() },
        create: { key: 'lastSeenHistoryId', value: currentHistoryId.toString() },
      });
      console.log(`✅ Successfully processed push and updated lastSeenHistoryId to: ${currentHistoryId}`);
      return NextResponse.json('OK', { status: 200 });
    } else {
      console.error('❌ Push notification processed with issues. lastSeenHistoryId NOT updated.');
      return NextResponse.json('Error processing push notification', { status: 500 });
    }

  } catch (err: any) {
    console.error('❌ Major Error handling push notification:', err);

    if (err.response && err.response.data && err.response.data.error === 'invalid_grant') {
      console.error('⚠️ CRITICAL OAUTH ERROR: Your refresh token is invalid or expired.');
      console.error('Please re-run your Google OAuth authorization flow to obtain a new, valid refresh token.');
      console.error('You will need to manually update your environment variables with the new token.');
      return NextResponse.json({ error: 'Authentication required. Refresh token invalid.' }, { status: 401 });
    } else if (err instanceof SyntaxError && err.message.includes('JSON')) {
        console.error('  Failed to parse Pub/Sub message data. Ensure it is valid base64-encoded JSON.');
        return NextResponse.json({ error: 'Bad Request: Invalid Pub/Sub message format.' }, { status: 400 });
    }
    // Generic error response
    return NextResponse.json({ error: 'Internal Server Error processing push notification.' }, { status: 500 });
  }
}
// 