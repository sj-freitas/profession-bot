import { AssignmentConfig } from "./assignment-config";
import { TEMPLE_OF_AHNQIRAJ } from "./temple-of-aq/temple-of-aq-mapping";
import { NAXXRAMAS } from "./naxxramas/naxxramas-mapping";

export const INSTANCE_ASSIGNMENT_MAKERS = new Map<string, AssignmentConfig>([
  [TEMPLE_OF_AHNQIRAJ.instanceId, TEMPLE_OF_AHNQIRAJ],
  [NAXXRAMAS.instanceId, NAXXRAMAS],
]);
