use axum::Router;
use axum::routing::{get, post};
use handler::handlers::{delete_entry_single, get_entry_single, get_entries, post_entry_single, update_entry_single};
use lambda_http::{run, tracing, Error};
use service::dynamo_service::DynamoService;
use std::env::set_var;

pub mod handler;
pub mod service;
pub mod env_key;

#[tokio::main]
async fn main() -> Result<(), Error> {
    set_var("AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH", "true");

    tracing::init_default_subscriber();

    let config = aws_config::load_from_env().await;
    let dynamo_client = aws_sdk_dynamodb::Client::new(&config);
    let dynamo_service = DynamoService::new(&dynamo_client);

    let app = Router::new()
        .route("/entries", post(post_entry_single).get(get_entries))
        .route("/entries/:id",
            get(get_entry_single)
            .put(update_entry_single)
            .delete(delete_entry_single)
        )
        .with_state(dynamo_service);

    run(app).await
}