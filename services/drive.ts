import { Note } from '../types';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const BACKUP_FILENAME = 'void_notes_backup.json';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialize GAPI and GIS
export const initDriveApi = async (clientId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const gapi = (window as any).gapi;
        const google = (window as any).google;

        if (!gapi || !google) {
            reject("Google Scripts not loaded");
            return;
        }

        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    clientId: clientId,
                    discoveryDocs: DISCOVERY_DOCS,
                });
                gapiInited = true;
                
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: '', // defined at request time
                });
                gisInited = true;
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    });
};

// Request Access Token
export const authenticate = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) return reject("Drive API not initialized");
        
        tokenClient.callback = async (resp: any) => {
            if (resp.error) reject(resp);
            resolve();
        };

        // Prompt for interaction if needed
        tokenClient.requestAccessToken({ prompt: '' });
    });
};

// Check for existing backup
export const checkForBackup = async (): Promise<{ id: string, modifiedTime: string } | null> => {
    const gapi = (window as any).gapi;
    try {
        const response = await gapi.client.drive.files.list({
            q: `name = '${BACKUP_FILENAME}' and trashed = false`,
            fields: 'files(id, modifiedTime)',
            spaces: 'drive'
        });
        
        const files = response.result.files;
        if (files && files.length > 0) {
            return { id: files[0].id, modifiedTime: files[0].modifiedTime };
        }
        return null;
    } catch (e) {
        console.error("Error finding backup", e);
        throw e;
    }
};

// Download Backup
export const downloadBackup = async (fileId: string): Promise<Note[]> => {
    const gapi = (window as any).gapi;
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.result;
    } catch (e) {
        console.error("Error downloading backup", e);
        throw e;
    }
};

// Upload/Update Backup
export const uploadBackup = async (notes: Note[], fileId?: string): Promise<void> => {
    const gapi = (window as any).gapi;
    const fileContent = JSON.stringify(notes);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json',
    };

    const accessToken = gapi.client.getToken().access_token;
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const url = fileId 
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const method = fileId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
        method: method,
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    });

    if (!response.ok) {
        throw new Error("Upload failed: " + response.statusText);
    }
};