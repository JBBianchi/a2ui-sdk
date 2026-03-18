import { memo, useCallback, useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
  useFunctionRegistry,
  useFormBinding,
  useScope,
  useStringBinding,
  useValidation,
  type CheckRule,
  type DynamicValue,
  type DynamicString,
} from '@a2ui-sdk/react/0.9'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select'
import { cn } from '../lib/utils'

export interface RichChoiceOption {
  label: DynamicString
  description?: DynamicString
  value: string
}

interface WriteTarget {
  path: string
}

interface RichChoiceSelection {
  value: string
  label: string
}

interface LegacyRichChoiceSelection {
  id: string
  label: string
}

type RichChoiceValue =
  | RichChoiceSelection
  | RichChoiceSelection[]
  | string
  | string[]

export interface RichChoicePickerProps {
  surfaceId: string
  componentId: string
  weight?: number
  label?: DynamicString
  variant?: 'multipleSelection' | 'mutuallyExclusive'
  displayStyle?: 'card' | 'select'
  options: RichChoiceOption[]
  value: WriteTarget | RichChoiceSelection | RichChoiceSelection[]
  filterable?: boolean
  checks?: CheckRule[]
}

type Registry = ReturnType<typeof useFunctionRegistry>

function isPathBinding(value: unknown): value is WriteTarget {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof value.path === 'string'
  )
}

function isFunctionCall(
  value: unknown
): value is { call: string; args?: Record<string, unknown> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'call' in value &&
    typeof value.call === 'string'
  )
}

function resolveScopedPath(path: string, basePath: string | null) {
  if (path.startsWith('/')) {
    return path
  }

  return basePath ? `${basePath}/${path}` : `/${path}`
}

function decodePointerSegment(segment: string) {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}

function getValueAtPath(model: unknown, path: string): unknown {
  if (path === '/') {
    return model
  }

  if (!path.startsWith('/')) {
    return undefined
  }

  const segments = path
    .slice(1)
    .split('/')
    .filter(Boolean)
    .map(decodePointerSegment)

  let current: unknown = model

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index)) {
        return undefined
      }
      current = current[index]
      continue
    }

    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment]
      continue
    }

    return undefined
  }

  return current
}

function resolveDynamicValue(
  value: unknown,
  dataModel: Record<string, unknown>,
  basePath: string | null,
  registry: Registry
): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (isPathBinding(value)) {
    return getValueAtPath(dataModel, resolveScopedPath(value.path, basePath))
  }

  if (isFunctionCall(value)) {
    if (!registry) {
      return undefined
    }

    const resolvedArgs: Record<string, unknown> = {}
    for (const [key, arg] of Object.entries(value.args ?? {})) {
      resolvedArgs[key] = resolveDynamicValue(
        arg,
        dataModel,
        basePath,
        registry
      )
    }

    return registry.execute(value.call, resolvedArgs, dataModel, basePath)
  }

  return value
}

function getSelectionPayload(
  option: RichChoiceOption,
  dataModel: Record<string, unknown>,
  basePath: string | null,
  registry: Registry
): RichChoiceSelection {
  const resolvedLabel = resolveDynamicValue(
    option.label as DynamicValue,
    dataModel,
    basePath,
    registry
  )

  return {
    value: option.value,
    label:
      typeof resolvedLabel === 'string'
        ? resolvedLabel
        : resolvedLabel === null || resolvedLabel === undefined
          ? option.value
          : String(resolvedLabel),
  }
}

function isRichChoiceSelection(value: unknown): value is RichChoiceSelection {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof value.value === 'string' &&
    'label' in value &&
    typeof value.label === 'string'
  )
}

function isLegacyRichChoiceSelection(
  value: unknown
): value is LegacyRichChoiceSelection {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'label' in value &&
    typeof value.label === 'string'
  )
}

function getSelectionValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value
  }

  if (isRichChoiceSelection(value)) {
    return value.value
  }

  if (isLegacyRichChoiceSelection(value)) {
    return value.id
  }

  return null
}

function stripMarkdown(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#]/g, ' ')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesFilter(
  filter: string,
  labelText: string,
  descriptionText: string
) {
  const normalizedFilter = filter.trim().toLowerCase()
  if (!normalizedFilter) {
    return true
  }

  return stripMarkdown(`${labelText} ${descriptionText}`)
    .toLowerCase()
    .includes(normalizedFilter)
}

function getSearchKeywords(labelText: string, descriptionText: string) {
  return [stripMarkdown(labelText), stripMarkdown(descriptionText)].filter(
    Boolean
  )
}

function MarkdownText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  if (!text) {
    return null
  }

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="m-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          a: ({ children }) => <span className="underline">{children}</span>,
          code: ({ children }) => (
            <code className="rounded bg-black/5 px-1 py-0.5 text-[0.85em] dark:bg-white/10">
              {children}
            </code>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function RichOptionContent({
  labelText,
  descriptionText,
  className,
  labelClassName,
  descriptionClassName,
}: {
  labelText: string
  descriptionText: string
  className?: string
  labelClassName?: string
  descriptionClassName?: string
}) {
  return (
    <div className={cn('min-w-0 flex-1 space-y-1', className)}>
      <MarkdownText
        text={labelText}
        className={cn(
          'text-sm font-medium text-slate-950 dark:text-slate-50',
          labelClassName
        )}
      />
      <MarkdownText
        text={descriptionText}
        className={cn(
          'text-sm text-slate-600 dark:text-slate-300',
          descriptionClassName
        )}
      />
    </div>
  )
}

function BoundRichOptionContent({
  surfaceId,
  option,
  className,
  labelClassName,
  descriptionClassName,
}: {
  surfaceId: string
  option: RichChoiceOption
  className?: string
  labelClassName?: string
  descriptionClassName?: string
}) {
  const labelText = useStringBinding(surfaceId, option.label, '')
  const descriptionText = useStringBinding(surfaceId, option.description, '')

  return (
    <RichOptionContent
      labelText={labelText}
      descriptionText={descriptionText}
      className={className}
      labelClassName={labelClassName}
      descriptionClassName={descriptionClassName}
    />
  )
}

function TriggerPlaceholder({ text }: { text: string }) {
  return (
    <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
      {text}
    </span>
  )
}

function ErrorMessages({
  componentId,
  errors,
}: {
  componentId: string
  errors: string[]
}) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div
      id={`${componentId}-errors`}
      className="space-y-1 text-sm text-red-600 dark:text-red-400"
    >
      {errors.map((error, index) => (
        <p key={`${componentId}-error-${index}`}>{error}</p>
      ))}
    </div>
  )
}

function StandaloneFilterInput({
  inputId,
  value,
  invalid,
  onChange,
}: {
  inputId: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}) {
  return (
    <input
      id={inputId}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Filter options..."
      className={cn(
        'h-10 rounded-lg border bg-transparent px-3 text-sm outline-none transition-colors',
        invalid
          ? 'border-red-500'
          : 'border-slate-300 focus:border-slate-500 dark:border-slate-700 dark:focus:border-slate-400'
      )}
    />
  )
}

function SingleSelectionTriggerContent({
  surfaceId,
  option,
}: {
  surfaceId: string
  option?: RichChoiceOption
}) {
  if (!option) {
    return <TriggerPlaceholder text="Select an option" />
  }

  return (
    <BoundRichOptionContent
      surfaceId={surfaceId}
      option={option}
      className="pr-2"
      labelClassName="font-semibold"
    />
  )
}

function MultiSelectionTriggerContent({
  surfaceId,
  option,
  extraSelectionCount,
}: {
  surfaceId: string
  option?: RichChoiceOption
  extraSelectionCount: number
}) {
  if (!option) {
    return <TriggerPlaceholder text="Select one or more options" />
  }

  return (
    <div className="flex min-w-0 items-start gap-2">
      <BoundRichOptionContent
        surfaceId={surfaceId}
        option={option}
        className="min-w-0 flex-1"
        labelClassName="font-semibold"
      />
      {extraSelectionCount > 0 ? (
        <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          +{extraSelectionCount} more
        </span>
      ) : null}
    </div>
  )
}

function RichChoiceOptionCard({
  surfaceId,
  option,
  filter,
  selected,
  singleSelection,
  invalid,
  onToggle,
}: {
  surfaceId: string
  option: RichChoiceOption
  filter: string
  selected: boolean
  singleSelection: boolean
  invalid: boolean
  onToggle: () => void
}) {
  const labelText = useStringBinding(surfaceId, option.label, '')
  const descriptionText = useStringBinding(surfaceId, option.description, '')

  if (!matchesFilter(filter, labelText, descriptionText)) {
    return null
  }

  const cardClassName = cn(
    'w-full rounded-xl border bg-white/80 p-4 text-left shadow-sm transition-colors dark:bg-slate-950/40',
    selected
      ? 'border-slate-900 ring-1 ring-slate-900 dark:border-slate-100 dark:ring-slate-100'
      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
    invalid && 'border-red-500 dark:border-red-500'
  )

  if (singleSelection) {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onToggle}
        className={cardClassName}
      >
        <div className="flex items-start justify-between gap-4">
          <RichOptionContent
            labelText={labelText}
            descriptionText={descriptionText}
            className="space-y-2"
            labelClassName="font-semibold"
          />
          {selected ? (
            <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-950">
              Selected
            </span>
          ) : null}
        </div>
      </button>
    )
  }

  return (
    <label
      className={cn(cardClassName, 'flex cursor-pointer items-start gap-3')}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-1 h-4 w-4 shrink-0 accent-slate-900 dark:accent-slate-100"
      />
      <RichOptionContent
        labelText={labelText}
        descriptionText={descriptionText}
        className="space-y-2"
        labelClassName="font-semibold"
      />
    </label>
  )
}

function RichChoiceSelectItem({
  surfaceId,
  option,
}: {
  surfaceId: string
  option: RichChoiceOption
}) {
  const labelText = useStringBinding(surfaceId, option.label, '')
  const descriptionText = useStringBinding(surfaceId, option.description, '')

  return (
    <SelectItem
      value={option.value}
      textValue={
        stripMarkdown(`${labelText} ${descriptionText}`) || option.value
      }
    >
      <RichOptionContent
        labelText={labelText}
        descriptionText={descriptionText}
        className="pr-6"
      />
    </SelectItem>
  )
}

function RichChoiceCommandItem({
  surfaceId,
  option,
  selected,
  onSelect,
}: {
  surfaceId: string
  option: RichChoiceOption
  selected: boolean
  onSelect: (value: string) => void
}) {
  const labelText = useStringBinding(surfaceId, option.label, '')
  const descriptionText = useStringBinding(surfaceId, option.description, '')

  return (
    <CommandItem
      value={option.value}
      keywords={getSearchKeywords(labelText, descriptionText)}
      onSelect={onSelect}
      className="pr-10"
    >
      <RichOptionContent
        labelText={labelText}
        descriptionText={descriptionText}
        className="min-w-0 flex-1"
      />
      <Check
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0 text-slate-700 dark:text-slate-200',
          selected ? 'opacity-100' : 'opacity-0'
        )}
      />
    </CommandItem>
  )
}

function RichChoiceMultiCommandItem({
  surfaceId,
  option,
  selected,
  onToggle,
}: {
  surfaceId: string
  option: RichChoiceOption
  selected: boolean
  onToggle: () => void
}) {
  const labelText = useStringBinding(surfaceId, option.label, '')
  const descriptionText = useStringBinding(surfaceId, option.description, '')

  return (
    <CommandItem
      value={option.value}
      keywords={getSearchKeywords(labelText, descriptionText)}
      onSelect={onToggle}
    >
      <input
        type="checkbox"
        checked={selected}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none mt-1 h-4 w-4 shrink-0 accent-slate-900 dark:accent-slate-100"
      />
      <RichOptionContent
        labelText={labelText}
        descriptionText={descriptionText}
        className="min-w-0 flex-1"
      />
    </CommandItem>
  )
}

export const RichChoicePicker = memo(function RichChoicePicker({
  surfaceId,
  componentId,
  label,
  variant = 'mutuallyExclusive',
  displayStyle = 'card',
  options,
  value: valueProp,
  filterable = false,
  checks,
  weight,
}: RichChoicePickerProps) {
  const { basePath } = useScope()
  const registry = useFunctionRegistry()
  const labelText = useStringBinding(surfaceId, label, '')
  const { valid, errors } = useValidation(surfaceId, checks)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [filter, setFilter] = useState('')
  const [singleSelectOpen, setSingleSelectOpen] = useState(false)
  const [multiSelectOpen, setMultiSelectOpen] = useState(false)
  const singleSelection = variant === 'mutuallyExclusive'
  const [dataModel] = useFormBinding<Record<string, unknown>>(surfaceId, {
    path: '/',
  })

  const [selectedValue, setSelectedValue] =
    useFormBinding<RichChoiceValue | null>(
      surfaceId,
      valueProp as unknown as DynamicValue,
      singleSelection ? null : []
    )

  const optionByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options]
  )

  const currentSelectionValues = useMemo(() => {
    const source = Array.isArray(selectedValue)
      ? selectedValue
      : selectedValue
        ? [selectedValue]
        : []

    return source
      .map((entry) => getSelectionValue(entry))
      .filter((entry): entry is string => Boolean(entry))
  }, [selectedValue])

  const handleSingleChange = useCallback(
    (nextValue: string) => {
      const option = optionByValue.get(nextValue)
      if (!option) {
        return
      }

      setHasInteracted(true)
      setSelectedValue(
        getSelectionPayload(option, dataModel, basePath, registry)
      )
    },
    [optionByValue, setSelectedValue, dataModel, basePath, registry]
  )

  const handleMultiChange = useCallback(
    (nextValue: string, checked: boolean) => {
      setHasInteracted(true)
      const nextSelectionValues = checked
        ? currentSelectionValues.includes(nextValue)
          ? currentSelectionValues
          : [...currentSelectionValues, nextValue]
        : currentSelectionValues.filter((value) => value !== nextValue)

      const nextSelections = nextSelectionValues
        .map((value) => optionByValue.get(value))
        .filter((option): option is RichChoiceOption => Boolean(option))
        .map((option) =>
          getSelectionPayload(option, dataModel, basePath, registry)
        )

      setSelectedValue(nextSelections)
    },
    [
      currentSelectionValues,
      optionByValue,
      setSelectedValue,
      dataModel,
      basePath,
      registry,
    ]
  )

  const visibleErrors = hasInteracted && !valid ? errors : []
  const invalid = visibleErrors.length > 0
  const style = weight ? { flexGrow: weight } : undefined
  const filterInputId = `rich-choice-filter-${componentId}`
  const singleSelectedValue = currentSelectionValues[0] || ''
  const selectedOption = options.find(
    (option) => option.value === singleSelectedValue
  )
  const selectedOptions = currentSelectionValues
    .map((value) => options.find((option) => option.value === value))
    .filter((option): option is RichChoiceOption => Boolean(option))
  const firstSelectedOption = selectedOptions[0]
  const extraSelectionCount = Math.max(selectedOptions.length - 1, 0)

  if (!options?.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-3" style={style}>
      <MarkdownText
        text={labelText}
        className="text-sm font-medium text-slate-950 dark:text-slate-100"
      />

      {displayStyle === 'card' && filterable ? (
        <StandaloneFilterInput
          inputId={filterInputId}
          value={filter}
          invalid={invalid}
          onChange={setFilter}
        />
      ) : null}

      {displayStyle === 'card' ? (
        <div
          role={singleSelection ? 'radiogroup' : undefined}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${componentId}-errors` : undefined}
          className="flex flex-col gap-3"
        >
          {options.map((option) => {
            const selected = currentSelectionValues.includes(option.value)
            return (
              <RichChoiceOptionCard
                key={option.value}
                surfaceId={surfaceId}
                option={option}
                filter={filter}
                selected={selected}
                singleSelection={singleSelection}
                invalid={invalid}
                onToggle={() =>
                  singleSelection
                    ? handleSingleChange(option.value)
                    : handleMultiChange(option.value, !selected)
                }
              />
            )
          })}
        </div>
      ) : singleSelection ? (
        filterable ? (
          <Popover
            open={singleSelectOpen}
            onOpenChange={(open) => {
              setSingleSelectOpen(open)
              if (!open) {
                setFilter('')
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-expanded={singleSelectOpen}
                aria-invalid={invalid}
                aria-describedby={invalid ? `${componentId}-errors` : undefined}
                className={cn(
                  'flex min-h-14 w-full items-start justify-between gap-3 rounded-xl border bg-white/90 px-3 py-3 text-left shadow-sm outline-none transition-colors dark:bg-slate-950/60',
                  invalid
                    ? 'border-red-500'
                    : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
                )}
              >
                <div className="min-w-0 flex-1">
                  <SingleSelectionTriggerContent
                    surfaceId={surfaceId}
                    option={selectedOption}
                  />
                </div>
                <ChevronsUpDown className="mt-1 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command>
                <CommandInput
                  value={filter}
                  onValueChange={setFilter}
                  placeholder="Search options..."
                />
                <CommandList>
                  <CommandEmpty>No options match your search.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <RichChoiceCommandItem
                        key={option.value}
                        surfaceId={surfaceId}
                        option={option}
                        selected={option.value === singleSelectedValue}
                        onSelect={(nextValue) => {
                          handleSingleChange(nextValue)
                          setSingleSelectOpen(false)
                          setFilter('')
                        }}
                      />
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <Select
            value={singleSelectedValue}
            onValueChange={handleSingleChange}
          >
            <SelectTrigger
              aria-invalid={invalid}
              aria-describedby={invalid ? `${componentId}-errors` : undefined}
              className={cn(
                'min-h-14 items-start',
                invalid && 'border-red-500'
              )}
            >
              <div className="min-w-0 flex-1">
                <SingleSelectionTriggerContent
                  surfaceId={surfaceId}
                  option={selectedOption}
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <RichChoiceSelectItem
                  key={option.value}
                  surfaceId={surfaceId}
                  option={option}
                />
              ))}
            </SelectContent>
          </Select>
        )
      ) : (
        <Popover
          open={multiSelectOpen}
          onOpenChange={(open) => {
            setMultiSelectOpen(open)
            if (!open) {
              setFilter('')
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-expanded={multiSelectOpen}
              aria-invalid={invalid}
              aria-describedby={invalid ? `${componentId}-errors` : undefined}
              className={cn(
                'flex min-h-14 w-full items-start justify-between gap-3 rounded-xl border bg-white/90 px-3 py-3 text-left shadow-sm outline-none transition-colors dark:bg-slate-950/60',
                invalid
                  ? 'border-red-500'
                  : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
              )}
            >
              <div className="min-w-0 flex-1">
                <MultiSelectionTriggerContent
                  surfaceId={surfaceId}
                  option={firstSelectedOption}
                  extraSelectionCount={extraSelectionCount}
                />
              </div>
              <ChevronsUpDown className="mt-1 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command shouldFilter={filterable}>
              {filterable ? (
                <CommandInput
                  value={filter}
                  onValueChange={setFilter}
                  placeholder="Search options..."
                />
              ) : null}
              <CommandList>
                {filterable ? (
                  <CommandEmpty>No options match your search.</CommandEmpty>
                ) : null}
                <CommandGroup>
                  {options.map((option) => {
                    const selected = currentSelectionValues.includes(
                      option.value
                    )
                    return (
                      <RichChoiceMultiCommandItem
                        key={option.value}
                        surfaceId={surfaceId}
                        option={option}
                        selected={selected}
                        onToggle={() =>
                          handleMultiChange(option.value, !selected)
                        }
                      />
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      <ErrorMessages componentId={componentId} errors={visibleErrors} />
    </div>
  )
})

RichChoicePicker.displayName = 'Playground.RichChoicePicker'
