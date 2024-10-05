#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SPAHandlerStack } from '../lib/handler-stack';
import { SPADatabaseStack } from '../lib/database-stack';
import { FrontEndStack } from '../lib/frontend-stack';

const app = new cdk.App();
const dbStack = new SPADatabaseStack(app, 'SPADatabaseStack')
const handlerStack = new SPAHandlerStack(app, 'SPAHandlerStack', {
    spaTable: dbStack.spaTable,
});
const frontEndStack = new FrontEndStack(app, 'SPAFrontendStack', {
    endpointUrl: handlerStack.restApi.url
})