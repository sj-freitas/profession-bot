import { AssignmentConfig } from "../assignment-config";
import { getFourHorsemenAssignmentAssignment } from "./four-horsemen";
import { getKelThuzadAssignment } from "./kel-thuzad";
import { getLoathebAssignment } from "./loatheb";
import { getMaexxnaAssignment } from "./maexxna";
import { getSapphironAssignment } from "./sapphiron";
import { getPatchwerkAssignment } from "./patchwerk";

export const NAXXRAMAS: AssignmentConfig = {
  instanceId: "naxxramassod",
  assignmentMakers: [
    getMaexxnaAssignment,
    getLoathebAssignment,
    getPatchwerkAssignment,
    getFourHorsemenAssignmentAssignment,
    getSapphironAssignment,
    getKelThuzadAssignment,
  ],
};
