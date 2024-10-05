
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use uuid::Uuid;



#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub struct LastEvaluatedKey {
    pub id: String,
    pub user_id: String,
    pub last_modified: u64,
}


impl LastEvaluatedKey {
    pub fn new(id: &str, user_id: &str, last_modified: &u64) -> Self{
        Self {
            id: id.to_owned(),
            user_id: user_id.to_owned(),
            last_modified: last_modified.to_owned()
        }
    }
}


#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct SPATableEntry {
    pub id: String,
    pub user_id: String,
    pub last_modified: u64,
    pub title: String,
    pub description: String
}



impl SPATableEntry {
    pub fn new(user_id: &str, title: &str, description: &str) -> Self{
        let timestamp : u64 = match SystemTime::now().duration_since(UNIX_EPOCH) {
            Ok(timestamp) => timestamp.as_secs(),
            Err(_) => 0,
        };

        Self {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.to_owned(),
            last_modified: timestamp,
            title: title.to_owned(),
            description: description.to_owned()
        }
    }
}
