/* eslint-disable no-console */
import * as path from "path";
import { createCanvas, loadImage } from "canvas";

type Orientation = "left" | "right" | "center";
type CthunGroupCoordinates = [x: number, y: number, orientation: Orientation];

const FOUR_GROUPS: CthunGroupCoordinates[] = [
  [211, 191, "right"],
  [512, 191, "left"],
  [211, 388, "right"],
  [512, 388, "left"],
];

const FIVE_GROUPS: CthunGroupCoordinates[] = [
  [227, 182, "right"],
  [516, 182, "left"],
  [165, 323, "right"],
  [564, 323, "left"],
  [416, 432, "left"],
];

const SIX_GROUPS: CthunGroupCoordinates[] = [
  [245, 180, "right"],
  [495, 180, "left"],
  [155, 300, "right"],
  [557, 300, "left"],
  [245, 415, "right"],
  [495, 415, "left"],
];

const SEVEN_GROUPS: CthunGroupCoordinates[] = [
  [392, 136, "left"],
  [524, 215, "left"],
  [159, 334, "right"],
  [479, 425, "left"],
  [265, 425, "right"],
  [558, 334, "left"],
  [195, 215, "right"],
];

const EIGHT_GROUPS: CthunGroupCoordinates[] = [
  [259, 156, "right"],
  [547, 237, "left"],
  [177, 345, "right"],
  [475, 425, "left"],
  [259, 425, "right"],
  [547, 345, "left"],
  [177, 237, "right"],
  [475, 156, "left"],
];

function selectGroups(array: string[]): CthunGroupCoordinates[] {
  if (array.length <= 4) {
    return FOUR_GROUPS;
  }

  switch (array.length) {
    case 5:
      return FIVE_GROUPS;
    case 6:
      return SIX_GROUPS;
    case 7:
      return SEVEN_GROUPS;
    case 8:
    default:
      return EIGHT_GROUPS;
  }
}

export async function drawImageAssignments(
  groupLeaders: string[],
): Promise<Buffer> {
  const groupCount = Math.max(Math.min(groupLeaders.length, 8), 4);
  const imageName = `cthun-assign-${groupCount}.png`;
  const imageDir = `${path.resolve(__dirname, "../../../../..")}/images/${imageName}`;

  const image = await loadImage(imageDir);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  ctx.font = "20px Calibri";
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.textBaseline = "top";

  const groupsToUse = selectGroups(groupLeaders);

  for (let idx = 0; idx < groupLeaders.length; idx += 1) {
    const currName = groupLeaders[idx];
    const [x, y, textAlign] = groupsToUse[idx];

    ctx.textAlign = textAlign;
    ctx.fillText(currName, x, y);
  }

  return canvas.toBuffer();
}
