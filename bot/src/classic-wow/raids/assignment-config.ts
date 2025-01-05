import { RaidAssignmentRoster } from "./raid-assignment-roster";

export interface RaidAssignmentResult {
  dmAssignment: string;
  announcementAssignment?: string;
  officerAssignment?: string;
}

export type RaidAssignmentMaker = (
  roster: RaidAssignmentRoster,
) => RaidAssignmentResult;

export interface AssignmentConfig {
  instanceId: string;
  assignmentMakers: RaidAssignmentMaker[];
}
