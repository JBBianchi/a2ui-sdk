/**
 * Basic Catalog for A2UI v0.9
 *
 * This module exports the built-in v0.9 catalog. The spec now refers to this
 * as the "basic catalog"; the older `standard*` exports remain available as
 * compatibility aliases.
 *
 * @example
 * ```tsx
 * import { basicCatalog, A2UIProvider, A2UIRenderer } from '@a2ui-sdk/react/0.9'
 *
 * // Use the bundled basic catalog as-is
 * <A2UIProvider messages={messages} onAction={handleAction}>
 *   <A2UIRenderer />
 * </A2UIProvider>
 *
 * // Extend the basic catalog with custom components
 * const customCatalog = {
 *   ...basicCatalog,
 *   components: {
 *     ...basicCatalog.components,
 *     CustomChart: MyChartComponent,
 *   },
 * }
 * <A2UIProvider messages={messages} onAction={handleAction} catalog={customCatalog}>
 *   <A2UIRenderer />
 * </A2UIProvider>
 * ```
 */

import type { ComponentType } from 'react'
import {
  FunctionRegistry,
  openUrl,
  formatString,
  formatNumber,
  formatCurrency,
  formatDate,
  pluralize,
  and,
  or,
  not,
  requiredFn,
  emailFn,
  regexFn,
  lengthFn,
  numericFn,
} from '@a2ui-sdk/utils/0.9'

// Display components
import {
  TextComponent,
  ImageComponent,
  IconComponent,
  VideoComponent,
  AudioPlayerComponent,
  DividerComponent,
} from '../components/display'

// Layout components
import {
  RowComponent,
  ColumnComponent,
  ListComponent,
  CardComponent,
  TabsComponent,
  ModalComponent,
  TemplateRenderer,
} from '../components/layout'

// Interactive components
import {
  ButtonComponent,
  TextFieldComponent,
  CheckBoxComponent,
  ChoicePickerComponent,
  SliderComponent,
  DateTimeInputComponent,
} from '../components/interactive'

/**
 * Type for a component in the catalog.
 * Components receive BaseComponentProps plus their specific props spread.
 * We use a loose type here since props are dynamically spread at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CatalogComponent = ComponentType<any>

/**
 * Type for the components registry in a catalog.
 */
export type CatalogComponents = Record<string, CatalogComponent>

/**
 * Type for functions in a catalog (reserved for future use).
 */
export type CatalogFunctions = Record<string, unknown>

/**
 * Type for a catalog containing components and functions.
 */
export interface Catalog {
  /** Component registry mapping type names to React components */
  components: CatalogComponents
  /** Function registry (reserved for future use) */
  functions: CatalogFunctions
}

/**
 * Basic components included in the default catalog.
 * Type assertions are used because ComponentRenderer spreads props at runtime
 * and the catalog just needs to map component type names to implementations.
 */
export const basicComponents: CatalogComponents = {
  // Display components (6)
  Text: TextComponent,
  Image: ImageComponent,
  Icon: IconComponent,
  Video: VideoComponent,
  AudioPlayer: AudioPlayerComponent,
  Divider: DividerComponent,

  // Layout components (6)
  Row: RowComponent,
  Column: ColumnComponent,
  List: ListComponent,
  Card: CardComponent,
  Tabs: TabsComponent,
  Modal: ModalComponent,

  // Interactive components (6)
  Button: ButtonComponent,
  TextField: TextFieldComponent,
  CheckBox: CheckBoxComponent,
  ChoicePicker: ChoicePickerComponent,
  Slider: SliderComponent,
  DateTimeInput: DateTimeInputComponent,
}

/**
 * Legacy alias for the built-in v0.9 component registry.
 */
export const standardComponents = basicComponents

/**
 * Basic functions included in the default catalog.
 */
export const basicFunctions: CatalogFunctions = {}

/**
 * Legacy alias for the built-in v0.9 function registry metadata.
 */
export const standardFunctions = basicFunctions

/**
 * Creates a FunctionRegistry with all basic catalog functions registered.
 */
export function createBasicFunctionRegistry(): FunctionRegistry {
  const registry = new FunctionRegistry()
  // Catalog functions
  registry.register(openUrl)
  registry.register(formatString)
  registry.register(formatNumber)
  registry.register(formatCurrency)
  registry.register(formatDate)
  registry.register(pluralize)
  // Logic functions
  registry.register(and)
  registry.register(or)
  registry.register(not)
  // Validation functions
  registry.register(requiredFn)
  registry.register(emailFn)
  registry.register(regexFn)
  registry.register(lengthFn)
  registry.register(numericFn)
  return registry
}

/**
 * Legacy alias for `createBasicFunctionRegistry()`.
 */
export const createStandardFunctionRegistry = createBasicFunctionRegistry

/**
 * The basic catalog containing all built-in A2UI v0.9 components and functions.
 *
 * This is the default catalog used when no custom catalog is provided to A2UIProvider.
 *
 * @example
 * ```tsx
 * // Use as-is
 * <A2UIProvider messages={messages} onAction={handleAction}>
 *   <A2UIRenderer />
 * </A2UIProvider>
 *
 * // Extend with custom components
 * const myCatalog = {
 *   ...basicCatalog,
 *   components: {
 *     ...basicCatalog.components,
 *     MyComponent: MyComponentImpl,
 *   },
 * }
 * ```
 */
export const basicCatalog: Catalog = {
  components: basicComponents,
  functions: basicFunctions,
}

/**
 * Legacy alias for the built-in v0.9 basic catalog.
 */
export const standardCatalog: Catalog = basicCatalog

// Re-export individual components for direct imports
export {
  // Display
  TextComponent,
  ImageComponent,
  IconComponent,
  VideoComponent,
  AudioPlayerComponent,
  DividerComponent,
  // Layout
  RowComponent,
  ColumnComponent,
  ListComponent,
  CardComponent,
  TabsComponent,
  ModalComponent,
  TemplateRenderer,
  // Interactive
  ButtonComponent,
  TextFieldComponent,
  CheckBoxComponent,
  ChoicePickerComponent,
  SliderComponent,
  DateTimeInputComponent,
}
