import { CommandData, IndexSuggestion } from "./types";

export const extractQueryFields = (data: CommandData) => {
  const matchFields = new Set<string>();
  const sortFields = new Set<string>();

  if (data.filter) {
    for (const key of Object.keys(data.filter)) {
      matchFields.add(key);
    }
  }

  if (data.sort) {
    for (const key of Object.keys(data.sort)) {
      sortFields.add(key);
    }
  }

  if (data.pipeline) {
    for (const stage of data.pipeline) {
      if (stage.$match) {
        for (const key of Object.keys(stage.$match)) {
          matchFields.add(key);
        }
      }

      if (stage.$sort) {
        for (const key of Object.keys(stage.$sort)) {
          sortFields.add(key);
        }
      }
    }
  }

  return {
    match: [...matchFields],
    sort: [...sortFields]
  };
};

export const suggestIndexesFromHeuristics = (query: {
  match: string[];
  sort: string[];
  command: string;
}): IndexSuggestion[] => {
  const suggestions: IndexSuggestion[] = [];

  for (const field of query.match) {
    suggestions.push({
      field,
      reason: "Field used in equality filter. Index generally reduces full scans."
    });
  }

  for (const field of query.sort) {
    suggestions.push({
      field,
      reason: "Field used in sorting. Index enables sort via index scan."
    });
  }

  if (query.command === "aggregate") {
    if (query.match.length > 0) {
      suggestions.push({
        field: query.match[0],
        reason: "The first stage of the pipeline is $match. Indices greatly accelerate pipelines."
      });
    }
  }

  return suggestions;
};
