import { nanoid } from "nanoid";
import aboutModel from "../../../../DB/models/Aboutus.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";

//add about
export const addAbout = asyncHandler(async (req, res, next) => {
  const {
    welcomeText,
    ourValues,
    missionText,
    wayOfDoingBusiness,
    freshManifestoText,
  } = req.body;

  const customId = nanoid();
  const folderpath = `${process.env.APP_NAME}/About/${customId}`;

  // Upload all images in parallel
  const uploads = [];

  if (req.files?.manifestoImage?.length) {
    uploads.push(
      ...req.files.manifestoImage.map((image, index) =>
        uploadToCloudinary(
          image,
          `${folderpath}/manifestoImages`,
          `${customId}_manifestoImage_${index + 1}`
        )
      )
    );
  }

  let welcomeImageUpload = req.files?.welcomeImage?.length
    ? uploadToCloudinary(
        req.files.welcomeImage[0],
        `${folderpath}/welcomeImage`,
        `${customId}_welcomeImage`
      )
    : Promise.resolve("");

  let missionImageUploads = req.files?.missionImage?.length
    ? req.files.missionImage.map((file, index) =>
        uploadToCloudinary(
          file,
          `${folderpath}/missionImage`,
          `${customId}_missionImage_${index}`
        )
      )
    : [];

  // Execute all uploads in parallel
  const [welcomeImage, ...uploadedImages] = await Promise.all([
    welcomeImageUpload,
    ...uploads,
    ...missionImageUploads,
  ]);

  const manifestoImage =
    uploadedImages.slice(0, req.files?.manifestoImage?.length) || [];
  const missionImages =
    uploadedImages.slice(req.files?.manifestoImage?.length) || [];

  // Structure mission data
  const missions = (
    Array.isArray(missionText) ? missionText : [missionText]
  ).map((text, index) => ({
    missionText: text,
    missionImage: missionImages[index] || null,
  }));

  // Store in database
  const about = await aboutModel.create({
    customId,
    welcome: { welcomeText, welcomeImage },
    ourValues,
    missions,
    wayOfDoingBusiness,
    freshManifesto: { freshManifestoText, manifestoImage },
  });

  return res.status(201).json({
    status: "success",
    message: "About created successfully",
    result: about,
  });
});

//====================================================================================================================//
//get about
export const getAbout = asyncHandler(async (req, res, next) => {
  const About = await aboutModel.find({});

  return res.status(200).json({
    status: "success",
    message: "Done",
    result: About,
  });
});
//====================================================================================================================//
//update about

export const updateAbout = asyncHandler(async (req, res, next) => {
  const {
    welcomeText,
    ourValues,
    missionText,
    wayOfDoingBusiness,
    freshManifestoText,
  } = req.body;
  const { aboutId } = req.params;

  // Find existing document
  const checkAbout = await aboutModel.findById(aboutId);
  if (!checkAbout) {
    return next(new Error("Invalid about id", { cause: 404 }));
  }

  const folderpath = `${process.env.APP_NAME}/About/${checkAbout.customId}`;
  const uploads = [];

  // Handle manifesto images
  let manifestoImage = checkAbout.freshManifesto?.manifestoImage || [];
  if (req.files?.manifestoImage?.length) {
    uploads.push(
      ...req.files.manifestoImage.map((image, index) =>
        uploadToCloudinary(
          image,
          `${folderpath}/manifestoImages`,
          `${checkAbout.customId}_manifestoImage_${index + 1}`
        )
      )
    );
  }

  // Handle welcome image
  let welcomeImageUpload = req.files?.welcomeImage?.length
    ? uploadToCloudinary(
        req.files.welcomeImage[0],
        `${folderpath}/welcomeImage`,
        `${checkAbout.customId}_welcomeImage`
      )
    : Promise.resolve(checkAbout.welcome?.welcomeImage || "");

  // Handle mission images
  let missionImageUploads = req.files?.missionImage?.length
    ? req.files.missionImage.map((file, index) =>
        uploadToCloudinary(
          file,
          `${folderpath}/missionImage`,
          `${checkAbout.customId}_missionImage_${index}`
        )
      )
    : [];

  // Upload all images in parallel
  const [welcomeImage, ...uploadedImages] = await Promise.all([
    welcomeImageUpload,
    ...uploads,
    ...missionImageUploads,
  ]);

  // Use newly uploaded images if available
  manifestoImage =
    req.files?.manifestoImage?.length > 0
      ? uploadedImages.slice(0, req.files?.manifestoImage?.length)
      : manifestoImage;

  let newMissionImages =
    req.files?.missionImage?.length > 0
      ? uploadedImages.slice(req.files?.manifestoImage?.length)
      : [];

  // Preserve existing missions & update only new ones
  let updatedMissions = checkAbout.missions.map((mission, index) => ({
    missionText: missionText?.[index] || mission.missionText,
    missionImage: newMissionImages[index] || mission.missionImage,
  }));

  // If new mission text is provided beyond existing ones, add them
  if (
    Array.isArray(missionText) &&
    missionText.length > checkAbout.missions.length
  ) {
    for (let i = checkAbout.missions.length; i < missionText.length; i++) {
      updatedMissions.push({
        missionText: missionText[i],
        missionImage: newMissionImages[i] || null,
      });
    }
  }

  // Update database
  const about = await aboutModel.findByIdAndUpdate(
    aboutId,
    {
      welcome: {
        welcomeText: welcomeText || checkAbout.welcome?.welcomeText,
        welcomeImage,
      },
      ourValues: ourValues || checkAbout.ourValues,
      missions: updatedMissions,
      wayOfDoingBusiness: wayOfDoingBusiness || checkAbout.wayOfDoingBusiness,
      freshManifesto: {
        freshManifestoText:
          freshManifestoText || checkAbout.freshManifesto?.freshManifestoText,
        manifestoImage,
      },
    },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "About updated successfully",
    result: about,
  });
});
