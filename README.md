# Vermont Kids' Data project

Need to create some secrets first.

aws secretsmanager create-secret --name VKDPipelineGitHubToken --description "The GitHub access token for the VKD pipeline." --secret-string "{\"access-token\":\"XXXXXXXXXXXX\"}"
aws secretsmanager create-secret --name "vkd/prod/dbcreds" --secret-string "{\"username\":\"XXXXXXXXXXXX\", \"password\":\"XXXXXXXXXXXX\", \"host\": \"XXXXXXXX\"}"

## Useful CDK commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
