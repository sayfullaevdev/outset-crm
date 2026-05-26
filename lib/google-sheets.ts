import { google, sheets_v4 } from "googleapis";

const SHEET_TABS = {
  products: [
    "id",
    "name",
    "link",
    "priceCny",
    "category",
    "estimatedWeightKg",
    "markupMultiplier",
    "photoUrl",
    "galleryUrls",
    "notes",
    "sizes",
    "colors",
    "deliveryEstimate",
    "status",
    "createdAt",
    "updatedAt",
  ],
  orders: [
    "id",
    "clientName",
    "telegramUsername",
    "productId",
    "productName",
    "salePriceUsd",
    "salePriceUzs",
    "totalCostUsd",
    "profitUsd",
    "weightKg",
    "prepaymentReceived",
    "prepaymentDate",
    "orderedOnPinduoduo",
    "orderedDate",
    "inTransit",
    "arrived",
    "arrivedDate",
    "finalPaymentReceived",
    "finalPaymentDate",
    "status",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  settings: ["key", "value", "updatedAt"],
} as const;

type SheetTab = keyof typeof SHEET_TABS;

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

function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID не настроен.");
  }

  return spreadsheetId;
}

async function getSheetsClient() {
  const auth = getGoogleAuth();

  return google.sheets({
    version: "v4",
    auth,
  });
}

async function getSpreadsheet(sheets: sheets_v4.Sheets) {
  return sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
  });
}

export async function ensureBaseSheets() {
  const sheets = await getSheetsClient();
  const spreadsheet = await getSpreadsheet(sheets);
  const existingTabs =
    spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ?? [];

  const missingTabs = (Object.keys(SHEET_TABS) as SheetTab[]).filter(
    (tab) => !existingTabs.includes(tab),
  );

  if (missingTabs.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      requestBody: {
        requests: missingTabs.map((tab) => ({
          addSheet: {
            properties: {
              title: tab,
            },
          },
        })),
      },
    });
  }

  for (const tab of Object.keys(SHEET_TABS) as SheetTab[]) {
    const rows = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${tab}!1:1`,
    });

    const currentHeaders = rows.data.values?.[0] ?? [];
    const expectedHeaders = Array.from(SHEET_TABS[tab]);
    const headersNeedSync =
      currentHeaders.length !== expectedHeaders.length ||
      expectedHeaders.some((header, index) => currentHeaders[index] !== header);

    if (headersNeedSync) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: getSpreadsheetId(),
        range: `${tab}!1:1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [expectedHeaders],
        },
      });
    }
  }
}

export async function getRows<T extends Record<string, string>>(sheetName: SheetTab) {
  await ensureBaseSheets();
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
  });

  const [headers = [], ...rows] = response.data.values ?? [];

  return rows.map((row) => {
    return headers.reduce(
      (acc, header, index) => {
        acc[header] = row[index] ?? "";
        return acc;
      },
      {} as Record<string, string>,
    );
  }) as T[];
}

export async function appendRow(sheetName: SheetTab, row: Record<string, string>) {
  await ensureBaseSheets();
  const sheets = await getSheetsClient();
  const headers = SHEET_TABS[sheetName];
  const values = headers.map((header) => row[header] ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
    valueInputOption: "RAW",
    requestBody: {
      values: [values],
    },
  });
}

export async function updateRow(
  sheetName: SheetTab,
  rowId: string,
  data: Record<string, string>,
) {
  await ensureBaseSheets();
  const sheets = await getSheetsClient();
  const rows = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
  });

  const allRows = rows.data.values ?? [];
  const headers = allRows[0] ?? [];
  const rowIndex = allRows.findIndex((row, index) => index > 0 && row[0] === rowId);

  if (rowIndex === -1) {
    throw new Error(`Строка ${rowId} в листе ${sheetName} не найдена.`);
  }

  const current = headers.reduce(
    (acc, header, index) => {
      acc[header] = allRows[rowIndex][index] ?? "";
      return acc;
    },
    {} as Record<string, string>,
  );

  const nextRow = headers.map((header) => data[header] ?? current[header] ?? "");

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${rowIndex + 1}:${String.fromCharCode(64 + headers.length)}${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [nextRow],
    },
  });
}

export async function getSettingsMap() {
  const rows = await getRows<{ key: string; value: string }>("settings");

  return rows.reduce(
    (acc, row) => {
      acc[row.key] = row.value;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export async function upsertSetting(key: string, value: string) {
  await ensureBaseSheets();
  const rows = await getRows<{ key: string; value: string }>("settings");
  const existing = rows.find((row) => row.key === key);
  const updatedAt = new Date().toISOString();

  if (!existing) {
    await appendRow("settings", {
      key,
      value,
      updatedAt,
    });
    return;
  }

  await updateRow("settings", existing.key, {
    key,
    value,
    updatedAt,
  });
}
