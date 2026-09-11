import { Request, Response } from 'express';

// Helper to format bytes
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Extract Bearer token from request
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}

// Get Google User info & Drive Storage Quota
export async function getDriveAbout(req: Request, res: Response) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Token autentikasi tidak ditemukan. Harap login ke Google Drive.' });
    }

    const driveRes = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user,storageQuota',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      return res.status(driveRes.status).json({
        error: 'Gagal mengambil data akun Google Drive',
        details: errText,
      });
    }

    const data = await driveRes.json();
    const quota = data.storageQuota || {};
    const limit = parseInt(quota.limit || '0', 10);
    const usage = parseInt(quota.usage || '0', 10);
    const usageInDrive = parseInt(quota.usageInDrive || '0', 10);
    const usageInDriveTrash = parseInt(quota.usageInDriveTrash || '0', 10);

    const percentUsed = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;

    return res.json({
      user: data.user,
      quota: {
        limit,
        usage,
        usageInDrive,
        usageInDriveTrash,
        usageFormatted: formatBytes(usage),
        limitFormatted: limit > 0 ? formatBytes(limit) : 'Unlimited',
        percentUsed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching drive about info:', error);
    return res.status(500).json({ error: 'Kesalahan server saat menghubungkan ke Google Drive', message: error.message });
  }
}

// Find or create dedicated backup folder in Google Drive
export async function findOrCreateFolder(
  token: string,
  folderName: string = 'Website Photo Backup'
): Promise<{ id: string; name: string; webViewLink?: string; createdTime?: string }> {
  const sanitizedName = folderName.trim().replace(/['\\]/g, '') || 'Website Photo Backup';

  // Search existing folder
  const query = encodeURIComponent(
    `mimeType = 'application/vnd.google-apps.folder' and name = '${sanitizedName}' and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,createdTime)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Gagal mencari folder backup: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0];
  }

  // If not found, create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink,createdTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: sanitizedName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder backup foto otomatis dari Website Photo Backup',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat folder backup di Google Drive: ${errText}`);
  }

  return await createRes.json();
}

// Endpoint handler to get or create folder
export async function getOrCreateFolderHandler(req: Request, res: Response) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Token autentikasi tidak ditemukan.' });
    }

    const folderName = (req.query.folderName as string) || (req.body?.folderName as string) || 'Website Photo Backup';
    const folder = await findOrCreateFolder(token, folderName);

    return res.json({ success: true, folder });
  } catch (error: any) {
    console.error('Error getting/creating folder:', error);
    return res.status(500).json({ error: error.message || 'Gagal menyiapkan folder Google Drive' });
  }
}

// List files inside backup folder
export async function listFolderFiles(req: Request, res: Response) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Token autentikasi tidak ditemukan.' });
    }

    const folderName = (req.query.folderName as string) || 'Website Photo Backup';
    const folder = await findOrCreateFolder(token, folderName);

    const query = encodeURIComponent(`'${folder.id}' in parents and trashed = false`);
    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime)&orderBy=createdTime desc&pageSize=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!filesRes.ok) {
      const errText = await filesRes.text();
      return res.status(filesRes.status).json({ error: 'Gagal mengambil daftar file', details: errText });
    }

    const filesData = await filesRes.json();
    return res.json({
      success: true,
      folder,
      files: (filesData.files || []).map((f: any) => ({
        ...f,
        size: f.size ? parseInt(f.size, 10) : 0,
        sizeFormatted: f.size ? formatBytes(parseInt(f.size, 10)) : '0 B',
      })),
    });
  } catch (error: any) {
    console.error('Error listing folder files:', error);
    return res.status(500).json({ error: error.message || 'Gagal mengambil riwayat file dari Google Drive' });
  }
}

// Upload photo to Google Drive
export async function uploadPhotoHandler(req: Request, res: Response) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Token Google Drive tidak ditemukan. Silakan login terlebih dahulu.' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Tidak ada file foto yang diunggah.' });
    }

    // Validate MIME type
    const isImage = file.mimetype.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|heic|svg)$/i.test(file.originalname);
    if (!isImage) {
      return res.status(400).json({ error: 'File yang diupload harus berupa gambar/foto (JPEG, PNG, WEBP, HEIC, dll).' });
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'Ukuran foto melebihi batas maksimal 50MB.' });
    }

    const folderName = (req.body.folderName as string) || 'Website Photo Backup';
    const duplicateAction = (req.body.duplicateAction as 'rename' | 'overwrite' | 'skip') || 'rename';

    // 1. Ensure target folder exists
    const folder = await findOrCreateFolder(token, folderName);

    // 2. Check for duplicate filename in folder
    const rawOriginalName = file.originalname.trim();
    const cleanFileName = rawOriginalName.replace(/['\\]/g, '');
    let finalFileName = cleanFileName;

    const dupQuery = encodeURIComponent(
      `'${folder.id}' in parents and name = '${cleanFileName}' and trashed = false`
    );
    const dupRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${dupQuery}&fields=files(id,name,size,webViewLink,thumbnailLink,createdTime)&spaces=drive`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    let existingFile: any = null;
    if (dupRes.ok) {
      const dupData = await dupRes.json();
      if (dupData.files && dupData.files.length > 0) {
        existingFile = dupData.files[0];
      }
    }

    if (existingFile) {
      if (duplicateAction === 'skip') {
        return res.json({
          success: true,
          action: 'skipped',
          message: `File "${cleanFileName}" sudah ada di Google Drive, proses upload dilewati.`,
          file: {
            id: existingFile.id,
            name: existingFile.name,
            size: existingFile.size ? parseInt(existingFile.size, 10) : file.size,
            webViewLink: existingFile.webViewLink,
            thumbnailLink: existingFile.thumbnailLink,
            createdTime: existingFile.createdTime,
          },
        });
      }

      if (duplicateAction === 'overwrite') {
        // Update existing file content directly
        const patchRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media&fields=id,name,size,webViewLink,thumbnailLink,createdTime`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': file.mimetype || 'application/octet-stream',
            },
            body: file.buffer,
          }
        );

        if (!patchRes.ok) {
          const patchErr = await patchRes.text();
          throw new Error(`Gagal menimpa file di Google Drive: ${patchErr}`);
        }

        const patchedData = await patchRes.json();
        return res.json({
          success: true,
          action: 'overwritten',
          message: `File "${cleanFileName}" berhasil diperbarui di Google Drive.`,
          file: {
            ...patchedData,
            size: patchedData.size ? parseInt(patchedData.size, 10) : file.size,
          },
        });
      }

      // Rename: append unique suffix
      const dotIndex = cleanFileName.lastIndexOf('.');
      if (dotIndex > 0) {
        const base = cleanFileName.substring(0, dotIndex);
        const ext = cleanFileName.substring(dotIndex);
        finalFileName = `${base}_${Date.now()}${ext}`;
      } else {
        finalFileName = `${cleanFileName}_${Date.now()}`;
      }
    }

    // 3. Multipart Upload to Google Drive
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: finalFileName,
      mimeType: file.mimetype || 'image/jpeg',
      parents: [folder.id],
      description: 'Diupload secara otomatis melalui Website Photo Backup',
    };

    const metadataHeader = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${file.mimetype || 'image/jpeg'}\r\n\r\n`;

    const metadataBuffer = Buffer.from(metadataHeader, 'utf-8');
    const closeBuffer = Buffer.from(closeDelimiter, 'utf-8');
    const multipartBody = Buffer.concat([metadataBuffer, file.buffer, closeBuffer]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartBody.length.toString(),
        },
        body: multipartBody,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Google Drive upload error response:', errText);
      throw new Error(`Google Drive API error (${uploadRes.status}): ${errText}`);
    }

    const driveFile = await uploadRes.json();

    return res.json({
      success: true,
      action: 'created',
      message: 'Foto berhasil disimpan di Google Drive!',
      file: {
        id: driveFile.id,
        name: driveFile.name,
        mimeType: driveFile.mimeType,
        size: driveFile.size ? parseInt(driveFile.size, 10) : file.size,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        thumbnailLink: driveFile.thumbnailLink,
        createdTime: driveFile.createdTime || new Date().toISOString(),
      },
      folder: {
        id: folder.id,
        name: folder.name,
        webViewLink: folder.webViewLink,
      },
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return res.status(500).json({
      error: error.message || 'Terjadi kesalahan saat mengupload foto ke Google Drive.',
    });
  }
}

// Delete file from Google Drive (Requires explicit user confirmation on frontend)
export async function deleteFileHandler(req: Request, res: Response) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Token autentikasi tidak ditemukan.' });
    }

    const fileId = req.params.fileId;
    if (!fileId) {
      return res.status(400).json({ error: 'ID file tidak valid.' });
    }

    const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!delRes.ok && delRes.status !== 404) {
      const errText = await delRes.text();
      return res.status(delRes.status).json({ error: 'Gagal menghapus file di Google Drive', details: errText });
    }

    return res.json({ success: true, message: 'File berhasil dihapus dari Google Drive.' });
  } catch (error: any) {
    console.error('Delete handler error:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghapus file dari Google Drive' });
  }
}
