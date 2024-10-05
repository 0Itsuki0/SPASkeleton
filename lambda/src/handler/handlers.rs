
use axum::extract::{Query, State};
use axum::http::header::CONTENT_TYPE;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::{
    extract::Path,
    response::Json,
};
use serde_json::json;

use crate::env_key::TABLE_NAME_KEY;
use crate::service::dynamo_service::DynamoService;
use crate::service::structs::LastEvaluatedKey;

use super::parameters::{GetEntriesQueryParams, PutNewEntryBodyParams, UpdateEntryBodyParams};




fn build_error_response(message: &str) -> Response {
    let mut json_header = HeaderMap::new();
    json_header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

    let mut response = Response::new(json!({
        "success": false,
        "message": message
    }).to_string());
    *response.status_mut() = StatusCode::BAD_REQUEST;
    return (json_header, response).into_response();
}


// get all
pub async fn get_entries(State(service): State<DynamoService>, Query(params): Query<GetEntriesQueryParams>) -> Response {
    let Ok(table_name) = std::env::var(TABLE_NAME_KEY) else {
        return build_error_response("Environment variables not defined.");
    };

    let last_evaluated_key = if let (Some(id), Some(last_modified)) = (params.id, params.last_modified) {
        Some(LastEvaluatedKey::new(&id, &params.user_id, &last_modified))
    } else {
        None
    };

    let (entries, last_evaluated_key) = match service.query_entries(&table_name, &params.user_id, last_evaluated_key).await {
        Ok(result) => result,
        Err(err) => {
            return build_error_response(&format!("Error getting entries: {}.", err));
        },
    };

    let mut json_header = HeaderMap::new();
    json_header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

    let response = Response::new(json!({
        "entries": entries,
        "last_evaluated_key": last_evaluated_key
    }).to_string());

    return (json_header, response).into_response();
}



pub async fn post_entry_single(State(service): State<DynamoService>, Json(params): Json<PutNewEntryBodyParams>) -> Response {
    let Ok(table_name) = std::env::var(TABLE_NAME_KEY) else {
        return build_error_response("Environment variables not defined.");
    };


    let dynamo_entry = match service.register_entry(&table_name, &params.user_id, &params.title, &params.description).await {
        Ok(entry) => entry,
        Err(err) => {
            return build_error_response(&format!("Error getting entry. Error: {}", err));
        },
    };

    let entry_string = match serde_json::to_string(&dynamo_entry) {
        Ok(string) => string,
        Err(err) => {
            return build_error_response(&format!("Error getting entry. Error: {}", err));
        },
    };

    let mut json_header = HeaderMap::new();
    json_header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

    let response = Response::new(entry_string);

    return (json_header, response).into_response();
}

pub async fn get_entry_single(State(service): State<DynamoService>, Path(id): Path<String>) -> Response {
    let Ok(table_name) = std::env::var(TABLE_NAME_KEY) else {
        return build_error_response("Environment variables not defined.");
    };

    let dynamo_entry = match service.get_entry_single(&table_name, &id).await {
        Ok(entry) => entry,
        Err(err) => {
            return build_error_response(&format!("Error getting entry. Error: {}", err));
        },
    };

    let entry_string = match serde_json::to_string(&dynamo_entry) {
        Ok(string) => string,
        Err(err) => {
            return build_error_response(&format!("Error getting entry. Error: {}", err));
        },
    };

    let mut json_header = HeaderMap::new();
    json_header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

    let response = Response::new(entry_string);

    return (json_header, response).into_response();

}

pub async fn update_entry_single(State(service): State<DynamoService>, Path(id): Path<String>, Json(updates): Json<UpdateEntryBodyParams> ) -> Response {
    let Ok(table_name) = std::env::var(TABLE_NAME_KEY) else {
        return build_error_response("Environment variables not defined.");
    };

    let update_entry = match service.update_entry_single(&table_name, &id, updates).await {
        Ok(entry) => entry,
        Err(err) => {
            return build_error_response(&format!("Error getting entry. Error: {}", err));
        },
    };

    let entry_string = match serde_json::to_string(&update_entry) {
        Ok(string) => string,
        Err(err) => {
            return build_error_response(&format!("Error getting entry. Error: {}", err));
        },
    };

    let mut json_header = HeaderMap::new();
    json_header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

    let response = Response::new(entry_string);

    return (json_header, response).into_response();

}


pub async fn delete_entry_single(State(service): State<DynamoService>, Path(id): Path<String>) -> Response {
    let Ok(table_name) = std::env::var(TABLE_NAME_KEY) else {
        return build_error_response("Environment variables not defined.");
    };

    if service.delete_entry(&table_name, &id).await.is_err() {
        return build_error_response(&format!("Error deleting dynamo entry"))
    };

    let mut json_header = HeaderMap::new();
    json_header.insert(CONTENT_TYPE, "application/json".parse().unwrap());

    let response = Response::new(json!({}).to_string());

    return (json_header, response).into_response();
}