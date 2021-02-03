use super::{RfcEvent, SpecEvent};
use cqrs_core::Event;
use serde_json;
use std::convert::TryFrom;

#[derive(Debug)]
pub enum SpecChunkEvent {
  Root(RootChunkEvent),
  Batch(BatchChunkEvent),
  Unknown(UnknownChunkEvent),
}

#[derive(Debug)]
pub struct RootChunkEvent {
  pub id: String,
  pub name: String,
  pub events: Vec<SpecEvent>,
}

#[derive(Debug)]
pub struct BatchChunkEvent {
  pub id: String,
  pub name: String,
  pub parent_id: String,
  pub events: Vec<SpecEvent>,
}

#[derive(Debug)]
pub struct UnknownChunkEvent {
  name: String,
  pub events: Vec<SpecEvent>,
}

impl SpecChunkEvent {
  pub fn into_events_iter(self) -> impl Iterator<Item = SpecEvent> {
    let events = match self {
      SpecChunkEvent::Root(chunk) => chunk.events,
      SpecChunkEvent::Batch(chunk) => chunk.events,
      SpecChunkEvent::Unknown(chunk) => chunk.events,
    };

    events.into_iter()
  }
}

impl Event for SpecChunkEvent {
  fn event_type(&self) -> &'static str {
    match self {
      SpecChunkEvent::Root(evt) => evt.event_type(),
      SpecChunkEvent::Batch(evt) => evt.event_type(),
      SpecChunkEvent::Unknown(evt) => evt.event_type(),
    }
  }
}

impl Event for RootChunkEvent {
  fn event_type(&self) -> &'static str {
    "RootChunkEvent"
  }
}

impl Event for BatchChunkEvent {
  fn event_type(&self) -> &'static str {
    "BatchChunkEvent"
  }
}

impl Event for UnknownChunkEvent {
  fn event_type(&self) -> &'static str {
    "UnknownChunkEvent"
  }
}

// TODO: Implement this for an impl Iterator<Item=SpecEvent> rather than requiring a Vec
impl From<(String, bool, Vec<SpecEvent>)> for SpecChunkEvent {
  fn from((name, is_root, events): (String, bool, Vec<SpecEvent>)) -> Self {
    if is_root {
      Self::Root(RootChunkEvent {
        id: String::from("root"),
        name,
        events,
      })
    } else {
      match BatchChunkEvent::try_from((name, events)) {
        Ok(batch_chunk) => Self::Batch(batch_chunk),
        Err((msg, name, events)) => Self::Unknown(UnknownChunkEvent { name, events }),
      }
    }
  }
}

// TODO: Implement this for an impl Iterator<Item=SpecEvent> rather than requiring a Vec
impl TryFrom<(String, Vec<SpecEvent>)> for BatchChunkEvent {
  // Give ownership of name and events back when we fail
  type Error = (&'static str, String, Vec<SpecEvent>); // TODO: replace with proper error type

  fn try_from((name, events): (String, Vec<SpecEvent>)) -> Result<Self, Self::Error> {
    let first_event = events.iter().next();

    let batch_ids = first_event
      .map(|first_event| match first_event {
        SpecEvent::RfcEvent(RfcEvent::BatchCommitStarted(e)) => {
          (Some(e.batch_id.clone()), e.parent_id.clone())
        }
        _ => (None, None),
      })
      .unwrap_or((None, None));

    if let (Some(id), Some(parent_id)) = batch_ids {
      Ok(Self {
        id,
        name,
        parent_id,
        events,
      })
    } else {
      Err((
        "Chunk does not start with a BatchCommitStarted with batchId and parentId",
        name,
        events,
      ))
    }
  }
}

#[cfg(test)]
mod test {
  use super::*;
  use serde_json::json;

  #[test]
  pub fn can_construct_spec_chunk_events() {
    let spec_chunk_events : Vec<SpecChunkEvent> = vec![
    (
      String::from("specification.json"),
      true,
      json!([
        {"PathComponentAdded": {"pathId": "path_1","parentPathId": "root","name": "todos"}},
        {"ContributionAdded": {"id": "path_1.GET","key": "purpose","value": "todos"}}
      ]),
    ),
    (
      String::from("0002.json"),
      false,
      // Adding a simple shape to the GET /todos response
      json!([
        {"BatchCommitStarted": {"batchId": "batch-2", "parentId": "batch-1", "commitMessage": "dsasa" }},
        {"ShapeAdded": { "shapeId": "object_shape_1", "baseShapeId": "$object", "parameters": { "DynamicParameterList": { "shapeParameterIds": [] } }, "name": "" }},
        {"ShapeAdded": {"shapeId": "boolean_shape_1","baseShapeId": "$boolean","parameters": {"DynamicParameterList": {"shapeParameterIds": []}},"name": ""}},
        {"FieldAdded": {"fieldId": "field_1","shapeId": "object_shape_1","name": "isDone","shapeDescriptor": {"FieldShapeFromShape": {"fieldId": "field_1","shapeId": "boolean_shape_1"}}}},
        {"ResponseBodySet": {"responseId": "response_1","bodyDescriptor": {"httpContentType": "application/json","shapeId": "object_shape_1","isRemoved": false}}},
        {"BatchCommitEnded": { "batchId": "batch-2" }}
      ]),
    ),
    (
      String::from("0001.json"),
      false,
      // Adding a Request and Response for GET /todos
      json!([
        {"BatchCommitStarted": {"batchId": "batch-1", "parentId": "root", "commitMessage": "Add Request and Response for GET /todos" }},
        {"RequestAdded": { "requestId": "request_1","pathId": "path_1","httpMethod": "GET" }},
        {"ResponseAddedByPathAndMethod": { "responseId": "response_1", "pathId": "path_1", "httpMethod": "GET", "httpStatusCode": 200 }},
        {"BatchCommitEnded": { "batchId": "batch-1" }}
      ]),
    ),
  ].into_iter().map(|(file_name, is_root, events_json)| {
    let events : Vec<SpecEvent> = serde_json::from_value(events_json).expect("example events should be valid spec events");

    SpecChunkEvent::from((file_name, is_root, events))
  }).collect();

    dbg!(&spec_chunk_events);

    assert_eq!(
      spec_chunk_events
        .iter()
        .map(|chunk| matches!(chunk, SpecChunkEvent::Root(_)))
        .collect::<Vec<_>>(),
      vec![true, false, false]
    );

    assert_eq!(
      spec_chunk_events
        .iter()
        .map(|chunk| matches!(chunk, SpecChunkEvent::Batch(_)))
        .collect::<Vec<_>>(),
      vec![false, true, true]
    );
  }
}
