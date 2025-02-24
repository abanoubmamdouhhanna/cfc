import multer from "multer";
import { asyncHandler } from "./errorHandling.js";
import { dangerousExtensions } from "./dangerousExtensions.js";

export const allowedTypesMap = (() => {
  const imageTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
  const documentTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ];

  return {
    categoryImage: imageTypes,
    subcategoryImage: imageTypes,
    mealImage: imageTypes,
    welcomeImage: imageTypes,
    missionImage: imageTypes,
    manifestoImage: imageTypes,
    locationPhoto: imageTypes,
    processImage: imageTypes,
    memberImage: imageTypes,
    couponImage:imageTypes,
    resume: documentTypes,
  };
})();


const fileValidation = (allowedTypesMap = {}) => {
  return asyncHandler(async (req, file, cb) => {
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
    if (dangerousExtensions.includes(fileExtension)) {
      return cb(
        new Error(`File type '${fileExtension}' not allowed`, { cause: 400 }),
        false
      );
    }
    if (!allowedTypesMap.announcementAttach) {
      const allowedMimeTypes = allowedTypesMap[file.fieldname] || [];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
          new Error(`Invalid type for ${file.fieldname}`, { cause: 400 }),
          false
        );
      }
    }

    cb(null, true);
  });
};

export function fileUpload(size, allowedTypesMap) {
  const storage = multer.diskStorage({});
  const limits = { fileSize: size * 1024 * 1024 };
  const fileFilter = fileValidation(allowedTypesMap);
  const upload = multer({ fileFilter, storage, limits });
  return upload;
}
