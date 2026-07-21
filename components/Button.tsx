import { TouchableOpacity, Text } from 'react-native'

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  disabled?: boolean
  loading?: boolean
  style?: string
}) {
  const variants: Record<string, string> = {
    primary: 'bg-sagard-yellow',
    secondary: 'bg-slate-200',
    danger: 'bg-red-600',
    ghost: 'bg-transparent border border-slate-300',
  }
  const textColors: Record<string, string> = {
    primary: 'text-sagard-dark',
    secondary: 'text-slate-700',
    danger: 'text-white',
    ghost: 'text-slate-600',
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-xl py-3.5 px-5 ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${style ?? ''}`}
    >
      <Text className={`font-bold text-base ${textColors[variant]}`}>
        {loading ? '...' : title}
      </Text>
    </TouchableOpacity>
  )
}
