import React, { FC, useEffect, useRef } from 'react';

import { IShapeRenderer } from '<src>/types';
import { ShapeRenderer } from './ShapeRenderer';
import { Panel } from './Panel';

type HttpBodyPanelProps = {
  shapes: IShapeRenderer[];
  location: string;
  selectedFieldId?: string | null;
};

export const HttpBodyPanel: FC<HttpBodyPanelProps> = ({
  shapes,
  location,
  selectedFieldId,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedFieldId && contentRef.current) {
      const isContainerScrollable =
        contentRef.current.scrollHeight > contentRef.current.clientHeight;
      const fieldNode = contentRef.current.querySelector(
        `[data-fieldId='${selectedFieldId}']`
      );
      if (isContainerScrollable && fieldNode) {
        const scrollTopDiff =
          fieldNode.getBoundingClientRect().top -
          contentRef.current.getBoundingClientRect().top;
        contentRef.current.scrollTop += scrollTopDiff;
      }
    }
  }, [selectedFieldId]);

  return (
    <Panel header={location} contentRef={contentRef}>
      <ShapeRenderer
        showExamples={false}
        shapes={shapes}
        selectedFieldId={selectedFieldId}
      />
    </Panel>
  );
};
