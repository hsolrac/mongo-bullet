import pino from "pino";
import pretty from "pino-pretty";

const logger = pino(pretty({ sync: true }));

const SLOW_THRESHOLD = 100;

const pendingCommands: Record<number, any> = {};

const seen = new Set<string>();

export const initializeMongoBullet = (connection: any) => {
  logger.info(" ===== Mongo bullet started ==== ")
  connection.on("commandStarted", (event: any) => {
    const command = event.commandName;

    if (!["find", "aggregate", "update", "insert", "delete"].includes(command))
      return;

    pendingCommands[event.requestId] = {
      command,
      startedAt: Date.now(),
      filter: event.command?.filter,
      pipeline: event.command?.pipeline,
      sort: event.command?.sort,
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

    const duration = event.duration;
    if (duration < SLOW_THRESHOLD) {
      delete pendingCommands[event.requestId];
      return;
    }

    const key = `${data.collection}:${data.command}:${duration}`;
    if (seen.has(key)) {
      delete pendingCommands[event.requestId];
      return;
    }

    seen.add(key);

    logger.warn({
      type: "SLOW_QUERY",
      command: data.command,
      collection: data.collection,
      duration: `${duration}ms`,
      filter: data.filter,
      pipeline: data.pipeline,
      sort: data.sort
    });

    delete pendingCommands[event.requestId];
  });
};
;
