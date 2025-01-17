export const schema = `
scalar JSON
schema {
  query: Query
  mutation: Mutation
}
type Mutation {
  applyCommands(commands: [JSON!]!, batchCommitId: ID!, commitMessage: String!, clientId: ID!, clientSessionId: ID!): AppliedCommandsResult
  startDiff(diffId: ID!, captureId: ID!): StartDiffResult
  invalidateCaches: InvalidateCachesResult
  resetToCommit(batchCommitId: ID!): Boolean
}
type InvalidateCachesResult {
  batchCommitId: ID
}
type AppliedCommandsResult {
  batchCommitId: ID
}
type StartDiffResult {
  notificationsUrl: String
  listDiffsQuery: String
  listUnrecognizedUrlsQuery: String
}

"""
Queries for Spectacle
"""
type Query {
  endpoints: [Endpoint!]!

  # All HTTP requests defined in the spec
  # TODO @nic deprecate
  requests: [HttpRequest]

  # URI paths for endpoints
  paths: [Path]
  
  # Shape choices based on shape ID
  shapeChoices(shapeId: ID): [OpticShape]
  
  # Endpoint changes since a given batch commit ID
  endpointChanges(sinceBatchCommitId: String): EndpointChanges
  
  # All batch commits defined in a spec
  batchCommits: [BatchCommit]
  
  # Diffs for existing endpoints and unrecognized URLs
  diff(diffId: ID!): DiffState

  endpoint(pathId: ID!, method: String!): Endpoint

  field(fieldId: ID!): ObjectField

  # Metadata about the current spec
  metadata: SpecMetadata
}

"""
SpecMetadata - misc data about the spec
"""
type SpecMetadata {
  id: String
}

type DiffState {
  diffs: JSON
  unrecognizedUrls: JSON
}
type Path {
  # URL path pattern without parameter names
  absolutePathPattern: String
  
  # URI path pattern with parameter names included 
  absolutePathPatternWithParameterNames: String
  
  # Whether or not the path component is a parameter or not
  isParameterized: Boolean
  
  # Parent path ID
  parentPathId: String
  
  # Name of path or name of parameter if parameterized
  name: String
  
  # Path ID
  pathId: String

  # Is the path removed
  isRemoved: Boolean
}

type Endpoint {
  # PathId + Method
  id: ID!
  
  # Path ID
  pathId: ID!
  
  # HTTP method for the HTTP request
  method: String!

  # Path components for the HTTP request
  pathComponents: [PathComponent!]!
  
  # URI path pattern with parameter names included 
  pathPattern: String!
  
  # Query parameters associated with this HTTP request
  query: QueryParameters
  
  # Request bodies associated with this HTTP request
  requests: [HttpRequestNew!]!
  
  # Responses associated with this HTTP request
  responses: [HttpResponse!]!

  # Contributions which define descriptions
  contributions: JSON!

  # Is the endpoint removed
  isRemoved: Boolean!

  commands: EndpointCommands!
}

type EndpointCommands {
  remove: [JSON!]!
}

"""
HttpRequestNew - to supercede HttpRequest (and subsequently renamed to HttpRequest)
TODO @nic rename this
"""
type HttpRequestNew {
  # Request Id
  id: ID!

  # Request body associated with this HTTP request
  body: HttpBody

  contributions: JSON!

  # Changes for the response based on the give batch commit ID
  changes(sinceBatchCommitId: String): ChangesResult!

  # Is the request removed
  isRemoved: Boolean!
}

"""
HTTP Body, which could be for a request or response
"""
type HttpBody {
  # Content type of the given HTTP body
  contentType: String
  
  # Root shape ID for the HTTP body. Look at the shapeChoices query getting more information about the root shape
  rootShapeId: String

  # Is the body removed
  isRemoved: Boolean
}

"""
Query Parameters, 1:1 mapping to a HttpRequest
"""
type QueryParameters {
  # Id for the query parameter
  id: String!

  # Root shape ID for the QueryParameter. Look at the shapeChoices query getting more information about the root shape
  rootShapeId: String

  # Is the body removed
  isRemoved: Boolean!

  # Changes for the query parameters based on the give batch commit ID
  changes(sinceBatchCommitId: String): ChangesResult!

  # Contributions for the query parameter
  contributions: JSON!
}

"""
HTTP Request
TODO @nic  Deprecate this
"""
type HttpRequest {
  id: ID
  
  # Path components for the HTTP request
  pathComponents: [PathComponent]
  
  # URL path pattern without parameter names
  absolutePathPattern: String
  
  # URI path pattern with parameter names included 
  absolutePathPatternWithParameterNames: String
  
  # Path ID
  pathId: ID
  
  # HTTP method for the HTTP request
  method: String

  # Query parameters associated with this HTTP request
  query: QueryParameters
  
  # Request bodies associated with this HTTP request
  bodies: [HttpBody]
  
  # Responses associated with this HTTP request
  responses: [HttpResponse]

  # Path contributions which define descriptions
  pathContributions: JSON
  
  # Request contributions which define descriptions
  requestContributions: JSON

  # Is the request removed
  isRemoved: Boolean
}

"""
Path Component
The URL /users/{id} would have three path components, one for the root, one for users and one for the parameter id.
"""
type PathComponent {
  id: ID
  
  # Name of the path component or path parameter
  name: String
  
  # Defines whether or not the path component is parameterized
  isParameterized: Boolean
  
  # Path component contributions which define descriptions
  contributions: JSON

  # Is the path component removed
  isRemoved: Boolean
}

"""
HTTP Response
"""
type HttpResponse {
  id: ID
  
  # HTTP status code for the HTTP response
  statusCode: Int
  
  # Response bodies associated with this HTTP response
  bodies: [HttpBody]
  
  # HTTP response contributions which define descriptions
  contributions: JSON

  # Changes for the response based on the give batch commit ID
  changes(sinceBatchCommitId: String): ChangesResult!

  # Is the response removed
  isRemoved: Boolean
}

"""
Object Field Metadata, which provides information about a field
"""
type ObjectField {
  name: String!
  
  # Field ID for the given field
  fieldId: ID!
  
  # Changes for the field based on the give batch commit ID
  changes(sinceBatchCommitId: String): ChangesResult
  
  # Shape ID of field. Use the shapeChoice query to get shape information.
  shapeId: ID!
  
  # Field contributions which define descriptions
  contributions: JSON!

  # Has the field been removed
  isRemoved: Boolean!

  # Commands to mutate the field
  commands: FieldCommands!
}

type FieldCommands {
  remove: [JSON!]!
  edit(requestedTypes: [JsonType!]!): [JSON!]!
}

"""
Object Metadata, which provides information about an object
"""
type ObjectMetadata {
  # Fields for the given object
  fields: [ObjectField]
}

"""
Array Metadata, which provides information about an array
"""
type ArrayMetadata {
  # Changes for the array based on the give batch commit ID
  changes(sinceBatchCommitId: String): ChangesResult
  
  # Shape ID of the array. Use the shapeChoice query to get shape information.
  shapeId: ID
}

"""
Optic Shape
"""
type OpticShape {
  id: ID
  
  # JSON type of shape. Could be string, number, boolean, null, object, or array.
  jsonType: String
  
  # Metadata if jsonType is object
  asObject: ObjectMetadata
  
  # Metadata if jsonType is array
  asArray: ArrayMetadata
  
  # changes(sinceBatchCommitId: String): ChangesResult
  # exampleValue: [JSON]
}


"""
JsonType, describing the type of an OpticShape projected as a JSON type
"""
enum JsonType {
  String,
  Number,
  Boolean,
  Array,
  Object,
  Null,
  Undefined,
}

"""
Change Result, which defines whether if something was added or updated
"""
type ChangesResult {
  # Whether or not the change was one that was added
  added: Boolean
  
  # Whether or not the change was one that was updated
  changed: Boolean

  # Whether or not the change was one that was removed
  removed: Boolean
}

"""
Endpoint Changes
TODO move this into Endpoint type (as changes)
"""
type EndpointChanges {  
  # Changed endpoints for the batch commit ID provided to query
  endpoints: [EndpointChange]
}

"""
Endpoint Change, which provides information about an endpoint change found since the given batch commit ID
"""
type EndpointChange {
  # Metadata about the endpoint change
  change: EndpointChangeMetadata
  
  # Path ID related to the given change
  pathId: String
  
  # Absolute path pattern with parameters
  path: String
  
  # HTTP method for the given endpoint change
  method: String
  
  # Descriptions for the endpoint change
  contributions: JSON
}

"""
Endpoint Change Metadata
"""
type EndpointChangeMetadata {
  # Defines how the endpoint changed
  category: String
}

"""
Batch Commit, which provides information about changes in the spec captured as batch commits
"""
type BatchCommit {
  # When the batch commit was created
  createdAt: String
  
  # Batch commit ID
  batchId: String
  
  # Batch commit message
  commitMessage: String
}
`;
