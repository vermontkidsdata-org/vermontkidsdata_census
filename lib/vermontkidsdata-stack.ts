import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3notify from 'aws-cdk-lib/aws-s3-notifications';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudFrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as path from 'path';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

const S3_BUCKET_NAME = "S3_BUCKET_NAME";
const REGION = "REGION";
const DEFAULT_S3_BUCKET = 'dev-pipelinestage-dev-censu-uploadsbucket86f42938-dlc1biqgfmp8';
const S3_SERVICE_PRINCIPAL = new iam.ServicePrincipal('s3.amazonaws.com');

export class VermontkidsdataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, local: { ns: string }, props?: cdk.StackProps) {
    super(scope, id, props);

    // Maybe need to always do this
    const bucket = new s3.Bucket(this, 'Uploads bucket', {
      accessControl: s3.BucketAccessControl.PUBLIC_READ_WRITE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,  // Required if public upload - make sure we own the object!
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.HEAD, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*']
        }
      ]
    });

    new cdk.CfnOutput(this, "Bucket name", {
      value: bucket.bucketName
    });

    const bucketName = bucket.bucketName;

    const uploadStatusTable = new dynamodb.Table(this, 'Upload status table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const srcCode = lambda.Code.fromAsset(path.join(__dirname, `/../src`));

    // Upload data function.
    const uploadFunction = new lambda.Function(this, 'Upload Data Function', {
      memorySize: 128,
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'uploadData.main',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {
        S3_BUCKET_NAME: bucketName,
        REGION: this.region,
        STATUS_TABLE: uploadStatusTable.tableName
      }
    });
    bucket.grantRead(uploadFunction);
    const notify = new s3notify.LambdaDestination(uploadFunction);
    notify.bind(this, bucket);
    bucket.addObjectCreatedNotification(notify, {
      suffix: 'csv'
    });
    uploadFunction.grantInvoke(S3_SERVICE_PRINCIPAL);

    // Also shows status of uploads.
    const uploadStatusFunction = new lambda.Function(this, 'Upload Status Function', {
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'uploadData.status',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {
        S3_BUCKET_NAME: bucketName,
        REGION: this.region,
        STATUS_TABLE: uploadStatusTable.tableName
      }
    });
    uploadStatusTable.grantReadWriteData(uploadFunction);
    uploadStatusTable.grantReadWriteData(uploadStatusFunction);

    // The secret where the DB login info is. Grant read access.
    const secret = sm.Secret.fromSecretNameV2(this, 'DB credentials', 'vkd/prod/dbcreds');
    secret.grantRead(uploadFunction);

    const helloWorld = new lambda.Function(this, 'hello-world-function', {
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'hello.main',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY
    });

    const apiChartBarFunction = new lambda.Function(this, 'Bar Chart API Function', {
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'chartsApi.bar',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {
        REGION: this.region
      }
    });
    secret.grantRead(apiChartBarFunction);

    const apiTableFunction = new lambda.Function(this, 'Basic table API Function', {
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'tablesApi.table',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {
        REGION: this.region
      }
    });
    secret.grantRead(apiTableFunction);

    const getSecretValueStatement = new iam.PolicyStatement({
      actions: ["secretsmanager:GetSecretValue"],
      resources: ["*"]
    });
    const tableCensusByGeoFunction = new lambda.Function(this, 'Census Table By Geo Function', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(15),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'tablesApi.getCensusByGeo',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY
    });
    tableCensusByGeoFunction.addToRolePolicy(getSecretValueStatement);
    const getGeosByTypeFunction = new lambda.Function(this, 'Get Geos by Type Function', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(15),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'tablesApi.getGeosByType',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY
    });
    getGeosByTypeFunction.addToRolePolicy(getSecretValueStatement);

    const getCensusTablesSearchFunction = new lambda.Function(this, 'Get Census Tables Search Function', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(15),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'tablesApi.getCensusTablesSearch',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY
    });
    getCensusTablesSearchFunction.addToRolePolicy(getSecretValueStatement);

    const testDBFunction = new lambda.Function(this, 'Test DB Function', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(15),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'testcitylambda.queryDB',
      code: srcCode,
      logRetention: logs.RetentionDays.ONE_DAY
    });
    testDBFunction.addToRolePolicy(getSecretValueStatement);

    const api = new RestApi(this, `${local.ns}-Vermont Kids Data`, {
      // Add OPTIONS call to all resources
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    const hello = api.root.addResource("hello");
    hello.addMethod("GET", new LambdaIntegration(helloWorld));

    const rUpload = api.root.addResource("upload");
    const rUploadById = rUpload.addResource("{uploadId}");
    // Don't need I think, we added the default above
    // rUploadById.addCorsPreflight({
    //   allowOrigins: [ '*' ],
    //   allowMethods: [ 'GET' ]
    // });
    rUploadById.addMethod("GET", new LambdaIntegration(uploadStatusFunction));

    const rChart = api.root.addResource("chart");
    const rChartBar = rChart.addResource("bar");
    const rChartBarById = rChartBar.addResource("{queryId}");
    rChartBarById.addMethod("GET", new LambdaIntegration(apiChartBarFunction));

    const rTable = api.root.addResource("table");
    const rTableTable = rTable.addResource("table");
    const rTableTableById = rTableTable.addResource("{queryId}");
    rTableTableById.addMethod("GET", new LambdaIntegration(apiTableFunction));
    const rTableCensus = rTable.addResource("census");
    const rTableCensusTable = rTableCensus.addResource("{table}");
    const rTableCensusTableByGeo = rTableCensusTable.addResource("{geoType}");
    rTableCensusTableByGeo.addMethod("GET", new LambdaIntegration(tableCensusByGeoFunction));

    const rCodes = api.root.addResource("codes");
    const rCodesGeos = rCodes.addResource("geos");
    const rCodesGeosByType = rCodesGeos.addResource("{geoType}");
    rCodesGeosByType.addMethod("GET", new LambdaIntegration(getGeosByTypeFunction));
    const rCodesCensus = rCodes.addResource("census");
    const rCodesCensusTables = rCodesCensus.addResource("tables");
    const rCodesCensusTablesSearch = rCodesCensusTables.addResource("search");
    rCodesCensusTablesSearch.addMethod("GET", new LambdaIntegration(getCensusTablesSearchFunction));

    const testDBResource = api.root.addResource("testdb");
    testDBResource.addMethod("GET", new LambdaIntegration(testDBFunction));

    // S3 Bucket that CloudFront Distribution will log to
    const s3BucketLog = new s3.Bucket(this, `${local.ns}-s3-log`, {
      // Block all public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // When stack is deleted, delete this bucket also
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Delete contained objects when bucket is deleted
      autoDeleteObjects: true
    });

    // S3 Bucket that will contain static web content and serve as origin to CloudFront Distribution
    const s3BucketWeb = new s3.Bucket(this, `${local.ns}-s3-web`, {
      // Block all public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // When stack is deleted, delete this bucket also
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Delete contained objects when bucket is deleted
      autoDeleteObjects: true
    });

    // CloudFront Distribution pointing to S3 Web Bucket for origin and S3 Log Bucket for logging
    // Defaults:
    //  - min protocol version: TLS 1.2
    //  - max HTTP version:     HTTP/2
    const cloudFrontDistrib = new cloudFront.Distribution(this, `${local.ns}-cloudfront`, {
      // Default behavior config
      defaultBehavior: {
        // Point to S3 Web Bucket as origin
        origin: new cloudFrontOrigins.S3Origin(s3BucketWeb),
        // HTTP requests will be redirected to HTTPS
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // Only allow GET, HEAD, OPTIONS methods
        allowedMethods: cloudFront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        // Cache GET, HEAD, OPTIONS
        cachedMethods: cloudFront.CachedMethods.CACHE_GET_HEAD_OPTIONS
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        },{
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ],
      // Enable default logging
      enableLogging: true,
      // Point to S3 Log Bucket
      logBucket: s3BucketLog,
      // Log prefix
      logFilePrefix: `cloudfront-access-logs-${local.ns}`,
      // If index.html is not specified in URL, assume it rather than given a 404 error
      defaultRootObject: 'index.html',
      // Allow IPv6 DNS requests with an IPv6 address
      enableIpv6: true,
      // Restrict site to the USA and Canada
      geoRestriction: cloudFront.GeoRestriction.allowlist('US', 'CA'),
      // 100 is USA, Canada, Europe and Israel
      priceClass: cloudFront.PriceClass.PRICE_CLASS_100,
      // Descriptive comment
      comment: `CloudFront distribution in ${local.ns} environment`
    });

    // Deploy the static web content to the S3 Web Bucket
    const deploymentToS3Web = new s3deploy.BucketDeployment(this, `${local.ns}-s3deploy`, {
      // Static web content source
      // Note: the path to the source must be kept updated in case of repo folder restructuring or
      // refactoring
      sources: [s3deploy.Source.asset(path.join(__dirname, '../ui/build'))],
      // Point to the S3 Web Bucket
      destinationBucket: s3BucketWeb
    });

    new cdk.CfnOutput(this, "CloudFront bucket", {
      value: s3BucketWeb.bucketName
    });
    new cdk.CfnOutput(this, "CloudFront DNS", {
      value: cloudFrontDistrib.domainName
    });
  }
}