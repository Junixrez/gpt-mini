import fs from "fs/promises";
import path from "path";

/**
 * Send uploaded file to n8n webhook
 * @param {Object} fileData - File information
 * @param {string} fileData.filePath - Path to uploaded file
 * @param {string} fileData.filename - Original filename
 * @param {string} fileData.fileType - MIME type
 * @param {number} fileData.fileSize - File size in bytes
 * @param {string} fileData.documentId - MongoDB document ID
 * @param {string} fileData.uploadedBy - User email (optional)
 */
export async function sendFileToN8N(fileData) {
  // Check if n8n integration is enabled
  if (process.env.N8N_ENABLED !== "true") {
    console.log("ℹ️ n8n integration is disabled");
    return { success: false, reason: "disabled" };
  }

  // Check if webhook URL is configured
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn("⚠️ N8N_WEBHOOK_URL not configured in .env");
    return { success: false, reason: "not_configured" };
  }

  try {
    const { filePath, filename, fileType, fileSize, documentId, uploadedBy } =
      fileData;

    console.log(`📤 Preparing to send file to n8n: ${filename}`);

    // Read file and convert to base64
    const fileBuffer = await fs.readFile(filePath);
    const fileBase64 = fileBuffer.toString("base64");

    // Prepare payload for n8n
    const payload = {
      filename: filename,
      mimeType: fileType,
      fileSize: fileSize,
      fileContent: fileBase64,
      documentId: documentId,
      uploadedBy: uploadedBy || "anonymous",
      uploadedAt: new Date().toISOString(),
      metadata: {
        originalName: filename,
        extension: path.extname(filename),
        sizeInKB: Math.round(fileSize / 1024),
      },
    };

    console.log(
      `📡 Sending to n8n: ${filename} (${Math.round(fileSize / 1024)} KB)`
    );

    // Send POST request to n8n webhook
    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ File successfully sent to n8n: ${filename}`);

    return { success: true, result };
  } catch (error) {
    console.error(`❌ Error sending file to n8n:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send file URL to n8n (alternative for large files)
 * @param {Object} fileData - File information with URL
 */
export async function sendFileUrlToN8N(fileData) {
  if (process.env.N8N_ENABLED !== "true") {
    return { success: false, reason: "disabled" };
  }

  if (!process.env.N8N_WEBHOOK_URL) {
    return { success: false, reason: "not_configured" };
  }

  try {
    const { fileUrl, filename, fileType, fileSize, documentId, uploadedBy } =
      fileData;

    const payload = {
      filename: filename,
      mimeType: fileType,
      fileSize: fileSize,
      fileUrl: fileUrl,
      documentId: documentId,
      uploadedBy: uploadedBy || "anonymous",
      uploadedAt: new Date().toISOString(),
      metadata: {
        originalName: filename,
        sizeInKB: Math.round(fileSize / 1024),
      },
    };

    console.log(`📤 Sending file URL to n8n: ${filename}`);

    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ File URL sent to n8n successfully: ${filename}`);

    return { success: true, result };
  } catch (error) {
    console.error(`❌ Error sending file URL to n8n:`, error.message);
    return { success: false, error: error.message };
  }
}
