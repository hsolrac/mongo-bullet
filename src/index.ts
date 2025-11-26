console.log("Hello from mongo-bullet!");

export const analiseQuery = (connection: any) => {
  connection.on('commandStarted', (event: any) => {
    console.log('[MongoDB] START:', {
      command: event.commandName,
      collection: event.command?.find || event.command?.aggregate,
      filter: event.command?.filter,
      pipeline: event.command?.pipeline,
    });
  });

  connection.on('commandFailed', (event: any) => {
    console.log('[MongoDB] FAIL:', {
      command: event.commandName,
      failure: event.failure,
    });
  });
}
