import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import type { ComponentDefinition } from '@a2ui-sdk/types/0.9'

type JsonRecord = Record<string, unknown>

export interface PropertyContract {
  required: boolean
  enumValues?: string[]
}

export interface ComponentContract {
  name: string
  props: Record<string, PropertyContract>
}

export interface FunctionContract {
  name: string
  returnType?: string
}

export interface ComponentSmokeScenario {
  name: string
  rootId: string
  components: ComponentDefinition[]
  dataModel?: Record<string, unknown>
}

const schemasDir = resolve(__dirname, '../schemas')
const typesDir = resolve(__dirname, '../../../../types/src/0.9')
const ignoredSchemaProps = new Set(['id', 'component', 'accessibility'])

const basicCatalogSchema = loadJson('basic_catalog.json')
const commonTypesSchema = loadJson('common_types.json')

export function getSchemaComponentContracts(): Record<
  string,
  ComponentContract
> {
  const components = asRecord(basicCatalogSchema.components)
  if (!components) {
    throw new Error('basic_catalog.json is missing a components object')
  }

  return Object.fromEntries(
    Object.entries(components).map(([name, schema]) => {
      const flattened = flattenSchemaObject(schema)
      const props = Object.fromEntries(
        Object.entries(flattened.props)
          .filter(([propName]) => !ignoredSchemaProps.has(propName))
          .map(([propName, propContract]) => [
            propName,
            {
              required: flattened.required.has(propName),
              ...(propContract.enumValues
                ? { enumValues: propContract.enumValues }
                : {}),
            },
          ])
      )

      return [name, { name, props }]
    })
  )
}

export function getSchemaFunctionContracts(): Record<string, FunctionContract> {
  const functions = asRecord(basicCatalogSchema.functions)
  if (!functions) {
    throw new Error('basic_catalog.json is missing a functions object')
  }

  return Object.fromEntries(
    Object.entries(functions).map(([name, schema]) => [
      name,
      {
        name,
        returnType: getConstProperty(schema, 'returnType'),
      },
    ])
  )
}

export function getTypeScriptComponentContracts(): Record<
  string,
  ComponentContract
> {
  const standardCatalogPath = resolve(typesDir, 'standard-catalog.ts')
  const typesIndexPath = resolve(typesDir, 'index.ts')

  const program = ts.createProgram([standardCatalogPath, typesIndexPath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: false,
    skipLibCheck: true,
    strict: true,
  })
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(standardCatalogPath)

  if (!sourceFile) {
    throw new Error(`Could not load ${standardCatalogPath}`)
  }

  const contracts: Record<string, ComponentContract> = {}

  for (const statement of sourceFile.statements) {
    if (
      !ts.isInterfaceDeclaration(statement) ||
      !statement.name.text.endsWith('ComponentProps')
    ) {
      continue
    }

    const interfaceName = statement.name.text
    const componentName = interfaceName.replace(/ComponentProps$/, '')
    const symbol = checker.getSymbolAtLocation(statement.name)
    if (!symbol) {
      throw new Error(`Could not resolve symbol for ${interfaceName}`)
    }

    const type = checker.getDeclaredTypeOfSymbol(symbol)
    const props = Object.fromEntries(
      checker.getPropertiesOfType(type).map((propSymbol) => {
        const propName = propSymbol.getName()
        const propType = checker.getTypeOfSymbolAtLocation(
          propSymbol,
          statement.name
        )

        return [
          propName,
          {
            required: !isOptionalSymbol(propSymbol),
            ...(getTypeScriptEnumValues(propType)
              ? { enumValues: getTypeScriptEnumValues(propType) }
              : {}),
          },
        ]
      })
    )

    // All rendered components also accept weight via A2UIComponentProps<T>.
    props.weight = {
      required: false,
    }

    contracts[componentName] = {
      name: componentName,
      props,
    }
  }

  return contracts
}

export const componentSmokeScenarios: ComponentSmokeScenario[] = [
  {
    name: 'Text',
    rootId: 'text-root',
    components: [{ id: 'text-root', component: 'Text', text: 'Hello world' }],
  },
  {
    name: 'Image',
    rootId: 'image-root',
    components: [
      {
        id: 'image-root',
        component: 'Image',
        url: 'https://example.com/image.png',
      },
    ],
  },
  {
    name: 'Icon',
    rootId: 'icon-root',
    components: [{ id: 'icon-root', component: 'Icon', name: 'info' }],
  },
  {
    name: 'Video',
    rootId: 'video-root',
    components: [
      {
        id: 'video-root',
        component: 'Video',
        url: 'https://example.com/video.mp4',
      },
    ],
  },
  {
    name: 'AudioPlayer',
    rootId: 'audio-root',
    components: [
      {
        id: 'audio-root',
        component: 'AudioPlayer',
        url: 'https://example.com/audio.mp3',
      },
    ],
  },
  {
    name: 'Row',
    rootId: 'row-root',
    components: [
      { id: 'row-root', component: 'Row', children: ['row-child'] },
      { id: 'row-child', component: 'Text', text: 'Row child' },
    ],
  },
  {
    name: 'Column',
    rootId: 'column-root',
    components: [
      { id: 'column-root', component: 'Column', children: ['column-child'] },
      { id: 'column-child', component: 'Text', text: 'Column child' },
    ],
  },
  {
    name: 'List',
    rootId: 'list-root',
    components: [
      { id: 'list-root', component: 'List', children: ['list-child'] },
      { id: 'list-child', component: 'Text', text: 'List child' },
    ],
  },
  {
    name: 'Card',
    rootId: 'card-root',
    components: [
      { id: 'card-root', component: 'Card', child: 'card-child' },
      { id: 'card-child', component: 'Text', text: 'Card child' },
    ],
  },
  {
    name: 'Tabs',
    rootId: 'tabs-root',
    components: [
      {
        id: 'tabs-root',
        component: 'Tabs',
        tabs: [{ title: 'Overview', child: 'tabs-child' }],
      },
      { id: 'tabs-child', component: 'Text', text: 'Tabs child' },
    ],
  },
  {
    name: 'Modal',
    rootId: 'modal-root',
    components: [
      {
        id: 'modal-root',
        component: 'Modal',
        trigger: 'modal-trigger',
        content: 'modal-content',
      },
      { id: 'modal-trigger', component: 'Text', text: 'Open modal' },
      { id: 'modal-content', component: 'Text', text: 'Modal content' },
    ],
  },
  {
    name: 'Divider',
    rootId: 'divider-root',
    components: [{ id: 'divider-root', component: 'Divider' }],
  },
  {
    name: 'Button',
    rootId: 'button-root',
    components: [
      {
        id: 'button-root',
        component: 'Button',
        child: 'button-label',
        action: { event: { name: 'submit' } },
      },
      { id: 'button-label', component: 'Text', text: 'Submit' },
    ],
  },
  {
    name: 'TextField',
    rootId: 'textfield-root',
    components: [
      {
        id: 'textfield-root',
        component: 'TextField',
        label: 'Name',
        value: 'Alice',
      },
    ],
  },
  {
    name: 'CheckBox',
    rootId: 'checkbox-root',
    components: [
      {
        id: 'checkbox-root',
        component: 'CheckBox',
        label: 'Accept terms',
        value: true,
      },
    ],
  },
  {
    name: 'ChoicePicker',
    rootId: 'choicepicker-root',
    components: [
      {
        id: 'choicepicker-root',
        component: 'ChoicePicker',
        label: 'Pick one',
        options: [
          { label: 'Alpha', value: 'alpha' },
          { label: 'Beta', value: 'beta' },
        ],
        value: ['alpha'],
      },
    ],
  },
  {
    name: 'Slider',
    rootId: 'slider-root',
    components: [
      {
        id: 'slider-root',
        component: 'Slider',
        label: 'Volume',
        max: 10,
        value: 5,
      },
    ],
  },
  {
    name: 'DateTimeInput',
    rootId: 'datetime-root',
    components: [
      {
        id: 'datetime-root',
        component: 'DateTimeInput',
        label: 'Start date',
        value: '2026-03-13',
        enableDate: true,
      },
    ],
  },
]

export function getBasicCatalogSchema(): JsonRecord {
  return basicCatalogSchema
}

export function getCommonTypesSchema(): JsonRecord {
  return commonTypesSchema
}

function loadJson(filename: string): JsonRecord {
  const content = readFileSync(resolve(schemasDir, filename), 'utf-8')
  return JSON.parse(content) as JsonRecord
}

function asRecord(value: unknown): JsonRecord | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as JsonRecord
  }
  return undefined
}

function getConstProperty(
  schema: unknown,
  propertyName: string
): string | undefined {
  const properties = asRecord(asRecord(schema)?.properties)
  const propertySchema = asRecord(properties?.[propertyName])
  return typeof propertySchema?.const === 'string'
    ? propertySchema.const
    : undefined
}

function flattenSchemaObject(
  schema: unknown,
  seenRefs = new Set<string>()
): {
  props: Record<string, { enumValues?: string[] }>
  required: Set<string>
} {
  const result = {
    props: {} as Record<string, { enumValues?: string[] }>,
    required: new Set<string>(),
  }

  const schemaRecord = asRecord(schema)
  if (!schemaRecord) {
    return result
  }

  const ref = schemaRecord.$ref
  if (typeof ref === 'string') {
    if (seenRefs.has(ref)) {
      return result
    }
    const nextSeenRefs = new Set(seenRefs)
    nextSeenRefs.add(ref)
    mergeFlattenedSchema(
      result,
      flattenSchemaObject(resolveSchemaRef(ref), nextSeenRefs)
    )
  }

  const allOf = Array.isArray(schemaRecord.allOf) ? schemaRecord.allOf : []
  for (const entry of allOf) {
    mergeFlattenedSchema(result, flattenSchemaObject(entry, seenRefs))
  }

  const properties = asRecord(schemaRecord.properties)
  if (properties) {
    for (const [propName, propSchema] of Object.entries(properties)) {
      result.props[propName] = {
        ...result.props[propName],
        ...(getSchemaEnumValues(propSchema)
          ? { enumValues: getSchemaEnumValues(propSchema) }
          : {}),
      }
    }
  }

  const required = Array.isArray(schemaRecord.required)
    ? schemaRecord.required.filter(
        (value): value is string => typeof value === 'string'
      )
    : []
  for (const propName of required) {
    result.required.add(propName)
  }

  return result
}

function mergeFlattenedSchema(
  target: {
    props: Record<string, { enumValues?: string[] }>
    required: Set<string>
  },
  source: {
    props: Record<string, { enumValues?: string[] }>
    required: Set<string>
  }
): void {
  for (const [propName, propContract] of Object.entries(source.props)) {
    target.props[propName] = {
      ...target.props[propName],
      ...propContract,
    }
  }

  for (const propName of source.required) {
    target.required.add(propName)
  }
}

function resolveSchemaRef(ref: string): unknown {
  const [filename, pointer = ''] = ref.split('#')

  if (filename === '') {
    try {
      return getByJsonPointer(basicCatalogSchema, pointer)
    } catch {
      return getByJsonPointer(commonTypesSchema, pointer)
    }
  }
  if (filename === 'basic_catalog.json') {
    return getByJsonPointer(basicCatalogSchema, pointer)
  }
  if (filename === 'common_types.json') {
    return getByJsonPointer(commonTypesSchema, pointer)
  }

  throw new Error(`Unsupported schema ref: ${ref}`)
}

function getByJsonPointer(document: JsonRecord, pointer: string): unknown {
  const segments = pointer
    .replace(/^#/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))

  let current: unknown = document
  for (const segment of segments) {
    const record = asRecord(current)
    if (!record || !(segment in record)) {
      throw new Error(
        `Could not resolve JSON pointer segment "${segment}" in ${pointer}`
      )
    }
    current = record[segment]
  }

  return current
}

function getSchemaEnumValues(schema: unknown): string[] | undefined {
  const schemaRecord = asRecord(schema)
  if (!schemaRecord) {
    return undefined
  }

  const enumValues = Array.isArray(schemaRecord.enum)
    ? schemaRecord.enum.filter(
        (value): value is string => typeof value === 'string'
      )
    : undefined
  if (enumValues && enumValues.length > 0) {
    return [...enumValues].sort()
  }

  if (typeof schemaRecord.$ref === 'string') {
    return getSchemaEnumValues(resolveSchemaRef(schemaRecord.$ref))
  }

  const allOf = Array.isArray(schemaRecord.allOf) ? schemaRecord.allOf : []
  for (const entry of allOf) {
    const values = getSchemaEnumValues(entry)
    if (values) {
      return values
    }
  }

  return undefined
}

function isOptionalSymbol(symbol: ts.Symbol): boolean {
  return (symbol.getFlags() & ts.SymbolFlags.Optional) !== 0
}

function getTypeScriptEnumValues(type: ts.Type): string[] | undefined {
  const unionMembers = type.isUnion() ? type.types : [type]
  const filteredMembers = unionMembers.filter(
    (member) => (member.flags & ts.TypeFlags.Undefined) === 0
  )

  if (
    filteredMembers.length === 0 ||
    !filteredMembers.every(
      (member) => (member.flags & ts.TypeFlags.StringLiteral) !== 0
    )
  ) {
    return undefined
  }

  return filteredMembers
    .map((member) => String((member as ts.StringLiteralType).value))
    .sort()
}
