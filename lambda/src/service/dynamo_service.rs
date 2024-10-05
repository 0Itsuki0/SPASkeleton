
use std::{collections::HashMap, time::{SystemTime, UNIX_EPOCH}};

use anyhow::{bail, Context, Result};
use aws_sdk_dynamodb::types::AttributeValue;
use serde_dynamo::{from_item, from_items, to_item};

use crate::handler::parameters::UpdateEntryBodyParams;

use super::structs::{LastEvaluatedKey, SPATableEntry};


#[derive(Debug, Clone)]
pub struct DynamoService {
    client: aws_sdk_dynamodb::Client,
}

impl DynamoService {
    pub fn new(client: &aws_sdk_dynamodb::Client) -> Self {
        Self {
            client: client.to_owned()
        }
    }


    pub async fn query_entries(&self, table_name: &str, user_id: &str, last_evaluated_key: Option<LastEvaluatedKey>) -> Result<(Vec<SPATableEntry>, Option<LastEvaluatedKey>)> {
        let mut builder = self.client.clone()
            .query()
            // .limit(1)
            .scan_index_forward(false)
            .table_name(table_name)
            .index_name("gsi-userid")
            .key_condition_expression("#name = :value")
            .expression_attribute_names("#name", "user_id")
            .expression_attribute_values(":value", AttributeValue::S(user_id.to_owned()));


            if let Some(last_evaluated_key) = last_evaluated_key {
            let mut exclusive_key: HashMap<String, AttributeValue> = HashMap::new();
            exclusive_key.insert("id".to_owned(), AttributeValue::S(last_evaluated_key.id));
            exclusive_key.insert("user_id".to_owned(), AttributeValue::S(last_evaluated_key.user_id));
            exclusive_key.insert("last_modified".to_owned(), AttributeValue::N(last_evaluated_key.last_modified.to_string()));

            builder = builder.set_exclusive_start_key(Some(exclusive_key));
        }
        let results = builder.send().await?;

        println!("results.items: {:?}", results.items);

        let items = results.items.context("items not available")?;
        let entries: Vec<SPATableEntry> = from_items(items)?;
        println!("entries: {:?}", entries);

        let last_evaluated_key: Option<LastEvaluatedKey> = match results.last_evaluated_key {
            Some(key) => from_item(key)?,
            None => None,
        };

        println!("last_evaluated_key: {:?}", last_evaluated_key);
        Ok((entries, last_evaluated_key))
    }


    pub async fn register_entry(&self, table_name: &str, user_id: &str, title: &str, description: &str) -> Result<SPATableEntry>{
        let entry = SPATableEntry::new(user_id, title, description);
        self
            .client.clone()
            .put_item()
            .table_name(table_name)
            .set_item(Some(to_item(&entry)?))
            .send()
            .await?;
        Ok(entry)
    }

    pub async fn get_entry_single(&self, table_name: &str, id: &str) -> Result<SPATableEntry> {
        let results = self
            .client.clone()
            .query()
            .table_name(table_name)
            .key_condition_expression("#name = :value")
            .expression_attribute_names("#name", "id")
            .expression_attribute_values(":value", AttributeValue::S(id.to_owned()))
            .send()
            .await?;

        if results.count == 0
            || results.items.is_none()
            || results.items.clone().unwrap().is_empty()
        {
            bail!("Entry does not exist for id: {}!", id)
        }
        let item = results.items.unwrap().first().unwrap().to_owned();
        let entry: SPATableEntry = from_item(item)?;
        Ok(entry)
    }

    pub async fn update_entry_single(&self, table_name: &str, id: &str, updates: UpdateEntryBodyParams) -> Result<SPATableEntry> {
        let mut current = self.get_entry_single(table_name, id).await?;

        let timestamp : u64 = match SystemTime::now().duration_since(UNIX_EPOCH) {
            Ok(timestamp) => timestamp.as_secs(),
            Err(_) => current.last_modified,
        };

        if let Some(title) = updates.title {
            current.title = title
        }

        if let Some(description) = updates.description {
            current.description = description
        }

        current.last_modified = timestamp;

        self
        .client.clone()
        .put_item()
        .table_name(table_name)
        .set_item(Some(to_item(&current)?))
        .send()
        .await?;

        Ok(current)
    }


    pub async fn delete_entry(&self, table_name: &str, id: &str) -> Result<()> {
        self.client.clone()
            .delete_item()
            .table_name(table_name)
            .key("id", AttributeValue::S(id.to_owned()))
            .send()
            .await?;

        Ok(())
    }

}