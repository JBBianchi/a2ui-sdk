/**
 * ChoicePickerComponent - Choice picker with two-way binding.
 * Renamed from MultipleChoice in 0.8. Supports both single selection (dropdown) and multi-selection (checkboxes).
 */

import { memo, useCallback, useState } from 'react'
import type { DynamicString } from '@a2ui-sdk/types/0.9'
import type { ChoicePickerComponentProps } from '@a2ui-sdk/types/0.9/standard-catalog'
import type { A2UIComponentProps } from '@/0.9/components/types'
import { useStringBinding, useFormBinding } from '../../hooks/useDataBinding'
import { useValidation } from '../../hooks/useValidation'
import { useValidationVisibility } from '../../hooks/useValidationVisibility'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Helper component to resolve option labels.
 */
function OptionLabel({
  surfaceId,
  label,
}: {
  surfaceId: string
  label: DynamicString | undefined
}) {
  const labelText = useStringBinding(surfaceId, label, '')
  return <>{labelText}</>
}

/**
 * Helper component to resolve an option label and check if it matches a filter.
 * Renders children only if the resolved label includes the filter text.
 */
function FilterableOption({
  surfaceId,
  label,
  filter,
  children,
}: {
  surfaceId: string
  label: DynamicString | undefined
  filter: string
  children: React.ReactNode
}) {
  const labelText = useStringBinding(surfaceId, label, '')
  if (filter && !labelText.toLowerCase().includes(filter.toLowerCase())) {
    return null
  }
  return <>{children}</>
}

/**
 * ChoicePicker component - choice picker input.
 * When variant === 'mutuallyExclusive', renders as a dropdown.
 * When variant === 'multipleSelection' or undefined, renders as checkboxes.
 */
export const ChoicePickerComponent = memo(function ChoicePickerComponent({
  surfaceId,
  componentId,
  label,
  variant = 'mutuallyExclusive',
  options,
  value: valueProp,
  displayStyle = 'checkbox',
  filterable = false,
  checks,
  weight,
}: A2UIComponentProps<ChoicePickerComponentProps>) {
  const labelText = useStringBinding(surfaceId, label, '')
  const isSingleSelection = variant === 'mutuallyExclusive'
  const { valid, errors } = useValidation(surfaceId, checks)
  const { visibleValid, visibleErrors, markInteracted } =
    useValidationVisibility(valid, errors)
  const [filter, setFilter] = useState('')

  const [selectedValue, setSelectedValue] = useFormBinding<string | string[]>(
    surfaceId,
    valueProp,
    isSingleSelection ? '' : []
  )

  const handleSingleChange = useCallback(
    (value: string) => {
      markInteracted()
      setSelectedValue(value)
    },
    [markInteracted, setSelectedValue]
  )

  const handleMultiChange = useCallback(
    (value: string, checked: boolean) => {
      markInteracted()
      const currentSelections = Array.isArray(selectedValue)
        ? selectedValue
        : selectedValue
          ? [selectedValue]
          : []

      if (checked) {
        setSelectedValue([...currentSelections, value])
      } else {
        setSelectedValue(currentSelections.filter((v) => v !== value))
      }
    },
    [markInteracted, selectedValue, setSelectedValue]
  )

  const id = `choicepicker-${componentId}`

  // Apply weight as flex-grow if set
  const style = weight ? { flexGrow: weight } : undefined

  if (!options || options.length === 0) {
    return null
  }

  const filterInput = filterable ? (
    <input
      type="text"
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      placeholder="Filter options..."
      className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
    />
  ) : null

  // Single selection mode - use dropdown
  if (isSingleSelection) {
    const currentValue = Array.isArray(selectedValue)
      ? selectedValue[0] || ''
      : selectedValue

    // Chips mode for single selection
    if (displayStyle === 'chips') {
      return (
        <div className={cn('flex flex-col gap-2')} style={style}>
          {labelText && <Label>{labelText}</Label>}
          {filterInput}
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <FilterableOption
                key={option.value}
                surfaceId={surfaceId}
                label={option.label}
                filter={filter}
              >
                <button
                  type="button"
                  onClick={() => handleSingleChange(option.value)}
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors cursor-pointer',
                    currentValue === option.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-foreground border-input hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <OptionLabel surfaceId={surfaceId} label={option.label} />
                </button>
              </FilterableOption>
            ))}
          </div>
          {visibleErrors.length > 0 && (
            <div className="text-sm text-destructive">
              {visibleErrors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className={cn('flex flex-col gap-2')} style={style}>
        {labelText && <Label htmlFor={id}>{labelText}</Label>}
        <Select value={currentValue} onValueChange={handleSingleChange}>
          <SelectTrigger
            id={id}
            className={cn(!visibleValid && 'border-destructive')}
            aria-invalid={!visibleValid}
          >
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <OptionLabel surfaceId={surfaceId} label={option.label} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {visibleErrors.length > 0 && (
          <div className="text-sm text-destructive">
            {visibleErrors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Multi-selection mode
  const currentSelections = Array.isArray(selectedValue)
    ? selectedValue
    : selectedValue
      ? [selectedValue]
      : []

  // Chips mode for multi-selection
  if (displayStyle === 'chips') {
    return (
      <div className={cn('flex flex-col gap-2')} style={style}>
        {labelText && <Label>{labelText}</Label>}
        {filterInput}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isChecked = currentSelections.includes(option.value)
            return (
              <FilterableOption
                key={option.value}
                surfaceId={surfaceId}
                label={option.label}
                filter={filter}
              >
                <button
                  type="button"
                  onClick={() => handleMultiChange(option.value, !isChecked)}
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors cursor-pointer',
                    isChecked
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-foreground border-input hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <OptionLabel surfaceId={surfaceId} label={option.label} />
                </button>
              </FilterableOption>
            )
          })}
        </div>
        {visibleErrors.length > 0 && (
          <div className="text-sm text-destructive">
            {visibleErrors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Default checkbox mode
  return (
    <div className={cn('flex flex-col gap-2')} style={style}>
      {labelText && <Label>{labelText}</Label>}
      {filterInput}
      {options.map((option) => {
        const isChecked = currentSelections.includes(option.value)
        const checkboxId = `${id}-${option.value}`

        return (
          <FilterableOption
            key={option.value}
            surfaceId={surfaceId}
            label={option.label}
            filter={filter}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                id={checkboxId}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  handleMultiChange(option.value, checked === true)
                }
              />
              <Label htmlFor={checkboxId} className="cursor-pointer">
                <OptionLabel surfaceId={surfaceId} label={option.label} />
              </Label>
            </div>
          </FilterableOption>
        )
      })}
      {visibleErrors.length > 0 && (
        <div className="text-sm text-destructive">
          {visibleErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
    </div>
  )
})

ChoicePickerComponent.displayName = 'A2UI.ChoicePicker'
