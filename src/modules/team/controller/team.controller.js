import { nanoid } from "nanoid";
import TeamModel from "../../../../DB/models/Team.model.js";
import { uploadToCloudinary } from "../../../utils/uploadHelper.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import teamModel from "../../../../DB/models/Team.model.js";

// Helper function to upload images
const uploadmemberImages = async (files, folderpath, customId) => {
  return files?.length
    ? await Promise.all(
        files.map((file, index) =>
          uploadToCloudinary(
            file,
            `${folderpath}/memberImage`,
            `${customId}_memberImage_${index}`
          )
        )
      )
    : [];
};

// Helper function to structure process steps
const buildTeamArray = (
  name,
  title,
  memberImages,
  existingTeamMembers = []
) => {
  name = Array.isArray(name) ? name : [name];
  title = Array.isArray(title) ? title : [title];

  let updatedTeams = existingTeamMembers.map((member, index) => ({
    name: name[index] || member.name,
    title: title[index] || member.title,
    memberImage: memberImages[index] || member.memberImage,
  }));

  if (name.length > existingTeamMembers.length) {
    for (let i = existingTeamMembers.length; i < name.length; i++) {
      updatedTeams.push({
        name: name[i],
        title: title[i],
        memberImage: memberImages[i] || null,
      });
    }
  }

  return updatedTeams;
};

// ==================================================================================================================== //
// ADD TEAM
export const addTeam = asyncHandler(async (req, res, next) => {
  const { diversity, title, name } = req.body;

  const customId = nanoid();
  const folderpath = `${process.env.APP_NAME}/Team/${customId}`;

  // Upload Member images
  const memberImages = await uploadmemberImages(
    req.files?.memberImage,
    folderpath,
    customId
  );

  // Structure ourMember data
  const teams = buildTeamArray(name, title, memberImages);

  // Store in database
  const Team = await teamModel.create({
    customId,
    diversity,
    team: teams,
  });

  return res.status(201).json({
    status: "success",
    message: "Team created successfully",
    result: Team,
  });
});

// ==================================================================================================================== //
// GET TEAM
export const getTeam = asyncHandler(async (req, res, next) => {
  const Team = await teamModel.find({}).lean();

  return res.status(200).json({
    status: "success",
    message: "Team data retrieved successfully",
    result: Team,
  });
});

// ==================================================================================================================== //
// UPDATE TEAM
export const updateTeam = asyncHandler(async (req, res, next) => {
  const { diversity, title, name } = req.body;
  const { teamId } = req.params;

  // Find existing Team
  const checkTeam = await TeamModel.findById(teamId);
  if (!checkTeam) {
    return next(new Error("Team not found or invalid ID", { cause: 404 }));
  }

  const folderpath = `${process.env.APP_NAME}/Team/${checkTeam.customId}`;

  // Upload Member images
  const memberImages = await uploadmemberImages(
    req.files?.memberImage,
    folderpath,
    checkTeam.customId
  );

  // Update process array
  const updatedTeams = buildTeamArray(
    name,
    title,
    memberImages,
    checkTeam.team
  );

  // Update in database
  const updatedTeam = await teamModel.findByIdAndUpdate(
    teamId,
    {
      diversity,
      team: updatedTeams,
    },
    { new: true }
  );

  return res.status(200).json({
    status: "success",
    message: "Team updated successfully",
    result: updatedTeam,
  });
});
