import pino from "pino";
const logger = pino();


console.log("Hello from mongo-bullet!");

export const analiseQuery = (connection: any) => {
  connection.on('commandStarted', (event: any) => {
    const collection =
      event.command[event.commandName] ||
      event.command?.collection;

    logger.info({
      type: "START",
      command: event.commandName,
      collection,
      filter: event.command?.filter,
      pipeline: event.command?.pipeline
    });
  });

  connection.on('commandFailed', (event: any) => {
    logger.error({
      type: "FAIL",
      command: event.commandName,
      failure: event.failure
    });
  });
}
