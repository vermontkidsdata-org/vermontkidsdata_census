import { injectLambdaContext, Logger } from '@aws-lambda-powertools/logger';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CORSConfigDefault } from './cors-config';
import { doDBClose, doDBCommit, doDBInsert, doDBOpen, doDBQuery } from './db-utils';

// Set your service name. This comes out in service lens etc.
const serviceName = `queries-api-post-${process.env.NAMESPACE}`;
const logger = new Logger({
  logLevel: process.env.LOG_LEVEL || 'INFO',
  serviceName
});
const tracer = new Tracer({ serviceName });

export async function lambdaHandler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  logger.info({message: 'event 👉', event});
  const body = event.body;

  if (body == null) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'empty body passed'
      })
    };
  }

  const { name, sqlText, columnMap, metadata } = JSON.parse(body);
  if (name == null || sqlText == null) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'POST requires at least name and sqlText'
      })
    };
  }

  await doDBOpen();
  try {
    // Don't allow if name already exists
    const queryRows = await doDBQuery('SELECT id, name FROM queries where name=?', [name]);
    if (queryRows.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'POST requires unique name'
        })
      };
    }

    const id = await doDBInsert('insert into queries (name, sqlText, columnMap, metadata) values (?,?,?,?)',
      [name, sqlText, columnMap, metadata]);
    await doDBCommit();

    return {
      statusCode: 200,
      body: JSON.stringify({
        id
      })
    };
  } finally {
    await doDBClose();
  }
}

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger))
  .use(
    // cors(new CORSConfig(process.env))
    cors(CORSConfigDefault)
  );
