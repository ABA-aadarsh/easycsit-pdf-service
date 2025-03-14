const { google } = require('googleapis');
const markdownpdf = require('markdown-pdf');
const { Buffer } = require('buffer');
const { Readable } = require('stream');

// Decode the service account key from environment variable
const serviceAccountKey = JSON.parse(
    Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];


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

async function uploadToGoogleDrive(fileName, pdfBuffer) {
    const client = await authenticateServiceAccount()
    const drive = google.drive({ version: 'v3', auth: client });

    // Create file metadata
    const fileMetadata = { name: fileName };

    // Create the media object (Buffer as a Readable stream)
    const media = {
        mimeType: 'application/pdf',
        body: Readable.from(pdfBuffer),
    };

    // Upload the file to Google Drive
    const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    });

    const fileId = file.data.id;

    // Set file permissions to be accessible by anyone with the link
    await drive.permissions.create({
        fileId: fileId,
        resource: {
            role: 'reader',
            type: 'anyone',
        },
    });

    const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

    return fileUrl;
}

async function listPDFs() {
    const client = await authenticateServiceAccount()
    const drive = google.drive({ version: 'v3', auth: client });

    // Retrieve a list of files from Google Drive
    const res = await drive.files.list({
        q: "mimeType='application/pdf'", // Filter to only PDF files
        fields: 'files(id, name)',
    });

    const files = res.data.files;
    // {name, id}[]

    if (files.length) {
        console.log('Files:');
        files.forEach((file) => {
            console.log(`${file.name} (ID: ${file.id})`);
        });
    } else {
        console.log('No PDF files found.');
    }
    return files
}

module.exports = {
    uploadToGoogleDrive, listPDFs
}