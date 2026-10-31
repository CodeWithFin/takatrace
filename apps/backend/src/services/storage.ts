import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  userId: string
): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return `https://placeholder.takatrace.app/scan-${Date.now()}.jpg`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `takatrace/scans/${userId}`,
        resource_type: 'image',
        transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}
