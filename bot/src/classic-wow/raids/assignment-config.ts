import { Character } from "../raid-assignment";
import { RaidAssignmentRoster } from "./raid-assignment-roster";

export interface AttachmentFile {
  attachment: Buffer;
  name: string;
}

export interface RaidAssignmentResult {
  dmAssignment: string[];
  announcementTitle?: string;
  announcementAssignment?: string;
  officerTitle?: string;
  officerAssignment?: string;
  files?: AttachmentFile[];
  shortEnders?: Character[];
}

export type RaidAssignmentMaker = (
  roster: RaidAssignmentRoster,
) => Promise<RaidAssignmentResult>;

export interface AssignmentConfig {
  instanceId: string;
  assignmentMakers: RaidAssignmentMaker[];
}
