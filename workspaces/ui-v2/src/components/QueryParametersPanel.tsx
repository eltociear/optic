import React, { FC } from 'react';
import { makeStyles } from '@material-ui/core';
import classnames from 'classnames';

import {
  FontFamily,
  FontFamilyMono,
  AddedGreenBackground,
  ChangedYellowBackground,
  RemovedRedBackground,
} from '<src>/styles';
import { IFieldRenderer, IShapeRenderer, JsonLike } from '<src>/types';
import { ShapeRenderer } from './ShapeRenderer';
import { Panel } from './Panel';

type QueryParameters = Record<string, IFieldRenderer>;

type QueryParametersPanelProps = {
  parameters: QueryParameters;
};

// TODO QPB this should move into redux
// TODO mvoe this into redux
export const convertShapeToQueryParameters = (
  shapes: IShapeRenderer[]
): QueryParameters => {
  const queryParameters: QueryParameters = {};
  if (shapes.length !== 1 || !shapes[0].asObject) {
    if (shapes.length > 1) {
      console.error('unexpected format for query parameters');
    }
    // otherwise loading
    return {};
  }

  for (const field of shapes[0].asObject.fields) {
    let isArray = field.shapeChoices.findIndex(
      (choice) => choice.jsonType === JsonLike.ARRAY
    );

    if (isArray > -1) {
      field.additionalAttributes = ['multiple'];
      if (field.shapeChoices.length > 1) {
        field.shapeChoices.splice(isArray, 1);
      } else {
        field.shapeChoices = field.shapeChoices[isArray].asArray!.shapeChoices;
      }
    }

    queryParameters[field.name] = field;
  }

  return queryParameters;
};

export const QueryParametersPanel: FC<QueryParametersPanelProps> = ({
  parameters,
}) => {
  const classes = useStyles();
  return (
    <Panel header={<span>query string</span>}>
      {Object.entries(parameters).map(([key, field]) => (
        <div
          className={classnames(classes.queryComponentContainer, [
            ...[field.changes === 'added' && classes.added],
            ...[field.changes === 'updated' && classes.changed],
            ...[field.changes === 'removed' && classes.removed],
          ])}
          key={key}
        >
          <div className={classes.queryKey}>
            {key}
            {!field.required && (
              <span className={classes.attribute}> (optional) </span>
            )}

            {field.additionalAttributes &&
              field.additionalAttributes.map((attribute) => (
                <span key={attribute} className={classes.attribute}>
                  {' '}
                  ({attribute}){' '}
                </span>
              ))}
          </div>
          <div className={classes.shapeContainer}>
            <ShapeRenderer showExamples={false} shapes={field.shapeChoices} />
          </div>
        </div>
      ))}
    </Panel>
  );
};

const useStyles = makeStyles((theme) => ({
  queryTooltipContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  queryTooltipIcon: {
    margin: theme.spacing(0, 1),
  },
  queryComponentContainer: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    display: 'flex',
    '&:not(:first-child)': {
      borderTop: '1px solid #e4e8ed',
    },
  },
  queryKey: {
    fontFamily: FontFamily,
    fontWeight: 600,
    fontSize: theme.typography.fontSize - 1,
  },
  shapeContainer: {
    flexGrow: 1,
  },
  attribute: {
    fontSize: theme.typography.fontSize - 1,
    fontFamily: FontFamilyMono,
    fontWeight: 400,
    color: '#a3acb9',
  },
  added: {
    backgroundColor: `${AddedGreenBackground}`,
  },
  changed: {
    backgroundColor: `${ChangedYellowBackground}`,
  },
  removed: {
    backgroundColor: `${RemovedRedBackground}`,
  },
}));
