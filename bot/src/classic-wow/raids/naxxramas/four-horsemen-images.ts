/* eslint-disable no-console */
import * as path from "path";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";

type Orientation = "left" | "right" | "center";
type ImageCoordinates = [x: number, y: number, orientation: Orientation];

const THANE_KORTHAZZ_TANK: ImageCoordinates = [325, 405, "left"];
const THANE_KORTHAZZ_HEALERS: ImageCoordinates = [275, 320, "left"];
const HIGHLORD_MOGRAINE_TANK: ImageCoordinates = [520, 405, "left"];
const HIGHLORD_MOGRAINE_HEALERS: ImageCoordinates = [520, 330, "left"];
const LADY_BLAUMEUX_TANK: ImageCoordinates = [285, 60, "left"];
const SIR_ZELIEK_TANK: ImageCoordinates = [435, 60, "left"];
const SIR_ZELIEK_HEALERS: ImageCoordinates = [460, 155, "left"];

function bindCoordinates(
  context: CanvasRenderingContext2D,
  characterNames: string[],
  coordinates: ImageCoordinates,
) {
  const [x, y, textAlign] = coordinates;

  context.fillText(characterNames.join("\n"), x, y);
  context.textAlign = textAlign;
  context.fillText(characterNames.join("\n"), x, y);
}

export interface Assignment {
  tank: string;
  healers: string[];
}

export async function drawImageAssignments(
  assignments: Assignment[],
): Promise<Buffer> {
  const imageName = `four-horsemen-room.png`;
  const imageDir = `${path.resolve(__dirname, "../../../..")}/images/${imageName}`;

  const image = await loadImage(imageDir);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  ctx.font = "20px Calibri";
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.textBaseline = "top";

  bindCoordinates(ctx, [assignments[0].tank], THANE_KORTHAZZ_TANK);
  bindCoordinates(ctx, assignments[0].healers, THANE_KORTHAZZ_HEALERS);
  bindCoordinates(ctx, [assignments[1].tank], HIGHLORD_MOGRAINE_TANK);
  bindCoordinates(ctx, assignments[1].healers, HIGHLORD_MOGRAINE_HEALERS);
  bindCoordinates(ctx, [assignments[2].tank], LADY_BLAUMEUX_TANK);
  bindCoordinates(ctx, [assignments[3].tank], SIR_ZELIEK_TANK);
  bindCoordinates(ctx, assignments[3].healers, SIR_ZELIEK_HEALERS);

  return canvas.toBuffer();
}
