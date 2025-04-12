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
//ADD OR UPDATE TEAM
export const upsertTeam = asyncHandler(async (req, res, next) => {
  const { diversity, title, name } = req.body;

  // Find existing Team document (assuming only one)
  let checkTeam = await teamModel.findOne();

  const isUpdate = !!checkTeam;
  const customId = isUpdate
    ? checkTeam.customId
    : nanoid();

  const folderpath = `${process.env.APP_NAME}/Team/${customId}`;

  // Upload member images
  const memberImages = await uploadmemberImages(
    req.files?.memberImage,
    folderpath,
    customId
  );

  // Build team array (existing or empty if new)
  const updatedTeams = buildTeamArray(
    name,
    title,
    memberImages,
    checkTeam?.team || []
  );

  const teamData = {
    customId,
    diversity: diversity || checkTeam?.diversity || "",
    team: updatedTeams,
  };

  let updatedTeam;
  if (isUpdate) {
    updatedTeam = await teamModel.findOneAndUpdate({}, teamData, { new: true });
  } else {
    updatedTeam = await teamModel.create(teamData);
  }

  return res.status(200).json({
    status: "success",
    message: isUpdate ? "Team updated successfully" : "Team created successfully",
    result: updatedTeam,
  });
});
