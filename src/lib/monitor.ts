import { logger } from "./logger";
import { SLOW_THRESHOLD } from "./constants";
import { extractQueryFields, suggestIndexesFromHeuristics } from "./analyzer";
import { CommandData } from "./types";

const pendingCommands: Record<number, CommandData> = {};
const seen = new Set<string>();

export const initializeMongoBullet = (connection: any) => {
  logger.info("===== Mongo bullet started =====");

  connection.on("commandStarted", (event: any) => {
    const command = event.commandName;

    if (!["find", "aggregate", "update", "delete"].includes(command)) return;

    pendingCommands[event.requestId] = {
      command,
      filter: event.command?.filter,
      sort: event.command?.sort,
      pipeline: event.command?.pipeline,
      collection:
        event.command?.find ||
        event.command?.aggregate ||
        event.command?.update ||
        event.command?.delete
    };
  });

  connection.on("commandSucceeded", (event: any) => {
    const data = pendingCommands[event.requestId];
    if (!data) return;
    delete pendingCommands[event.requestId];

    const duration = event.duration;
    if (duration < SLOW_THRESHOLD) return;

    const key = `${data.collection}:${data.command}:${duration}`;
    if (seen.has(key)) return;
    seen.add(key);

    const fields = extractQueryFields(data);
    const indexSuggestions = suggestIndexesFromHeuristics({
      match: fields.match,
      sort: fields.sort,
      command: data.command
    });

    logger.warn({
      type: "SLOW_QUERY",
      collection: data.collection,
      command: data.command,
      duration: `${duration}ms`,
      suggestedIndexes: indexSuggestions
    });
  });
};
