import { nanoid } from "nanoid";
import aboutModel from "../../../../DB/models/Aboutus.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
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
//add or update about
export const upsertAbout = asyncHandler(async (req, res, next) => {
  const {
    welcomeText,
    ourValues,
    missionText,
    wayOfDoingBusiness,
    freshManifestoText,
  } = req.body;

  // Find existing About document (assuming only one exists)
  let checkAbout = await aboutModel.findOne();

  const isUpdate = !!checkAbout;
  const customId = isUpdate
    ? checkAbout.customId
    : nanoid();

  const folderpath = `${process.env.APP_NAME}/About/${customId}`;
  const uploads = [];

  // Handle manifesto images
  let manifestoImage = checkAbout?.freshManifesto?.manifestoImage || [];
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

  // Handle welcome image
  let welcomeImageUpload = req.files?.welcomeImage?.length
    ? uploadToCloudinary(
        req.files.welcomeImage[0],
        `${folderpath}/welcomeImage`,
        `${customId}_welcomeImage`
      )
    : Promise.resolve(checkAbout?.welcome?.welcomeImage || "");

  // Handle mission images
  let missionImageUploads = req.files?.missionImage?.length
    ? req.files.missionImage.map((file, index) =>
        uploadToCloudinary(
          file,
          `${folderpath}/missionImage`,
          `${customId}_missionImage_${index}`
        )
      )
    : [];

  // Upload all images in parallel
  const [welcomeImage, ...uploadedImages] = await Promise.all([
    welcomeImageUpload,
    ...uploads,
    ...missionImageUploads,
  ]);

  manifestoImage =
    req.files?.manifestoImage?.length > 0
      ? uploadedImages.slice(0, req.files.manifestoImage.length)
      : manifestoImage;

  let newMissionImages =
    req.files?.missionImage?.length > 0
      ? uploadedImages.slice(req.files.manifestoImage?.length || 0)
      : [];

  // Prepare missions
  let updatedMissions = [];
  if (isUpdate) {
    updatedMissions = checkAbout.missions.map((mission, index) => ({
      missionText: missionText?.[index] || mission.missionText,
      missionImage: newMissionImages[index] || mission.missionImage,
    }));

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
  } else {
    if (Array.isArray(missionText)) {
      updatedMissions = missionText.map((text, index) => ({
        missionText: text,
        missionImage: newMissionImages[index] || null,
      }));
    }
  }

  const aboutData = {
    customId,
    welcome: {
      welcomeText: welcomeText || checkAbout?.welcome?.welcomeText || "",
      welcomeImage,
    },
    ourValues: ourValues || checkAbout?.ourValues || "",
    missions: updatedMissions,
    wayOfDoingBusiness:
      wayOfDoingBusiness || checkAbout?.wayOfDoingBusiness || "",
    freshManifesto: {
      freshManifestoText:
        freshManifestoText ||
        checkAbout?.freshManifesto?.freshManifestoText ||
        "",
      manifestoImage,
    },
  };

  let about;
  if (isUpdate) {
    about = await aboutModel.findOneAndUpdate({}, aboutData, {
      new: true,
    });
  } else {
    about = await aboutModel.create(aboutData);
  }

  return res.status(200).json({
    status: "success",
    message: isUpdate
      ? "About updated successfully"
      : "About created successfully",
    result: about,
  });
});

