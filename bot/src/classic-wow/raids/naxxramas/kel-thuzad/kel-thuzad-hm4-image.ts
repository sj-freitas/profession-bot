/* eslint-disable no-console */
import * as path from "path";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";

type Orientation = "left" | "right" | "center";
type ImageCoordinates = [
  x: number,
  y: number,
  orientation: Orientation,
  color?: string,
];

const MELEE_GROUPS: ImageCoordinates[] = [
  [1110, 700, "left", "rgb(182, 201, 201)"], // Moon
  [970, 900, "center", "rgb(35, 182, 195)"], // Square
  [815, 700, "right", "rgb(211, 61, 61)"], // Cross
];
const RANGED_GROUPS: ImageCoordinates[] = [
  [1390, 730, "left", "rgb(211, 208, 102)"], // Star
  [970, 1200, "center", "rgb(221, 148, 64)"], // Circle
  [555, 730, "right", "rgb(184, 106, 195)"], // Diamond
  [970, 200, "center", "rgb(103, 195, 49)"], // Triangle
];
const HEALER_GROUPS: ImageCoordinates[] = [
  [1300, 465, "left"], // NORTH-EAST
  [650, 465, "right"], // NORTH-WEST
  [1300, 990, "left"], // SOUTH-EAST
  [650, 990, "right"], // SOUTH-WEST
];
const MAIN_TANK: ImageCoordinates[] = [[965, 530, "center"]];

function placeGroup(
  ctx: CanvasRenderingContext2D,
  group: string[][],
  coordinates: ImageCoordinates[],
) {
  let idx = 0;
  for (const currGroup of group) {
    const [x, y, textAlign, color] = coordinates[idx];
    const prevColor = ctx.fillStyle;

    if (color) {
      ctx.fillStyle = color;
    }

    ctx.textAlign = textAlign;
    ctx.fillText(currGroup.join("\n"), x, y);

    ctx.fillStyle = prevColor;

    idx += 1;
  }
}

export async function drawImageAssignments(
  mainTank: string[],
  meleeGroups: string[][],
  rangedGroups: string[][],
  healerGroups: string[][],
): Promise<Buffer> {
  const imageName = `kel-thuzad-assign.png`;
  const imageDir = `${path.resolve(__dirname, "../../../../..")}/images/${imageName}`;

  const image = await loadImage(imageDir);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  ctx.font = "35px Calibri";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgb(255, 255, 255)";
  placeGroup(ctx, meleeGroups, MELEE_GROUPS);

  ctx.font = "bold 50px Calibri";
  placeGroup(ctx, rangedGroups, RANGED_GROUPS);

  ctx.font = "60px Calibri";
  placeGroup(ctx, healerGroups, HEALER_GROUPS);

  ctx.font = "50px Calibri";
  placeGroup(ctx, [mainTank], MAIN_TANK);

  return canvas.toBuffer();
}
