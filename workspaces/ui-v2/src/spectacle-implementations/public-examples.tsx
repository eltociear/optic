import * as React from 'react';
import { useRouteMatch, useParams } from 'react-router-dom';
import { Provider as BaseUrlProvider } from '../optic-components/hooks/useBaseUrl';
import { makeSpectacle } from '@useoptic/spectacle';
import { useEffect, useState } from 'react';

export default function() {
  const match = useRouteMatch();
  const params = useParams<{ exampleId: string }>();
  const { exampleId } = params;
  const task: InMemorySpectacleDependenciesLoader = async () => {
    const loadEvents = async () => {

      const response = await fetch(`/example-sessions/${exampleId}.json`, { headers: { accept: 'application/json' } });
      if (!response.ok) {
        throw new Error(`could not find example ${exampleId}`);
      }
      const responseJson = await response.json();
      return responseJson.events;
    };
    const [events, opticEngine] = await Promise.all([
      loadEvents(),
      import('@useoptic/diff-engine-wasm/engine/browser')
    ]);
    return { events, opticEngine };
  };
  const { loading, error, data } = useInMemorySpectacle(task);
  if (loading) {
    return <div>loading...</div>;
  }
  if (error) {
    return <div>error :(</div>;
  }
  console.log(data);
  debugger
  return (
    <BaseUrlProvider value={{ url: match.url }}>
      <div>we got spectacle</div>
    </BaseUrlProvider>
  );
}

export type InMemorySpectacleDependenciesLoader = () => Promise<{ events: any[], opticEngine: any }>
export type AsyncStatus<T> = { loading: boolean, error?: Error, data?: T }

export interface Spectacle {
  query: any
}

export function useInMemorySpectacle(loadDependencies: InMemorySpectacleDependenciesLoader): AsyncStatus<Spectacle> {
  const [spectacle, setSpectacle] = useState<Spectacle>();

  useEffect(() => {
    async function task() {
      const result = await loadDependencies();
      const query = makeSpectacle(result.opticEngine, { specEvents: result.events });
      setSpectacle({ query });
    }

    task()
  }, []);

  return {
    loading: !spectacle,
    data: spectacle
  };
}