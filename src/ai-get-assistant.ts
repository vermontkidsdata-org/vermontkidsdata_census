import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Assistant, getAllAssistants, getAssistantKey, getAssistantKeyAttribute } from "./db-utils";
import { makePowerTools, prepareAPIGateway } from "./lambda-utils";
import { validateAPIAuthorization } from "./ai-utils";

const pt = makePowerTools({ prefix: 'ai-get-asssistants' });

export async function lambdaHandler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const ret = validateAPIAuthorization(event);
  if (ret) {
    return ret;
  }

  const id = event.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing id",
      })
    }
  }

  const assistant = await Assistant.get(getAssistantKey(id));
  return {
    statusCode: 200,
    body: JSON.stringify({
      assistant: assistant?.Item,
    })
  }
}

export const handler = prepareAPIGateway(lambdaHandler);

// if (!module.parent) {
//   (async () => {
//     const event = {
//       queryStringParameters: {
//         key: VKD_API_KEY,
//       },
//     } as any;
//     const result = await lambdaHandler(event);
//     console.log(result);
//   })();
// }