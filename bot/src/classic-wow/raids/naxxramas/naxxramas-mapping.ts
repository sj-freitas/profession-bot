import { AssignmentConfig } from "../assignment-config";
import { getKelThuzadAssignment } from "./kel-thuzad";

export const NAXXRAMAS: AssignmentConfig = {
  instanceId: "naxxramassod",
  assignmentMakers: [
    getKelThuzadAssignment,
  ],
};
