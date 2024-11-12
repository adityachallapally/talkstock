import { put } from '@vercel/blob';
import fs from 'fs';

export async function uploadFile(filePath: string, contentType?: string) {
  const fileContent = fs.readFileSync(filePath);
  const fileName = filePath.split('/').pop();

  if (!contentType) {
    contentType = getContentType(fileName);
  }

  const blob = await put(fileName, fileContent, {
    access: 'public',
    contentType: contentType,
  });

  console.log(blob);
  return blob;
}

function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    default:
      return 'application/octet-stream';
  }
}

export async function uploadImage(base64Data: string): Promise<string> {
  // Convert base64 string to Buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate a unique file name
  const fileName = `image-${Date.now()}.png`;

  // Upload the buffer to Vercel Blob Storage
  const blob = await put(fileName, buffer, {
    access: 'public',            // Make the file publicly accessible
    contentType: 'image/png',    // Set the correct content type
  });

  console.log('Uploaded image URL:', blob.url);

  // Return the URL of the uploaded image
  return blob.url;
}

export async function uploadBuffer(buffer: Buffer, fileName: string, contentType: string) {
  const blob = await put(fileName, buffer, {
    access: 'public',
    contentType: contentType,
  });

  console.log('Uploaded buffer:', blob);
  return blob;
}
