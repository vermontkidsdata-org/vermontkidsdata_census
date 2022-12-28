import { APIGatewayProxyEventV2 } from 'aws-lambda';
import * as tablesApi from '../src/tablesApi';

describe('custom table API', () => {
  beforeEach(() => {
    process.env.REGION = 'us-east-1';
    process.env.NAMESPACE = 'qa';
  });

  it('returns basic data', async () => {
    const ret = await tablesApi.table({
      pathParameters: {
        queryId: '58'
      }
    } as unknown as APIGatewayProxyEventV2) as any;
    // console.log(`returns basic data`, ret);
    // {
    //     statusCode: 200,
    //     headers: {
    //       'Access-Control-Allow-Origin': '*',
    //       'Content-Type': 'application/json',
    //       'Access-Control-Allow-Methods': 'GET'
    //     },
    //     body: '{"id":"58","metadata":{"config":{"title":"query 58 metadata"}},"columns":[{"id":"id","label":"id"},{"id":"year","label":"year"},{"id":"type","label":"type"},{"id":"infant","label":"Infant"},{"id":"toddler","label":"Toddler"},{"id":"preschool","label":"Preschool"}],"rows":[{"id":1,"year":2020,"type":"Center","infant":1942,"toddler":1666,"preschool":8564},{"id":2,"year":2020,"type":"Licensed","infant":45,"toddler":49,"preschool":136},{"id":3,"year":2020,"type":"Registered","infant":537,"toddler":541,"preschool":1039}]}'
    //   }
    // Body
    // {
    //   "id": "58",
    //   "metadata": { "config": { "title": "Reading Proficiency at the End of Third Grade", "yAxis": { "type": "percent" } } },
    //   "columns": [{ "id": "id", "label": "id" }, { "id": "year", "label": "year" }, { "id": "type", "label": "type" }, { "id": "infant", "label": "Infant" }, { "id": "toddler", "label": "Toddler" }, { "id": "preschool", "label": "Preschool" }],
    //   "rows": [{ "id": 1, "year": 2020, "type": "Center", "infant": 1942, "toddler": 1666, "preschool": 8564 }, { "id": 2, "year": 2020, "type": "Licensed", "infant": 45, "toddler": 49, "preschool": 136 }, { "id": 3, "year": 2020, "type": "Registered", "infant": 537, "toddler": 541, "preschool": 1039 }]
    // }
    expect(ret.statusCode).toBe(200);
    const body = JSON.parse(ret.body);
    expect(body.columns.length).toBe(6);
  });
  it('has metadata config', async () => {
    const ret = await tablesApi.table({
      pathParameters: {
        queryId: '58'
      }
    } as unknown as APIGatewayProxyEventV2) as any;
    expect(ret.statusCode).toBe(200);
    const body = JSON.parse(ret.body);
    expect(body.metadata).not.toBeUndefined();
    expect(body.metadata.config).not.toBeUndefined();
    expect(body.metadata.config.title).not.toBeUndefined();
  });
  it('errors on bad columns parameter', async () => {
    const ret = await tablesApi.table({
      pathParameters: {
        queryId: '58'
      },
      queryStringParameters: {
        columns: 'this-column-does-not-exit'
      }
    } as unknown as APIGatewayProxyEventV2) as any;
    expect(ret.statusCode).toBe(400);
  });
  it('supports columns parameter', async () => {
    const ret = await tablesApi.table({
      pathParameters: {
        queryId: '58'
      },
      queryStringParameters: {
        columns: 'infant,year'
      }
    } as unknown as APIGatewayProxyEventV2) as any;
    expect(ret.statusCode).toBe(200);
    // {
    //   "id": "58",
    //   "metadata": { "config": { "title": "Reading Proficiency at the End of Third Grade", "yAxis": { "type": "percent" } } },
    //   "columns": [{ "id": "infant", "label": "Infant" }, { "id": "year", "label": "year" }],
    //   "rows": [{ "infant": 1942, "year": 2020 }, { "infant": 45, "year": 2020 }, { "infant": 537, "year": 2020 }]
    // }
    const body = JSON.parse(ret.body);
    // console.log(JSON.stringify(body));
    expect(body.columns.length).toBe(2);
    expect(body.columns[0].id).toBe("infant");
    expect(body.columns[1].id).toBe("year");
  });
});
