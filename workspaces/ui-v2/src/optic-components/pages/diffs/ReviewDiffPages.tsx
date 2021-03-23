import * as React from 'react';
import { NavigationRoute } from '../../navigation/NavigationRoute';
import {
  useDiffEnvironmentsRoot,
  useDiffForEndpointLink,
  useDiffReviewPagePendingEndpoint,
  useDiffUndocumentedUrlsPageLink,
} from '../../navigation/Routes';
import { ContributionEditingStore } from '../../hooks/edit/Contributions';
import { SharedDiffStore } from '../../hooks/diffs/SharedDiffContext';
import { PendingEndpointPageSession } from './PendingEndpointPage';
import { DiffUrlsPage } from './AddEndpointsPage';
import { Route } from 'react-router-dom';
import { ReviewEndpointDiffPage } from './ReviewEndpointDiffPage';

export function DiffReviewPages(props: any) {
  // const { match } = props;
  // const { environment, boundaryId } = match.params;

  const diffUndocumentedUrlsPageLink = useDiffUndocumentedUrlsPageLink();
  const diffForEndpointLink = useDiffForEndpointLink();
  const diffReviewPagePendingEndpoint = useDiffReviewPagePendingEndpoint();
  return (
    <SharedDiffStore>
      <ContributionEditingStore>
        <NavigationRoute
          path={diffUndocumentedUrlsPageLink.path}
          Component={DiffUrlsPage}
          AccessoryNavigation={() => <div></div>}
        />
        <NavigationRoute
          path={diffForEndpointLink.path}
          Component={ReviewEndpointDiffPage}
          AccessoryNavigation={() => <div></div>}
        />
        <NavigationRoute
          path={diffReviewPagePendingEndpoint.path}
          Component={PendingEndpointPageSession}
          AccessoryNavigation={() => <div></div>}
        />
      </ContributionEditingStore>
    </SharedDiffStore>
  );
}

export function DiffReviewEnvironments(props: any) {
  const diffEnvironmentsRoot = useDiffEnvironmentsRoot();
  return (
    <>
      <Route path={diffEnvironmentsRoot.path} component={DiffReviewPages} />
    </>
  );
}
