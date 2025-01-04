/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
import { SheetClient } from "./config";
import {
  appendRowToGoogleSheet,
  readGoogleSheet,
  replaceValueInGoogleSheet,
} from "./utils";

interface RowData<T> {
  rowOffset: number;
  entity: T;
}

function getInitialLetterFromRange(range: string): string {
  const match = range.match(/^([A-Z]+)/);
  if (!match) {
    throw new Error(`Unexpected invalid range ${range}`);
  }

  return match[1];
}

function getNumberOfFirstColumnFromRange(range: string): number {
  const match = range.match(/[A-Z]+(\d*)/);
  if (match) {
    const rowNumber = parseInt(match[1], 10);
    return Number.isNaN(rowNumber) ? 1 : rowNumber;
  }

  return 1;
}

function ensureEmptyStrings<T>(instance: T): T {
  const objectInstance = instance as { [key: string]: string };
  return Object.entries(objectInstance).reduce(
    (res, [key, value]) => {
      res[key] = value ?? "";
      return res;
    },
    {} as { [key: string]: string },
  ) as T;
}

export interface SheetTableConfig<T> {
  tableRange: string;
  idColumnName: keyof T;
  mapRawToEntity: (arrayOfValues: string[]) => T;
  mapEntityToRaw: (entity: T) => string[];
}

export class TableWrapper<T> {
  constructor(
    private readonly sheetClient: SheetClient,
    private readonly sheetId: string,
    private readonly tabId: string,
    private readonly tableConfig: SheetTableConfig<T>,
  ) {}

  private async getValueByIdInternal(id: string): Promise<RowData<T> | null> {
    const allValues = await this.getAllValues();
    const match = allValues
      .map((t, idx) => ({ entity: t, rowOffset: idx }))
      .find((t) => t.entity[this.tableConfig.idColumnName] === id);

    if (!match) {
      return null;
    }

    return match;
  }

  async getValueById(id: string): Promise<T | null> {
    const match = await this.getValueByIdInternal(id);

    if (match === null) {
      return null;
    }

    return match.entity;
  }

  async getAllValues(): Promise<T[]> {
    const table = await readGoogleSheet(
      this.sheetClient,
      this.sheetId,
      this.tabId,
      this.tableConfig.tableRange,
    );

    if (!table) {
      return [];
    }

    return table.map((t) =>
      ensureEmptyStrings(this.tableConfig.mapRawToEntity(t)),
    );
  }

  async updateValue(value: T): Promise<void> {
    const idColumn = this.tableConfig.idColumnName as keyof T;
    const idValue = value[idColumn] as string;
    const existing = await this.getValueByIdInternal(idValue);
    const initialRow = getNumberOfFirstColumnFromRange(
      this.tableConfig.tableRange,
    );

    if (!existing) {
      // Cannot update if it doesn't exist
      return;
    }

    await replaceValueInGoogleSheet(
      this.sheetClient,
      this.sheetId,
      this.tabId,
      {
        x: getInitialLetterFromRange(this.tableConfig.tableRange),
        y: initialRow + existing.rowOffset,
      },
      this.tableConfig.mapEntityToRaw(value),
    );
  }

  async upsertValue(value: T): Promise<void> {
    const idColumn = this.tableConfig.idColumnName as keyof T;
    const idValue = value[idColumn] as string;
    const existing = await this.getValueByIdInternal(idValue);
    const initialColumn = getInitialLetterFromRange(
      this.tableConfig.tableRange,
    );
    const initialRow = getNumberOfFirstColumnFromRange(
      this.tableConfig.tableRange,
    );

    if (existing) {
      await replaceValueInGoogleSheet(
        this.sheetClient,
        this.sheetId,
        this.tabId,
        {
          x: initialColumn,
          y: initialRow + existing.rowOffset,
        },
        this.tableConfig.mapEntityToRaw(value),
      );
      return;
    }

    await appendRowToGoogleSheet(
      this.sheetClient,
      this.sheetId,
      this.tabId,
      {
        x: initialColumn,
        y: initialRow,
      },
      this.tableConfig.mapEntityToRaw(value),
    );
  }

  async insertValue(value: T): Promise<void> {
    const idColumn = this.tableConfig.idColumnName as keyof T;
    const idValue = value[idColumn] as string;
    const existing = await this.getValueByIdInternal(idValue);

    if (existing) {
      // Cannot insert if it exists already
      return;
    }

    await appendRowToGoogleSheet(
      this.sheetClient,
      this.sheetId,
      this.tabId,
      {
        x: getInitialLetterFromRange(this.tableConfig.tableRange),
        y: getNumberOfFirstColumnFromRange(this.tableConfig.tableRange),
      },
      this.tableConfig.mapEntityToRaw(value),
    );
  }
}
