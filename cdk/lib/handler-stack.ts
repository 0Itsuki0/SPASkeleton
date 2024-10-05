import { join } from 'path';
import { RustFunction } from 'cargo-lambda-cdk';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway'
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Duration, Size, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';


export interface HandlerStackProps extends StackProps {
    spaTable: Table;
}

export class SPAHandlerStack extends Stack {
    restApi: LambdaRestApi

    constructor(scope: Construct, id: string, props: HandlerStackProps) {
        super(scope, id, props);

        const spaTable = props.spaTable;

        // apigateway lambda
        const apigatewayLambda = new RustFunction(this, 'SPAAPIGatewayLambda', {
            // Path to the root directory.
            manifestPath: join(__dirname, '..', '..', 'lambda/'),
            environment: {
                'TABLE_NAME': spaTable.tableName,
            },
            timeout: Duration.minutes(5)
        });

        const restApi = new LambdaRestApi(this, 'SPAAPIGateway', {
            handler: apigatewayLambda,
            endpointTypes: [EndpointType.REGIONAL],
        });
        this.restApi = restApi

        spaTable.grantFullAccess(apigatewayLambda);
    }
}