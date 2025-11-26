import pino from "pino";
import pretty from 'pino-pretty'

const logger = pino(pretty({ sync: true }));

logger.info("Hello from mongo-bullet!");

const SLOW_THRESHOLD = 100;

const filterQueries = new Set();

export const initializeMongoBullet = (connection: any) => {
  connection.on("commandSucceeded", (event: any) => {

    if (event.duration < SLOW_THRESHOLD) return;

    const command = event.commandName;
 
    const relevant =
      ["find", "aggregate", "update", "insert", "delete"].includes(command);

    if (!relevant) return;

    const reply = event.reply;

    const collection =
      reply?.cursor?.ns?.split(".")[1] ||
      event.command?.collection ||
      event.command?.[command];

    filterQueries.add({
      collection, 
      duration: event.duration, 
      command
    })

    if (filterQueries.has({
      collection, 
      duration: event.duration, 
      command
    })) return

    logger.warn({
      type: "SLOW_QUERY",
      command,
      collection,
      duration: `${event.duration}ms`,
    });
  });
};
