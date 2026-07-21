import { Text, View, Image } from 'react-native'
import LottieView from 'lottie-react-native'

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-sagard-dark">
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <LottieView
          source={require('../assets/lottie-splash.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200, position: 'absolute' }}
        />
        <Image
          source={require('../assets/logo-sagard-transparant.png')}
          style={{ width: 120, height: 120, resizeMode: 'contain' }}
        />
      </View>
    </View>
  )
}

export function ErrorView({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-6">
      <Text className="text-red-500 font-semibold text-center">{message}</Text>
    </View>
  )
}

export function EmptyView({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-6">
      <Text className="text-slate-400 text-center">{message}</Text>
    </View>
  )
}
