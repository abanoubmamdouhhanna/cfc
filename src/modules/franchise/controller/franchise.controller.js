import { nanoid } from "nanoid";
import franchiseModel from "../../../../DB/models/Franchise.model.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

// Helper function to upload images
const uploadProcessImages = async (files, folderpath, customId) => {
  return files?.length
    ? await Promise.all(
        files.map((file, index) =>
          uploadToCloudinary(
            file,
            `${folderpath}/processImage`,
            `${customId}_processImage_${index}`
          )
        )
      )
    : [];
};

// Helper function to structure process steps
const buildProcessArray = (processText, processImages, existingProcesses = []) => {
  processText = Array.isArray(processText) ? processText : [processText];

  let updatedProcesses = existingProcesses.map((process, index) => ({
    processText: processText[index] || process.processText,
    processImage: processImages[index] || process.processImage,
  }));

  if (processText.length > existingProcesses.length) {
    for (let i = existingProcesses.length; i < processText.length; i++) {
      updatedProcesses.push({
        processText: processText[i],
        processImage: processImages[i] || null,
      });
    }
  }

  return updatedProcesses;
};

// ==================================================================================================================== //
// ADD FRANCHISE
export const addFranchise = asyncHandler(async (req, res, next) => {
  const { welcomeText, whyChooseCFC, processText, benfits } = req.body;

  const customId = nanoid();
  const folderpath = `${process.env.APP_NAME}/Franchise/${customId}`;

  // Upload process images
  const processImages = await uploadProcessImages(req.files?.processImage, folderpath, customId);

  // Structure ourProcess data
  const processes = buildProcessArray(processText, processImages);

  // Store in database
  const Franchise = await franchiseModel.create({
    customId,
    welcomeText,
    ourProcess: processes,
    whyChooseCFC,
    benfits,
  });

  return res.status(201).json({
    status: "success",
    message: "Franchise created successfully",
    result: Franchise,
  });
});

// ==================================================================================================================== //
// GET FRANCHISE
export const getFranchise = asyncHandler(async (req, res, next) => {
  const Franchise = await franchiseModel.find({}).lean();

  return res.status(200).json({
    status: "success",
    message: "Franchise data retrieved successfully",
    result: Franchise,
  });
});

// ==================================================================================================================== //
// UPDATE FRANCHISE
export const updateFranchise = asyncHandler(async (req, res, next) => {
  const { welcomeText, whyChooseCFC, processText, benfits } = req.body;
  const { franchiseId } = req.params;

  // Find existing franchise
  const checkFranchise = await franchiseModel.findById(franchiseId);
  if (!checkFranchise) {
    return next(new Error("Franchise not found or invalid ID", { cause: 404 }));
  }

  const folderpath = `${process.env.APP_NAME}/Franchise/${checkFranchise.customId}`;

  // Upload new process images
  const processImages = await uploadProcessImages(req.files?.processImage, folderpath, checkFranchise.customId);

  // Update process array
  const updatedProcesses = buildProcessArray(processText, processImages, checkFranchise.ourProcess);

  // Update in database
  const updatedFranchise = await franchiseModel.findByIdAndUpdate(
    franchiseId,
    {
      welcomeText,
      ourProcess: updatedProcesses,
      whyChooseCFC,
      benfits,
    },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Franchise updated successfully",
    result: updatedFranchise,
  });
});
