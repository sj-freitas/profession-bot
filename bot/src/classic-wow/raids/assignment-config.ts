import { RaidAssignmentRoster } from "./raid-assignment-roster";

export interface RaidAssignmentResult {
  dmAssignment: string;
  announcementAssignment?: string;
  officerAssignment?: string;
  files?: {
    attachment: Buffer;
    name: string;
  }[];
}

export type RaidAssignmentMaker = (
  roster: RaidAssignmentRoster,
) => Promise<RaidAssignmentResult>;

export interface AssignmentConfig {
  instanceId: string;
  assignmentMakers: RaidAssignmentMaker[];
}
