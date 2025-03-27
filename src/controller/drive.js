import dotenv from "dotenv";
dotenv.config();
import { google } from "googleapis";
import { Buffer } from "buffer";
import { Readable } from "stream";

// Decode the service account key from environment variable

const serviceAccountKeyBase64 = process.env.SERVICE_ACCOUNT_KEY

if (!serviceAccountKeyBase64) {
    throw new Error("SERVICE_ACCOUNT_KEY is not defined in environment variables");
}

const serviceAccountKey = JSON.parse(
    Buffer.from(serviceAccountKeyBase64, "base64").toString("utf-8")
);

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

let authClient;
async function authenticateServiceAccount() {
    if (authClient) return authClient;
    const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: SCOPES,
    });
    const client = await auth.getClient();
    authClient = client;
    return client;
}

export async function uploadToGoogleDrive(fileName, pdfBuffer) {
    try {
        const client = await authenticateServiceAccount();
        const drive = google.drive({ version: "v3", auth: client });

        // Ensure pdfBuffer is a valid Buffer
        if (!(pdfBuffer instanceof Buffer)) {
            pdfBuffer = Buffer.from(pdfBuffer);
        }

        // Create file metadata
        const fileMetadata = { name: fileName };

        // Create the media object (Buffer as a Readable stream)
        const media = {
            mimeType: "application/pdf",
            body: Readable.from(pdfBuffer),
        };

        // Upload the file to Google Drive
        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        const fileId = file.data.id;

        // Set file permissions to be accessible by anyone with the link
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });
        return fileId;
    } catch (error) {
        console.error("Error uploading file to Google Drive:", error);
        throw new Error("Failed to upload file");
    }
}

export async function listPDFs() {
    try {
        const client = await authenticateServiceAccount();
        const drive = google.drive({ version: "v3", auth: client });

        // Retrieve a list of files from Google Drive
        const res = await drive.files.list({
            q: "mimeType='application/pdf'", // Filter to only PDF files
            fields: "files(id, name)",
        });

        const files = res.data.files || [];
        return files;
    } catch (error) {
        console.error("Error listing PDFs from Google Drive:", error);
        throw new Error("Failed to retrieve PDF list");
    }
}


export async function deleteFromGoogleDrive(fileId) {
    try {
        const client = await authenticateServiceAccount();
        const drive = google.drive({ version: "v3", auth: client });

        await drive.files.delete({ fileId });

        console.log(`File with ID ${fileId} deleted successfully.`);
        return { success: true, message: `File ${fileId} deleted.` };
    } catch (error) {
        console.error("Error deleting file:", error.message);
        return { success: false, message: error.message };
    }
}