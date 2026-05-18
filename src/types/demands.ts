export type DemandFieldType = "text" | "number" | "select" | "textarea" | "attachment" | "date";

export interface DemandField {
  id: string;
  demandTypeId: string;
  key: string;
  label: string;
  fieldType: DemandFieldType;
  required: boolean;
  options?: string[];
  position: number;
}

export interface DemandType {
  id: string;
  label: string;
  active: boolean;
  fields: DemandField[];
}
