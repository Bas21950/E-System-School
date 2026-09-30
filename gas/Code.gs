const SECRET_KEY = 'E_SYSTEM_RECEIPT_SECRET';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(false, 'missing_post_data');
    }

    const data = JSON.parse(e.postData.contents);
    if (!data || !data.file_base64 || !data.recipient_email) {
      return jsonResponse(false, 'missing_required_fields');
    }

    const props = PropertiesService.getScriptProperties();
    const storedSecret = String(props.getProperty(SECRET_KEY) || '').trim();
    const incomingSecret = String(data.secret || '').trim();

    if (storedSecret) {
      if (!incomingSecret || incomingSecret !== storedSecret) {
        return jsonResponse(false, 'invalid_secret');
      }
    } else if (incomingSecret) {
      props.setProperty(SECRET_KEY, incomingSecret);
    } else {
      return jsonResponse(false, 'secret_not_set');
    }

    const pdfBytes = Utilities.base64Decode(data.file_base64);
    const blob = Utilities.newBlob(
      pdfBytes,
      data.mime_type || 'application/pdf',
      data.file_name || 'receipt.pdf'
    );

    GmailApp.sendEmail(
      data.recipient_email,
      `ใบเสร็จ ${data.receipt_no || ''}`.trim(),
      `แนบใบเสร็จเลขที่ ${data.receipt_no || ''}`.trim(),
      {
        attachments: [blob],
        name: data.school_name || 'E-System School',
      }
    );

    return jsonResponse(true, 'ok');
  } catch (error) {
    return jsonResponse(false, String(error));
  }
}

function doGet() {
  return jsonResponse(true, 'ready');
}

function jsonResponse(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success, message }))
    .setMimeType(ContentService.MimeType.JSON);
}
