import { AssignmentConfig } from "../assignment-config";
import { getKelThuzadAssignment } from "./kel-thuzad";
import { getMaexxnaAssignment } from "./maexxna";
import { getPatchwerkAssignment } from "./patchwerk";

export const NAXXRAMAS: AssignmentConfig = {
  instanceId: "naxxramassod",
  assignmentMakers: [
    getMaexxnaAssignment,
    getPatchwerkAssignment,
    getKelThuzadAssignment,
  ],
};
