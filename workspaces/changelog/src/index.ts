import * as DiffEngine from '@useoptic/diff-engine-wasm/engine/build';
import { makeSpectacle, InMemorySpecRepository } from '@useoptic/spectacle';
import { EventEmitter } from 'events';


export async function generateEndpointChanges(initialEvents: any[] = [], currentEvents: any[]): Promise<any> {
  let query;

  // We only need to add a "since" to the query if there are initial events.
  if (initialEvents.length) {
    const initialSpectacle = await makeSpectacle(DiffEngine, {
      specRepository: new InMemorySpecRepository(new EventEmitter(), { events: initialEvents })
    });

    const batchCommitResults = await initialSpectacle({
      query: `{
        batchCommits {
          createdAt
          batchId
        }
      }`,
      variables: {}
    });

    // TODO: consider making this into a query
    const latestBatchCommit = batchCommitResults.data!.batchCommits!
      .reduce((result: any, batchCommit: any) => {
        return batchCommit.createdAt > result.createdAt ? batchCommit : result;
      });

    query = `{
      endpointChanges(since: "${latestBatchCommit.createdAt}") {
        endpoints {
          change {
            category
          }
          path
          method
        }
      }
    }`;
  } else {
    query = `{
      endpointChanges {
        endpoints {
          change {
            category
          }
          path
          method
        }
      }
    }`;
  }

  const currentSpectacle = await makeSpectacle(DiffEngine, {
    specRepository: new InMemorySpecRepository(new EventEmitter(), { events: currentEvents })
  });

  return await currentSpectacle({
    query,
    variables: {}
  });
}