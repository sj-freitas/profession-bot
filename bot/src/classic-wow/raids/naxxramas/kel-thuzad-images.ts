/* eslint-disable no-console */
import * as path from "path";
import { createCanvas, loadImage } from "canvas";

type Orientation = "left" | "right" | "center";
type CthunGroupCoordinates = [x: number, y: number, orientation: Orientation];

const THREE_GROUPS: CthunGroupCoordinates[] = [
  [320, 150, "right"],
  [750, 150, "left"],
  [540, 460, "center"],
];

export async function drawImageAssignments(
  groups: string[][],
): Promise<Buffer> {
  const imageName = `kel-thuzad-melee-assign.png`;
  const imageDir = `${path.resolve(__dirname, "../../../..")}/images/${imageName}`;

  const image = await loadImage(imageDir);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  ctx.font = "35px Calibri";
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.textBaseline = "top";

  const groupsToUse = THREE_GROUPS;

  for (let idx = 0; idx < groups.length; idx += 1) {
    const currGroup = groups[idx];
    const [x, y, textAlign] = groupsToUse[idx];

    ctx.textAlign = textAlign;
    ctx.fillText(currGroup.join("\n"), x, y);
  }

  return canvas.toBuffer();
}
