import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class SPADatabaseStack extends Stack {
    spaTable: Table;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.spaTable = new Table(this, 'SPATable', {
            partitionKey: { name: 'id', type: AttributeType.STRING },
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.RETAIN,
        });

        this.spaTable.addGlobalSecondaryIndex({
            indexName: 'gsi-userid',
            partitionKey: { name: 'user_id', type: AttributeType.STRING },
            sortKey: { name: 'last_modified', type: AttributeType.NUMBER },
        });
    }
}