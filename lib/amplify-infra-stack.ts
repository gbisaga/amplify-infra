import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class AmplifyInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const helloWorld = new NodejsFunction(this, 'hello-world-function', {
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/hello.ts`),
      logRetention: logs.RetentionDays.ONE_DAY
    });
  
    const bucket = new s3.Bucket(this, 'Uploads bucket', {
      accessControl: s3.BucketAccessControl.PUBLIC_READ_WRITE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,  // Required if public upload - make sure we own the object!
      cors: [
        {
          allowedMethods: [ s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.HEAD, s3.HttpMethods.PUT ],
          allowedOrigins: [ '*' ],
          allowedHeaders: [ '*' ]
        }
      ]
    });

    const restApi = new apigw.RestApi(this, 'hello-api', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['*']
      }
    });
    restApi.root
      .resourceForPath("hello")
      .addMethod('GET', new apigw.LambdaIntegration(helloWorld));

    const app = new amplify.App(this, "demo-app", {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: "gbisaga",
        repository: "amplify-application-demo",
        oauthToken: cdk.SecretValue.secretsManager('github-token')
      }),
      environmentVariables: {
        // Note this turns into REACT_APP_ENDPOINT in the react app itself.
        // Need to add these in the environment vars of amplify.yml
        ENDPOINT: restApi.url,
        REGION: this.region,
        BUCKET: bucket.bucketName
      }
    });

    app.addBranch("main");
  } 
}
