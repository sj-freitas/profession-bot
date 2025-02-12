import { AssignmentConfig } from "../assignment-config";
import { getFaerlinaAssignment } from "./faerlina";
import { getKelThuzadAssignment } from "./kel-thuzad";
import { getLoathebAssignment } from "./loatheb";
import { getMaexxnaAssignment } from "./maexxna";
import { getPatchwerkAssignment } from "./patchwerk";

export const NAXXRAMAS: AssignmentConfig = {
  instanceId: "naxxramassod",
  assignmentMakers: [
    getFaerlinaAssignment,
    getMaexxnaAssignment,
    getLoathebAssignment,
    getPatchwerkAssignment,
    getKelThuzadAssignment,
  ],
};
