import { AssignmentConfig } from "../assignment-config";
import { getBugTrioAssignment } from "./bug-trio";
import { getCthunAssignment } from "./cthun";
import { getSarturaAssignment } from "./sartura";
import { getTwinsAssignment } from "./twin-emps";

export const TEMPLE_OF_AHNQIRAJ: AssignmentConfig = {
  instanceId: "aq40sod",
  assignmentMakers: [
    getBugTrioAssignment,
    getSarturaAssignment,
    getTwinsAssignment,
    getCthunAssignment,
  ],
};
