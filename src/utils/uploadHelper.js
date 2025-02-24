import cloudinary from "./cloudinary.js"
export const uploadToCloudinary = async (file, folderpath, publicId) => {
    if (!file?.path) return null; 
  try {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: folderpath,
      public_id: publicId,
    });
    return uploadResult.secure_url
  } catch (error) {
    throw new Error(`Failed to upload ${publicId}`, { cause: 500 });
  }
};