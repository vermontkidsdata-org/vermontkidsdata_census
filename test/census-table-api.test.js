"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tablesApi = require("../src/tablesApi");
const dbUtils = require("../src/db-utils");
describe('Census Table API', () => {
    let queryDBSpy;
    beforeEach(() => {
        // Stub all external dependency functions of module to be tested
        queryDBSpy = jest.spyOn(dbUtils, 'queryDB');
    });
    // Actions to be done after each test
    afterEach(() => {
        // Restore the stubs
        queryDBSpy.mockRestore();
    });
    // Validate it has CORS headers
    function expectCORS(ret) {
        expect(Object.entries(ret.headers).filter(h => h[0] == 'Access-Control-Allow-Origin').length).toBe(1);
    }
    it('S1701 -- unknown vars', async () => {
        // queryDBSpy.mock.invocationCall in mockResolvedValue(BOGUS_BRANCH_NAME);
        const ret = await tablesApi.getCensusByGeo({
            pathParameters: {
                table: 'S1701',
                geoType: 'head_start'
            }, queryStringParameters: {
                variables: 'S1701_C01_044E,S1601_C01_001E,S1601_C01_002E'
            }
        });
        expect(ret.statusCode).toBe(400);
        const body = JSON.parse(ret.body);
        expect(body.message).toContain('S1601_C01_001E,S1601_C01_002E');
        expect(body.message).not.toContain('S1701_C01_044E');
        // Make sure even the error response has CORS headers
        expectCORS(ret);
    });
    it('getGeosByType for county', async () => {
        const ret = await tablesApi.getGeosByType({
            pathParameters: { geoType: 'county' }
        });
        const resp = JSON.parse(ret.body);
        expect(resp.geos).toBeDefined();
        expect(resp.geos.length).toBe(14);
        expectCORS(ret);
    });
    it('HS region, valid year for acs1, only two variables', async () => {
        var _a, _b;
        const ret = await tablesApi.getCensusByGeo({
            pathParameters: {
                table: 'B09001',
                geoType: 'head_start'
            }, queryStringParameters: {
                year: '2005',
                dataset: 'acs/acs1',
                variables: 'B09001_002E,B09001_001E'
            }
        });
        expect(ret.statusCode).toBe(200);
        const body = JSON.parse(ret.body);
        expect((_a = body.metadata.variables) === null || _a === void 0 ? void 0 : _a.length).toBe(2);
        expect((_b = body.metadata.variables) === null || _b === void 0 ? void 0 : _b.toString()).toBe('B09001_002E,B09001_001E');
        expect(body.columns.length).toBe(3);
        expect(body.columns[0].id).toBe('geo');
        expect(body.columns[1].id).toBe('B09001_002E');
        expect(body.columns[2].id).toBe('B09001_001E');
        expectCORS(ret);
    });
    it('AHS district', async () => {
        const ret = await tablesApi.getCensusByGeo({
            pathParameters: {
                table: 'B09001',
                geoType: 'ahs_district'
            }, queryStringParameters: {}
        });
        expect(ret.statusCode).toBe(200);
        const body = JSON.parse(ret.body);
        expect(body.columns.length).toBe(11);
        expect(body.rows.length).toBe(13);
        expect(body.rows[0].geo).toBe("Barre");
        expect(body.rows[0].B09001_001E).toBe(12164);
        expect(body.rows[12].geo).toBe("Vermont");
        expect(body.rows[12].B09001_001E).toBe(115632);
        expectCORS(ret);
    });
    it('HS region, invalid year', async () => {
        const ret = await tablesApi.getCensusByGeo({
            pathParameters: {
                table: 'B09001',
                geoType: 'head_start'
            }, queryStringParameters: {
                year: '1776'
            }
        });
        expect(ret.statusCode).toBe(400);
        const body = JSON.parse(ret.body);
        expect(body.message).toContain('invalid year/dataset combination');
        expectCORS(ret);
    });
    it('verify even a 500 has a CORS header', async () => {
        const ret = await tablesApi.getCensusByGeo(undefined);
        console.log('ret', ret);
        expect(ret.statusCode).toBe(500);
        expectCORS(ret);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2Vuc3VzLXRhYmxlLWFwaS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2Vuc3VzLXRhYmxlLWFwaS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsOENBQThDO0FBQzlDLDJDQUEyQztBQVEzQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQzlCLElBQUksVUFBZSxDQUFDO0lBQ3BCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDWixnRUFBZ0U7UUFDaEUsVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUMsQ0FBQyxDQUFDO0lBQ0gscUNBQXFDO0lBQ3JDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDWCxvQkFBb0I7UUFDcEIsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzdCLENBQUMsQ0FBQyxDQUFDO0lBRUgsK0JBQStCO0lBQy9CLFNBQVMsVUFBVSxDQUFDLEdBQW1CO1FBQ25DLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksNkJBQTZCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUcsQ0FBQztJQUVELEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLElBQUksRUFBRTtRQUNuQywwRUFBMEU7UUFFMUUsTUFBTSxHQUFHLEdBQUcsTUFBTSxTQUFTLENBQUMsY0FBYyxDQUFDO1lBQ3ZDLGNBQWMsRUFBRTtnQkFDWixLQUFLLEVBQUUsT0FBTztnQkFDZCxPQUFPLEVBQUUsWUFBWTthQUN4QixFQUFFLHFCQUFxQixFQUFFO2dCQUN0QixTQUFTLEVBQUUsOENBQThDO2FBQzVEO1NBQ2lDLENBQW1CLENBQUM7UUFFMUQsTUFBTSxDQUFD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QUFFLFFBQVE7Z0JBQ2YsT0FBTyxFQUFFLFlBQVk7YUFDdEIsRUFBRSxxQkFBcUIsRUFBRTtnQkFDeEIsSUFBSSxFQUFFLE1BQU07YUFDYjtTQUNtQyxDQUFtQixDQUFDO1FBQzFELE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBNEIsQ0FBQztRQUM3RCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ25FLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLLElBQUcsRUFBRTtRQUNoRCxNQUFNLEdBQUcsR0FBRyxNQUFNLFNBQVMsQ0FBQyxjQUFjLENBQUMsU0FBOEMsQ0FBbUIsQ0FBQztRQUM3RyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN4QixNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50VjIsIEFQSUdhdGV3YXlQcm94eVJlc3VsdFYyIH0gZnJvbSAnYXdzLWxhbWJkYSc7XHJcbmltcG9ydCAqIGFzIHRhYmxlc0FwaSBmcm9tICcuLi9zcmMvdGFibGVzQXBpJztcclxuaW1wb3J0ICogYXMgZGJVdGlscyBmcm9tICcuLi9zcmMvZGItdXRpbHMnO1xyXG5cclxuaW50ZXJmYWNlIExhbWJkYVJlc3BvbnNlIHtcclxuICAgIGJvZHk6IHN0cmluZyxcclxuICAgIGhlYWRlcnM6IHsgW2hlYWRlcjogc3RyaW5nXTogc3RyaW5nIH0sXHJcbiAgICBzdGF0dXNDb2RlOiBudW1iZXJcclxufVxyXG5cclxuZGVzY3JpYmUoJ0NlbnN1cyBUYWJsZSBBUEknLCAoKSA9PiB7XHJcbiAgICBsZXQgcXVlcnlEQlNweTogYW55O1xyXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XHJcbiAgICAgICAgLy8gU3R1YiBhbGwgZXh0ZXJuYWwgZGVwZW5kZW5jeSBmdW5jdGlvbnMgb2YgbW9kdWxlIHRvIGJlIHRlc3RlZFxyXG4gICAgICAgIHF1ZXJ5REJTcHkgPSBqZXN0LnNweU9uKGRiVXRpbHMsICdxdWVyeURCJyk7XHJcbiAgICB9KTtcclxuICAgIC8vIEFjdGlvbnMgdG8gYmUgZG9uZSBhZnRlciBlYWNoIHRlc3RcclxuICAgIGFmdGVyRWFjaCgoKSA9PiB7XHJcbiAgICAgICAgLy8gUmVzdG9yZSB0aGUgc3R1YnNcclxuICAgICAgICBxdWVyeURCU3B5Lm1vY2tSZXN0b3JlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBWYWxpZGF0ZSBpdCBoYXMgQ09SUyBoZWFkZXJzXHJcbiAgICBmdW5jdGlvbiBleHBlY3RDT1JTKHJldDogTGFtYmRhUmVzcG9uc2UpOiB2b2lkIHtcclxuICAgICAgICBleHBlY3QoT2JqZWN0LmVudHJpZXMocmV0LmhlYWRlcnMpLmZpbHRlcihoID0+IGhbMF0gPT0gJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicpLmxlbmd0aCkudG9CZSgxKTtcclxuICAgIH1cclxuXHJcbiAgICBpdCgnUzE3MDEgLS0gdW5rbm93biB2YXJzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIC8vIHF1ZXJ5REJTcHkubW9jay5pbnZvY2F0aW9uQ2FsbCBpbiBtb2NrUmVzb2x2ZWRWYWx1ZShCT0dVU19CUkFOQ0hfTkFNRSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJldCA9IGF3YWl0IHRhYmxlc0FwaS5nZXRDZW5zdXNCeUdlbyh7XHJcbiAgICAgICAgICAgIHBhdGhQYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgICAgICAgICB0YWJsZTogJ1MxNzAxJyxcclxuICAgICAgICAgICAgICAgIGdlb1R5cGU6ICdoZWFkX3N0YXJ0J1xyXG4gICAgICAgICAgICB9LCBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IHtcclxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogJ1MxNzAxX0MwMV8wNDRFLFMxNjAxX0MwMV8wMDFFLFMxNjAxX0MwMV8wMDJFJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBhcyB1bmtub3duIGFzIEFQSUdhdGV3YXlQcm94eUV2ZW50VjIpIGFzIExhbWJkYVJlc3BvbnNlO1xyXG5cclxuICAgICAgICBleHBlY3QocmV0LnN0YXR1c0NvZGUpLnRvQmUoNDAwKTtcclxuICAgICAgICBjb25zdCBib2R5ID0gSlNPTi5wYXJzZShyZXQuYm9keSkgYXMgdGFibGVzQXBpLkVycm9yUmVzcG9uc2U7XHJcbiAgICAgICAgZXhwZWN0KGJvZHkubWVzc2FnZSkudG9Db250YWluKCdTMTYwMV9DMDFfMDAxRSxTMTYwMV9DMDFfMDAyRScpO1xyXG4gICAgICAgIGV4cGVjdChib2R5Lm1lc3NhZ2UpLm5vdC50b0NvbnRhaW4oJ1MxNzAxX0MwMV8wNDRFJyk7XHJcbiAgICAgICAgLy8gTWFrZSBzdXJlIGV2ZW4gdGhlIGVycm9yIHJlc3BvbnNlIGhhcyBDT1JTIGhlYWRlcnNcclxuICAgICAgICBleHBlY3RDT1JTKHJldCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnZ2V0R2Vvc0J5VHlwZSBmb3IgY291bnR5JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJldCA9IGF3YWl0IHRhYmxlc0FwaS5nZXRHZW9zQnlUeXBlKHtcclxuICAgICAgICAgICAgcGF0aFBhcmFtZXRlcnM6IHsgZ2VvVHlwZTogJ2NvdW50eScgfVxyXG4gICAgICAgIH0gYXMgdW5rbm93biBhcyBBUElHYXRld2F5UHJveHlFdmVudFYyKSBhcyBMYW1iZGFSZXNwb25zZTtcclxuICAgICAgICBjb25zdCByZXNwID0gSlNPTi5wYXJzZShyZXQuYm9keSkgYXMgdGFibGVzQXBpLkdldEdlb3NCeVR5cGVSZXNwb25zZTtcclxuICAgICAgICBleHBlY3QocmVzcC5nZW9zKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICAgIGV4cGVjdChyZXNwLmdlb3MubGVuZ3RoKS50b0JlKDE0KTtcclxuICAgICAgICBleHBlY3RDT1JTKHJldCk7XHJcbiAgICB9KTtcclxuICAgIGl0KCdIUyByZWdpb24sIHZhbGlkIHllYXIgZm9yIGFjczEsIG9ubHkgdHdvIHZhcmlhYmxlcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgICBjb25zdCByZXQgPSBhd2FpdCB0YWJsZXNBcGkuZ2V0Q2Vuc3VzQnlHZW8oe1xyXG4gICAgICAgICAgICBwYXRoUGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgICAgICAgdGFibGU6ICdCMDkwMDEnLFxyXG4gICAgICAgICAgICAgICAgZ2VvVHlwZTogJ2hlYWRfc3RhcnQnXHJcbiAgICAgICAgICAgIH0sIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgICAgICAgeWVhcjogJzIwMDUnLFxyXG4gICAgICAgICAgICAgICAgZGF0YXNldDogJ2Fjcy9hY3MxJyxcclxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogJ0IwOTAwMV8wMDJFLEIwOTAwMV8wMDFFJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBhcyB1bmtub3duIGFzIEFQSUdhdGV3YXlQcm94eUV2ZW50VjIpIGFzIExhbWJkYVJlc3BvbnNlO1xyXG4gICAgICAgIGV4cGVjdChyZXQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xyXG4gICAgICAgIGNvbnN0IGJvZHk6IHRhYmxlc0FwaS5HZXRDZW5zdXNCeUdlb1Jlc3BvbnNlID0gSlNPTi5wYXJzZShyZXQuYm9keSk7XHJcbiAgICAgICAgZXhwZWN0KGJvZHkubWV0YWRhdGEudmFyaWFibGVzPy5sZW5ndGgpLnRvQmUoMik7XHJcbiAgICAgICAgZXhwZWN0KGJvZHkubWV0YWRhdGEudmFyaWFibGVzPy50b1N0cmluZygpKS50b0JlKCdCMDkwMDFfMDAyRSxCMDkwMDFfMDAxRScpO1xyXG4gICAgICAgIGV4cGVjdChib2R5LmNvbHVtbnMubGVuZ3RoKS50b0JlKDMpO1xyXG4gICAgICAgIGV4cGVjdChib2R5LmNvbHVtbnNbMF0uaWQpLnRvQmUoJ2dlbycpO1xyXG4gICAgICAgIGV4cGVjdChib2R5LmNvbHVtbnNbMV0uaWQpLnRvQmUoJ0IwOTAwMV8wMDJFJyk7XHJcbiAgICAgICAgZXhwZWN0KGJvZHkuY29sdW1uc1syXS5pZCkudG9CZSgnQjA5MDAxXzAwMUUnKTtcclxuICAgICAgICBleHBlY3RDT1JTKHJldCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnQUhTIGRpc3RyaWN0JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJldCA9IGF3YWl0IHRhYmxlc0FwaS5nZXRDZW5zdXNCeUdlbyh7XHJcbiAgICAgICAgICAgIHBhdGhQYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgICAgICAgICB0YWJsZTogJ0IwOTAwMScsXHJcbiAgICAgICAgICAgICAgICBnZW9UeXBlOiAnYWhzX2Rpc3RyaWN0J1xyXG4gICAgICAgICAgICB9LCBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IHt9XHJcbiAgICAgICAgfSBhcyB1bmtub3duIGFzIEFQSUdhdGV3YXlQcm94eUV2ZW50VjIpIGFzIExhbWJkYVJlc3BvbnNlO1xyXG4gICAgICAgIGV4cGVjdChyZXQuc3RhdHVzQ29kZSkudG9CZSgyMDApO1xyXG4gICAgICAgIGNvbnN0IGJvZHk6IHRhYmxlc0FwaS5HZXRDZW5zdXNCeUdlb1Jlc3BvbnNlID0gSlNPTi5wYXJzZShyZXQuYm9keSk7XHJcbiAgICAgICAgZXhwZWN0KGJvZHkuY29sdW1ucy5sZW5ndGgpLnRvQmUoMTEpO1xyXG4gICAgICAgIGV4cGVjdChib2R5LnJvd3MubGVuZ3RoKS50b0JlKDEzKTtcclxuICAgICAgICBleHBlY3QoYm9keS5yb3dzWzBdLmdlbykudG9CZShcIkJhcnJlXCIpO1xyXG4gICAgICAgIGV4cGVjdChib2R5LnJvd3NbMF0uQjA5MDAxXzAwMUUpLnRvQmUoMTIxNjQpO1xyXG4gICAgICAgIGV4cGVjdChib2R5LnJvd3NbMTJdLmdlbykudG9CZShcIlZlcm1vbnRcIik7XHJcbiAgICAgICAgZXhwZWN0KGJvZHkucm93c1sxMl0uQjA5MDAxXzAwMUUpLnRvQmUoMTE1NjMyKTtcclxuICAgICAgICBleHBlY3RDT1JTKHJldCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnSFMgcmVnaW9uLCBpbnZhbGlkIHllYXInLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmV0ID0gYXdhaXQgdGFibGVzQXBpLmdldENlbnN1c0J5R2VvKHtcclxuICAgICAgICAgICAgcGF0aFBhcmFtZXRlcnM6IHtcclxuICAgICAgICAgICAgICB0YWJsZTogJ0IwOTAwMScsXHJcbiAgICAgICAgICAgICAgZ2VvVHlwZTogJ2hlYWRfc3RhcnQnXHJcbiAgICAgICAgICAgIH0sIHF1ZXJ5U3RyaW5nUGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgICAgIHllYXI6ICcxNzc2J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGFzIHVua25vd24gYXMgQVBJR2F0ZXdheVByb3h5RXZlbnRWMikgYXMgTGFtYmRhUmVzcG9uc2U7XHJcbiAgICAgICAgICBleHBlY3QocmV0LnN0YXR1c0NvZGUpLnRvQmUoNDAwKTtcclxuICAgICAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKHJldC5ib2R5KSBhcyB0YWJsZXNBcGkuRXJyb3JSZXNwb25zZTtcclxuICAgICAgICAgIGV4cGVjdChib2R5Lm1lc3NhZ2UpLnRvQ29udGFpbignaW52YWxpZCB5ZWFyL2RhdGFzZXQgY29tYmluYXRpb24nKTtcclxuICAgICAgICAgIGV4cGVjdENPUlMocmV0KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCd2ZXJpZnkgZXZlbiBhIDUwMCBoYXMgYSBDT1JTIGhlYWRlcicsIGFzeW5jKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJldCA9IGF3YWl0IHRhYmxlc0FwaS5nZXRDZW5zdXNCeUdlbyh1bmRlZmluZWQgYXMgdW5rbm93biBhcyBBUElHYXRld2F5UHJveHlFdmVudFYyKSBhcyBMYW1iZGFSZXNwb25zZTtcclxuICAgICAgICBjb25zb2xlLmxvZygncmV0JywgcmV0KTtcclxuICAgICAgICBleHBlY3QocmV0LnN0YXR1c0NvZGUpLnRvQmUoNTAwKTtcclxuICAgICAgICBleHBlY3RDT1JTKHJldCk7XHJcbiAgICB9KTtcclxufSk7XHJcbiJdfQ==