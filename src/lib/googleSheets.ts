/* eslint-disable */
// @ts-nocheck
import { google } from "googleapis";

// Decode service account credentials from base64
const decodedCredentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, "base64").toString(
    "utf-8",
  ),
);

// Setup Google Sheets API
export async function getGoogleSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: decodedCredentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    return sheets;
  } catch (error) {
    console.error("Error setting up Google Sheets client:", error);
    throw new Error("Failed to initialize Google Sheets client");
  }
}

export async function fetchFromGoogleSheet() {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:H"; // Adjust range as needed

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    if (rows.length <= 1) {
      console.log("No data found in the sheet.");
      return [];
    }

    const headers = rows[0];

    const data = rows.slice(1).map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header.toLowerCase().trim()] = row[index] || "";
      });
      return entry;
    });

    return data;
  } catch (error) {
    console.error("Error fetching data from Google Sheet:", error);
    return [];
  }
}
