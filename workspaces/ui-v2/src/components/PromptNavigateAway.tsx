import * as React from 'react';
import { FC, useEffect } from 'react';
import { Prompt } from 'react-router';

type PromptNavigateAwayProps = {
  shouldPrompt: boolean;
};

// the root diff page (i.e. /diffs) causes diffs to be regenerated
const isDiffsPage = (pathname: string) => /diffs.+/i.test(pathname);

const isNavigatingToSamePage = (locationToNavigateTo: string) => {
  const pageTesters = [isDiffsPage];
  return pageTesters.some(
    (fn) => fn(locationToNavigateTo) && fn(window.location.pathname)
  );
};

/**
 * @gotcha Note that this includes a destructive useEffect for onbeforeunload which means
 * that this component can only be used once (on unmount / update useEffect, the mount/unmount will
 * tear down other onbeforeunloads)
 */
export const PromptNavigateAway: FC<PromptNavigateAwayProps> = ({
  shouldPrompt,
}) => {
  useEffect(() => {
    if (window.onbeforeunload !== null) {
      console.warn(
        'window.onbeforeunload already has a value set! this is being overwritten by PromptNavigateAway'
      );
    }
    window.onbeforeunload = shouldPrompt ? () => true : null;

    return () => {
      window.onbeforeunload = null;
    };
  }, [shouldPrompt]);

  return (
    <Prompt
      when={shouldPrompt}
      message={(location) =>
        isNavigatingToSamePage(location.pathname) ||
        'You have unsaved changes, are you sure you want to leave?'
      }
    />
  );
};
