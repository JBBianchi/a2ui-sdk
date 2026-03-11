/**
 * ButtonComponent - Clickable button that triggers actions.
 */

import { memo, useCallback } from 'react'
import type { ButtonComponentProps } from '@a2ui-sdk/types/0.9/standard-catalog'
import type { A2UIComponentProps } from '@/0.9/components/types'
import { useDispatchAction } from '../../hooks/useDispatchAction'
import { useValidation } from '../../hooks/useValidation'
import { Button } from '@/components/ui/button'
import { ComponentRenderer } from '../ComponentRenderer'

/**
 * Button component - triggers actions on click.
 * When checks are defined and fail, the button is disabled.
 */
export const ButtonComponent = memo(function ButtonComponent({
  surfaceId,
  componentId,
  child,
  variant = 'default',
  action,
  checks,
  weight,
}: A2UIComponentProps<ButtonComponentProps>) {
  const dispatchAction = useDispatchAction()
  const { valid } = useValidation(surfaceId, checks)

  const handleClick = useCallback(() => {
    if (action) {
      dispatchAction(surfaceId, componentId, action)
    }
  }, [dispatchAction, surfaceId, componentId, action])

  // Apply weight as flex-grow if set
  const style = weight ? { flexGrow: weight } : undefined

  // Disable button if checks fail
  const isDisabled = !valid

  // Map A2UI variant to shadcn Button variant
  const buttonVariant =
    variant === 'primary'
      ? 'default'
      : variant === 'borderless'
        ? 'ghost'
        : 'outline'

  return (
    <Button
      variant={buttonVariant}
      onClick={handleClick}
      disabled={isDisabled}
      className="inline-flex items-center justify-center"
      style={style}
    >
      {child ? (
        <ComponentRenderer surfaceId={surfaceId} componentId={child} />
      ) : (
        'Button'
      )}
    </Button>
  )
})

ButtonComponent.displayName = 'A2UI.Button'
