import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

function maskValue(value?: string | null, visible = 6) {
  if (!value) {
    return null;
  }

  if (value.length <= visible * 2) {
    return value;
  }

  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets credentials не настроены.");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function GET(request: NextRequest) {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY || null;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || null;

  const result: Record<string, unknown> = {
    host: request.headers.get("host"),
    hasServiceEmail: Boolean(serviceEmail),
    serviceEmail: maskValue(serviceEmail),
    hasPrivateKey: Boolean(privateKey),
    privateKeyLength: privateKey?.length || 0,
    spreadsheetId: maskValue(spreadsheetId),
  };

  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId || "",
    });

    const tabTitles =
      spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ?? [];

    const products = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId || "",
      range: "products",
    });

    const [headers = [], ...rows] = products.data.values ?? [];

    return NextResponse.json({
      ...result,
      ok: true,
      spreadsheetTitle: spreadsheet.data.properties?.title || null,
      tabTitles,
      productsHeaderCount: headers.length,
      productsRowCount: rows.length,
      sampleProducts: rows.slice(0, 3).map((row) => ({
        id: row[0] || null,
        name: row[1] || null,
        priceCny: row[3] || null,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось прочитать Google Sheets.";

    return NextResponse.json(
      {
        ...result,
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
