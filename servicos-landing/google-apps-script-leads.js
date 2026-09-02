/**
 * Google Apps Script — Lead Hub Central
 *
 * Endpoint único para todos os projetos.
 * Recebe POST com payload JSON e salva na aba LEADS_MASTER.
 *
 * Deploy como Web App:
 * - Execute as: "Me"
 * - Who has access: "Anyone"
 */

const SHEET_NAME = 'LEADS_MASTER';
const HEADERS = [
  'timestamp',
  'origem',
  'projeto',
  'pagina',
  'nome',
  'whatsapp',
  'email',
  'empresa',
  'area',
  'campanha',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'raw_payload'
];

function ensureSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');
    headerRange.setFontColor('#111827');
  }
  return sheet;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = ensureSheet();
    
    const row = [
      payload.timestamp || new Date().toISOString(),
      payload.origem || '',
      payload.projeto || '',
      payload.pagina || '',
      payload.nome || '',
      payload.whatsapp || '',
      payload.email || '',
      payload.empresa || '',
      payload.area || '',
      payload.campanha || '',
      payload.utm_source || '',
      payload.utm_medium || '',
      payload.utm_campaign || '',
      payload.utm_content || '',
      JSON.stringify(payload)
    ];
    
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Lead salvo com sucesso.' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Lead Hub Central ativo.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
