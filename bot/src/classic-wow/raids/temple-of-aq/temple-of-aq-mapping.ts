import { AssignmentConfig } from "../assignment-config";
import { getCthunAssignment } from "./cthun";
import { getSarturaAssignment } from "./sartura";

export const TEMPLE_OF_AHNQIRAJ: AssignmentConfig = {
  instanceId: "aq40sod",
  assignmentMakers: [getSarturaAssignment, getCthunAssignment],
};
