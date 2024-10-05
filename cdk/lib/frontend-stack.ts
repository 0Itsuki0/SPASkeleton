import { join } from 'path';
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { CfnService } from 'aws-cdk-lib/aws-apprunner';

export interface FrontEndStackProps extends StackProps {
    endpointUrl: string;
}

export class FrontEndStack extends Stack {
    endpointUrl: string;

    constructor(scope: Construct, id: string, props: FrontEndStackProps) {
        super(scope, id, props);
        this.endpointUrl = props.endpointUrl

        // iam roles
        const instanceRole = new Role(this, 'SPAAppRunnerInstanceRole', {
            assumedBy: new ServicePrincipal('tasks.apprunner.amazonaws.com'),
        })
        instanceRole.applyRemovalPolicy(RemovalPolicy.DESTROY)

        const accessRole = new Role(this, 'SPAAppRunnerAccessRole', {
            assumedBy: new ServicePrincipal('build.apprunner.amazonaws.com'),
        })
        accessRole.applyRemovalPolicy(RemovalPolicy.DESTROY)

        // docker image asset
        const imageAsset = new DockerImageAsset(
            this,
            "SPAImageAsset", {
            directory: join(__dirname, '..', '..', 'nextjs'),
        })
        imageAsset.repository.grantPull(accessRole)

        // app runner
        const app = new CfnService(this, "SPANextJs", {
            sourceConfiguration: {
                imageRepository: {
                    imageIdentifier: imageAsset.imageUri,
                    imageRepositoryType: "ECR",
                    imageConfiguration: {
                        port: "8080",
                        runtimeEnvironmentVariables: [
                            {
                                name: "API_ENDPOINT",
                                value: this.endpointUrl
                            }
                        ]
                    },
                },
                autoDeploymentsEnabled: true,
                authenticationConfiguration: {
                    accessRoleArn: accessRole.roleArn
                }
            },
            instanceConfiguration: {
                instanceRoleArn: instanceRole.roleArn
            },

        })
        app.applyRemovalPolicy(RemovalPolicy.DESTROY)

    }
}