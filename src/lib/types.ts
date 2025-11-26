export interface CommandData {
  command: string;
  filter?: Record<string, any>;
  sort?: Record<string, any>;
  pipeline?: Array<Record<string, any>>;
  collection: string;
}

export interface IndexSuggestion {
  field: string;
  reason: string;
}
