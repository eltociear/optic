import React, { FC, useMemo } from 'react';
import {
  makeStyles,
  darken,
  lighten,
  IconButton,
  ButtonGroup,
  Button,
  TextField,
} from '@material-ui/core';
import { Check as CheckIcon } from '@material-ui/icons';
import ClassNames from 'classnames';
import Color from 'color';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';

import { IFieldDetails, IShapeRenderer } from '<src>/types';
import { JsonType } from '@useoptic/optic-domain';
import * as Theme from '<src>/styles/theme';

export const ShapeEditor: FC<{
  fields: IFieldDetails[];
  selectedFieldId: string | null;
  setSelectedField: (fieldId: string | null) => void;
}> = ({ fields, selectedFieldId, setSelectedField }) => {
  const classes = useStyles();

  let onChangeFieldDescription = useMemo(
    () => (fieldId: string, description: string) => {
      console.log('description changed for field', fieldId, description);
    },
    []
  );

  return (
    <div className={classes.container}>
      {fields.length > 0 && (
        <ul className={classes.rowsList}>
          {fields.map((field) => (
            <li className={classes.rowListItem}>
              <Row
                field={field}
                description={''} // TODO FLEB: wire me in
                selected={selectedFieldId === field.fieldId}
                onChangeDescription={onChangeFieldDescription}
                onSelect={setSelectedField}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Row: FC<{
  field: IFieldDetails;
  description: string;
  selected: boolean;

  onChangeDescription?: (fieldId: string, description: string) => void;
  onSelect?: (fieldId: string) => void;
}> = function ShapeEditorRow({
  field,
  description,
  selected,
  onChangeDescription,
  onSelect,
}) {
  const classes = useStyles();

  const onClickFieldHeader = useMemo(
    () => () => {
      if (onSelect) onSelect(field.fieldId);
    },
    [onSelect, field.fieldId]
  );

  const onChangeType = useMemo(
    () => (type: JsonType, enabled: boolean) => {
      console.log('changed type for field', type, enabled, field.fieldId);
    },
    [field.fieldId]
  );

  const onChangeDescriptionHandler = useMemo(
    () => (description: string) => {
      if (onChangeDescription) onChangeDescription(field.fieldId, description);
    },
    [field.fieldId]
  );

  return (
    <div className={classes.row}>
      <Field
        depth={field.depth}
        name={field.name}
        required={field.required}
        shapes={field.shapes}
        selected={selected}
        onClickHeader={onClickFieldHeader}
      >
        {selected && (
          <FieldEditor
            field={field}
            description={description}
            onChangeType={onChangeType}
            onChangeDescription={onChangeDescriptionHandler}
          />
        )}
      </Field>
    </div>
  );
};

const FieldEditor: FC<{
  field: IFieldDetails;
  description: string;

  onChangeDescription?: (description: string) => void;
  onChangeType?: (type: JsonType, enabled: boolean) => void;
}> = function ShapeEditorFieldEditor({
  field,
  description,
  onChangeDescription,
  onChangeType,
}) {
  const classes = useStyles();

  let currentJsonTypes = field.shapes.map(({ jsonType }) => jsonType);
  if (!field.required) currentJsonTypes.push(JsonType.UNDEFINED);
  let nonEditableTypes = currentJsonTypes.filter(
    (jsonType) => jsonType !== JsonType.UNDEFINED && jsonType !== JsonType.NULL
  );

  let onClickTypeButton = useMemo(
    () => (type: JsonType) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (onChangeType) onChangeType(type, !currentJsonTypes.includes(type));
    },
    [field.fieldId, currentJsonTypes]
  );

  let onChangeDescriptionField = useMemo(
    () => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChangeDescription) onChangeDescription(e.target.value);
    },
    [field.fieldId, currentJsonTypes]
  );

  return (
    <div className={classes.editor}>
      <ButtonGroup className={classes.typeSelector}>
        <Button
          disableElevation
          variant={
            currentJsonTypes.includes(JsonType.UNDEFINED)
              ? 'contained'
              : 'outlined'
          }
          startIcon={
            currentJsonTypes.includes(JsonType.UNDEFINED) ? <CheckIcon /> : null
          }
          onClick={onClickTypeButton(JsonType.UNDEFINED)}
        >
          Optional
        </Button>
        <Button
          disableElevation
          variant={
            currentJsonTypes.includes(JsonType.NULL) ? 'contained' : 'outlined'
          }
          startIcon={
            currentJsonTypes.includes(JsonType.NULL) ? <CheckIcon /> : null
          }
          onClick={onClickTypeButton(JsonType.NULL)}
        >
          Null
        </Button>

        {nonEditableTypes.map((jsonType) => (
          <Button
            color="primary"
            variant="contained"
            disabled
            startIcon={<CheckIcon />}
          >
            {jsonType}
          </Button>
        ))}
      </ButtonGroup>

      <TextField
        defaultValue={description}
        label="Field description"
        placeholder={`What is ${field.name}? How is it used?`}
        variant="outlined"
        InputLabelProps={{ shrink: true }}
        onChange={onChangeDescriptionField}
      />
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  container: {},
  rowsList: {
    listStyleType: 'none',
    paddingLeft: 0,
  },
  rowListItem: {},
  row: {},

  editor: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3, 2),

    color: lighten('#6b7384', 0.2),

    boxShadow: 'inset 0px 13px 10px -10px rgba(0, 0, 0, 0.07)',
  },

  typeSelector: {
    marginBottom: theme.spacing(4),
  },
}));

const Field: FC<{
  children?: React.ReactNode;
  depth: number;
  name: string;
  required: boolean;
  selected: boolean;
  shapes: IShapeRenderer[];

  onClickHeader?: () => void;
}> = function ShapeEditorField({
  name,
  shapes,
  required,
  depth,
  children,
  selected,
  onClickHeader,
}) {
  const classes = useFieldStyles();

  const onClickHeaderHandler = useMemo(
    () => (e: React.MouseEvent) => {
      e.preventDefault();
      if (onClickHeader) onClickHeader();
    },
    [onClickHeader]
  );

  const onClickRemove = useMemo(
    () => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('clicked remove');
    },
    []
  );

  return (
    <div
      className={ClassNames(classes.container, {
        [classes.isSelected]: selected,
        [classes.isIndented]: depth > 0,
      })}
    >
      <header
        className={classes.header}
        onClick={onClickHeaderHandler}
        style={{
          paddingLeft: Math.max(depth - 1, 0) * INDENT_WIDTH,
          backgroundImage: `url("${indentsImageUrl(depth - 1)}")`,
        }}
      >
        <div className={classes.description}>
          <div className={classes.fieldName}>{name}</div>
          <div className={classes.typesSummary}>
            {summarizeTypes(shapes, required)}
          </div>
        </div>
        <div className={classes.controls}>
          {selected && (
            <IconButton
              className={classes.removeControl}
              size="small"
              onClick={onClickRemove}
            >
              <DeleteOutlineIcon />
            </IconButton>
          )}
        </div>
      </header>

      <div className={classes.stage}>{children}</div>
    </div>
  );
};

function summarizeTypes(shapes: IShapeRenderer[], required: boolean) {
  const optionalText = required ? '' : ' (optional)';
  let components = shapes.map(({ jsonType }: { jsonType: JsonType }) => (
    <span style={{ color: Theme.jsonTypeColors[jsonType] }}>
      {jsonType.toString().toLowerCase()}
    </span>
  ));
  if (shapes.length === 1) {
    return (
      <>
        {components} {optionalText}
      </>
    );
  } else {
    const last = components.pop();
    return (
      <>
        {components.map((component, i) => (
          <span key={i}>{component},</span>
        ))}{' '}
        or {last} {optionalText}
      </>
    );
  }
}

const INDENT_WIDTH = 8 * 3;
const INDENT_MARKER_WIDTH = 1;
const INDENT_COLOR = '#E4E8ED';
function indentsImageUrl(depth: number = 0) {
  let range = Array(Math.max(depth, 0))
    .fill(0)
    .map((val, n) => n);
  console.log(range);
  let width = INDENT_WIDTH * depth;
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='1' viewBox='0 0 ${width} 1'>
        ${range
          .map(
            (n) => `
            <rect fill="${INDENT_COLOR}" x="${
              INDENT_WIDTH * n
            }" y="0" height="1" width="${INDENT_MARKER_WIDTH}" />;
          `
          )
          .join('')}
      </svg>`
    )
  );
}

const useFieldStyles = makeStyles((theme) => ({
  container: {
    fontFamily: Theme.FontFamily,

    '&$isSelected': {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
      marginLeft: -1, // account for the added border
      boxShadow: '0px 8px 8px -5px rgb(0 0 0 / 12%)',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${Color(Theme.OpticBlueReadable)
        .saturate(0.8)
        .lighten(0.58)
        .hsl()
        .string()}`,
    },
  },
  isSelected: {},
  isIndented: {},

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    backgroundPositionX: theme.spacing(1),
    backgroundRepeat: 'repeat-y',

    '&:hover': {
      backgroundColor: lighten(Theme.OpticBlueReadable, 0.9),
    },

    '$isSelected &': {
      background: `${Color(Theme.OpticBlueReadable)
        .saturate(0.8)
        .lighten(0.63)
        .hsl()
        .string()} !important`,
      borderBottom: `1px solid ${Color(Theme.OpticBlueReadable)
        .saturate(0.8)
        .lighten(0.55)
        .hsl()
        .string()}`,

      // '&:hover': {
      //   borderBottom: `1px solid ${lighten(Theme.OpticBlueReadable, 0.2)}`,
      // },
    },
  },

  description: {
    display: 'flex',
    padding: theme.spacing(1, 0),
    marginLeft: theme.spacing(1),
    alignItems: 'baseline',
    borderLeft: `1px solid #E4E8ED`,
    borderLeftWidth: 0,

    '$isIndented &': {
      paddingLeft: INDENT_WIDTH,
      borderLeftWidth: '1px',
    },

    '$isIndented $header:hover &': {
      borderLeftColor: Color(Theme.OpticBlueReadable)
        .saturate(0.8)
        .lighten(0.43)
        .hsl()
        .string(),
    },

    '$isIndented$isSelected &': {
      borderLeftWidth: '1px',
      borderLeftColor: Color(Theme.OpticBlueReadable)
        .saturate(0.8)
        .lighten(0.53)
        .hsl()
        .string(),
    },
  },

  fieldName: {
    color: '#3c4257',
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.fontSize - 1,
    marginRight: theme.spacing(1),
  },
  typesSummary: {
    fontFamily: Theme.FontFamilyMono,
    color: '#8792a2',
  },

  // Controls
  //
  controls: {
    display: 'flex',
    color: '#ccc',
    marginRight: theme.spacing(1),
  },

  removeControl: {
    color: Color(Theme.OpticBlueReadable)
      .saturate(0.8)
      .lighten(0.2)
      .hsl()
      .string(),
  },

  stage: {},
}));
