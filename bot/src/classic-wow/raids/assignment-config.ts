import { RaidAssignmentRoster } from "./raid-assignment-roster";

export interface AttachmentFile {
  attachment: Buffer;
  name: string;
}

export interface RaidAssignmentResult {
  dmAssignment: string;
  announcementAssignment?: string;
  officerAssignment?: string;
  files?: AttachmentFile[];
}

export type RaidAssignmentMaker = (
  roster: RaidAssignmentRoster,
) => Promise<RaidAssignmentResult>;

export interface AssignmentConfig {
  instanceId: string;
  assignmentMakers: RaidAssignmentMaker[];
}
