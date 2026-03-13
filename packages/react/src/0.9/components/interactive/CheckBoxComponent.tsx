/**
 * CheckBoxComponent - Checkbox input with two-way binding.
 */

import { memo, useCallback } from 'react'
import type { CheckBoxComponentProps } from '@a2ui-sdk/types/0.9/standard-catalog'
import type { A2UIComponentProps } from '@/0.9/components/types'
import { useStringBinding, useFormBinding } from '../../hooks/useDataBinding'
import { useValidation } from '../../hooks/useValidation'
import { useValidationVisibility } from '../../hooks/useValidationVisibility'
import { useScopeBasePath } from '../../contexts/ScopeContext'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * CheckBox component - checkbox input with label.
 */
export const CheckBoxComponent = memo(function CheckBoxComponent({
  surfaceId,
  componentId,
  label,
  value: valueProp,
  checks,
  weight,
}: A2UIComponentProps<CheckBoxComponentProps>) {
  const labelText = useStringBinding(surfaceId, label, '')
  const [checked, setChecked] = useFormBinding<boolean>(
    surfaceId,
    valueProp,
    false
  )
  const { valid, errors } = useValidation(surfaceId, checks)
  const { visibleValid, visibleErrors, markInteracted } =
    useValidationVisibility(valid, errors)
  const basePath = useScopeBasePath()

  const handleChange = useCallback(
    (newChecked: boolean) => {
      markInteracted()
      setChecked(newChecked)
    },
    [markInteracted, setChecked]
  )

  // Include basePath in ID to ensure uniqueness in templated lists
  const id = basePath
    ? `checkbox-${componentId}-${basePath.replace(/\//g, '-')}`
    : `checkbox-${componentId}`

  // Apply weight as flex-grow if set
  const style = weight ? { flexGrow: weight } : undefined

  return (
    <div className={cn('flex flex-col gap-1')} style={style}>
      <div className="flex items-center gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={handleChange}
          aria-invalid={!visibleValid}
        />
        {labelText && (
          <Label htmlFor={id} className="cursor-pointer">
            {labelText}
          </Label>
        )}
      </div>
      {visibleErrors.length > 0 && (
        <div className="text-sm text-destructive ml-6">
          {visibleErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
    </div>
  )
})

CheckBoxComponent.displayName = 'A2UI.CheckBox'
