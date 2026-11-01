/**
 * SitePulse - DynamoDB shared client and utilities
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

// Table names from environment variables
const TABLES = {
  WEBSITES: process.env.WEBSITES_TABLE || 'sitepulse-websites',
  CHECKS: process.env.CHECKS_TABLE || 'sitepulse-checks',
  INCIDENTS: process.env.INCIDENTS_TABLE || 'sitepulse-incidents',
  SETTINGS: process.env.SETTINGS_TABLE || 'sitepulse-settings',
};

module.exports = { ddb, TABLES, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand, TransactWriteCommand };
