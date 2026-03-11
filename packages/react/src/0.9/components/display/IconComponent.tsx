/**
 * IconComponent - Displays icons from the A2UI icon set.
 */

import { memo } from 'react'
import type { IconComponentProps } from '@a2ui-sdk/types/0.9/standard-catalog'
import type { A2UIComponentProps } from '@/0.9/components/types'
import { useStringBinding } from '../../hooks/useDataBinding'
import {
  User,
  Plus,
  ArrowLeft,
  ArrowRight,
  Paperclip,
  Calendar,
  Phone,
  Camera,
  Check,
  X,
  Trash2,
  Download,
  Pencil,
  CalendarDays,
  AlertCircle,
  FastForward,
  Heart,
  HeartOff,
  Folder,
  HelpCircle,
  Home,
  Info,
  MapPin,
  Lock,
  Unlock,
  Mail,
  Menu,
  MoreVertical,
  MoreHorizontal,
  BellOff,
  Bell,
  Pause,
  CreditCard,
  UserCircle,
  Image,
  Play,
  Printer,
  RefreshCw,
  Rewind,
  Search,
  Send,
  Settings,
  Share2,
  ShoppingCart,
  SkipBack,
  SkipForward,
  Square,
  Star,
  StarHalf,
  StarOff,
  Upload,
  Eye,
  EyeOff,
  Volume1,
  Volume2,
  VolumeX,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Maps A2UI icon names to Lucide React icons.
 */
const iconMap: Record<string, LucideIcon> = {
  accountCircle: UserCircle,
  add: Plus,
  arrowBack: ArrowLeft,
  arrowForward: ArrowRight,
  attachFile: Paperclip,
  calendarToday: Calendar,
  call: Phone,
  camera: Camera,
  check: Check,
  close: X,
  delete: Trash2,
  download: Download,
  edit: Pencil,
  event: CalendarDays,
  error: AlertCircle,
  fastForward: FastForward,
  favorite: Heart,
  favoriteOff: HeartOff,
  folder: Folder,
  help: HelpCircle,
  home: Home,
  info: Info,
  locationOn: MapPin,
  lock: Lock,
  lockOpen: Unlock,
  mail: Mail,
  menu: Menu,
  moreVert: MoreVertical,
  moreHoriz: MoreHorizontal,
  notificationsOff: BellOff,
  notifications: Bell,
  pause: Pause,
  payment: CreditCard,
  person: User,
  phone: Phone,
  photo: Image,
  play: Play,
  print: Printer,
  refresh: RefreshCw,
  rewind: Rewind,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  shoppingCart: ShoppingCart,
  skipNext: SkipForward,
  skipPrevious: SkipBack,
  star: Star,
  starHalf: StarHalf,
  starOff: StarOff,
  stop: Square,
  upload: Upload,
  visibility: Eye,
  visibilityOff: EyeOff,
  volumeDown: Volume1,
  volumeMute: VolumeX,
  volumeOff: VolumeX,
  volumeUp: Volume2,
  warning: AlertTriangle,
}

/**
 * Icon component for displaying icons from the A2UI icon set.
 */
export const IconComponent = memo(function IconComponent({
  surfaceId,
  name,
}: A2UIComponentProps<IconComponentProps>) {
  const iconName = useStringBinding(surfaceId, name, '')

  if (!iconName) {
    return null
  }

  const Icon = iconMap[iconName]

  if (!Icon) {
    console.warn(`[A2UI 0.9] Unknown icon name: ${iconName}`)
    return null
  }

  return <Icon className={cn('w-5 h-5')} />
})

IconComponent.displayName = 'A2UI.Icon'
