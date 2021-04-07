import * as React from 'react';
import { useRouteMatch, useParams, Switch } from 'react-router-dom';
import { Provider as BaseUrlProvider } from '../optic-components/hooks/useBaseUrl';
import { makeSpectacle } from '@useoptic/spectacle';
import { useEffect, useState } from 'react';
import { DocumentationPages } from '../optic-components/pages/docs/DocumentationPage';
import { AsyncStatus, SpectacleStore } from './spectacle-provider';
import { Loading } from '../optic-components/navigation/Loading';
import { DiffReviewEnvironments } from '../optic-components/pages/diffs/ReviewDiffPages';
import { InMemoryInteractionLoaderStore } from './interaction-loader';
import { IBaseSpectacle, SpectacleInput } from '@useoptic/spectacle';
import { IForkableSpectacle, InMemorySpecRepository } from '@useoptic/spectacle';
import { EventEmitter } from 'events';

export default function PublicExamples() {
  const match = useRouteMatch();
  const params = useParams<{ exampleId: string }>();
  const { exampleId } = params;
  const task: InMemorySpectacleDependenciesLoader = async () => {
    const loadExample = async () => {
      const response = await fetch(`/example-sessions/${exampleId}.json`, {
        headers: { accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`could not find example ${exampleId}`);
      }
      const responseJson = await response.json();
      return responseJson;
    };
    const [example, opticEngine] = await Promise.all([
      loadExample(),
      import('@useoptic/diff-engine-wasm/engine/browser')
    ]);
    return {
      events: example.events,
      samples: example.session.samples,
      opticEngine
    };
  };
  const { loading, error, data } = useInMemorySpectacle(task);
  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div>error :(</div>;
  }
  if (!data) {
    return <div>something went wrong</div>;
  }

  return (
    <SpectacleStore spectacle={data}>
      <InMemoryInteractionLoaderStore samples={data.samples}>
        <BaseUrlProvider value={{ url: match.url }}>
          <Switch>
            <>
              <DiffReviewEnvironments />
              <DocumentationPages />
            </>
          </Switch>
        </BaseUrlProvider>
      </InMemoryInteractionLoaderStore>
    </SpectacleStore>
  );
}

export interface InMemorySpectacleDependencies {
  events: any[];
  opticEngine: any;
  samples: any[];
}

export type InMemorySpectacleDependenciesLoader = () => Promise<InMemorySpectacleDependencies>;

class InMemorySpectacle implements IForkableSpectacle {
  private spectacle: any;

  constructor(private readonly opticEngine: any, private events: any[], notifications: EventEmitter) {
    this.spectacle = makeSpectacle(opticEngine, {
      specRepository: new InMemorySpecRepository(notifications, { events })
    });
  }

  async fork(): Promise<IBaseSpectacle> {
    return new InMemorySpectacle(this.opticEngine, this.events, new EventEmitter());
  }

  async mutate(options: SpectacleInput): Promise<any> {
    return this.spectacle(options);
  }

  async query(options: SpectacleInput): Promise<any> {
    return this.spectacle(options);
  }
}


export interface InMemoryBaseSpectacle extends IBaseSpectacle {
  samples: any[]
}

export function useInMemorySpectacle(
  loadDependencies: InMemorySpectacleDependenciesLoader
): AsyncStatus<InMemoryBaseSpectacle> {
  const [spectacle, setSpectacle] = useState<InMemoryBaseSpectacle>();

  useEffect(() => {
    async function task() {
      const result = await loadDependencies();
      const events = [...result.events];
      const notifications = new EventEmitter();
      const specRepository = new InMemorySpecRepository(notifications, { events });
      const query = await makeSpectacle(result.opticEngine, {
        specRepository
      });

      setSpectacle({
        samples: result.samples,
        query,
        mutate(mutation: SpectacleInput) {
          debugger
          const result = query(mutation);
          return result;
        }
      });
    }

    task();
    // should only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading: !spectacle,
    data: spectacle
  };
}