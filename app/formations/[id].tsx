import { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, FileText, Video, ClipboardCheck, CheckCircle, XCircle, Award, Play } from 'lucide-react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { getTrainingDetail, submitTraining } from '../../services/training.service'

const TYPE_LABELS: Record<string, string> = {
  QCM: 'QCM',
  LECTURE: 'Lecture',
  VIDEO: 'Vidéo',
  PRATIQUE: 'Pratique',
}

export default function FormationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // QCM answers
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    if (!id) return
    try {
      const detail = await getTrainingDetail(id)
      setData(detail)
      setError(null)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#f5b800" size="large" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <Text className="text-red-500 font-semibold text-center">{error ?? 'Formation introuvable'}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-4 py-2 bg-slate-200 rounded-lg">
          <Text className="text-slate-700 font-medium">Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const session = data.session
  const isCompleted = data.status === 'TERMINE' || data.status === 'REUSSI' || data.status === 'ECHOUE'

  async function handleSubmit() {
    if (session.type === 'QCM') {
      const questions = session.questions ?? []
      const unanswered = questions.filter((q: any) => answers[q.id] === undefined)
      if (unanswered.length > 0) {
        Alert.alert('Attention', `Il reste ${unanswered.length} question(s) sans réponse. Voulez-vous continuer ?`, [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Soumettre', onPress: () => doSubmit() },
        ])
        return
      }
    }
    doSubmit()
  }

  async function doSubmit() {
    setSubmitting(true)
    try {
      const payload: any = {}
      if (session.type === 'QCM') {
        payload.answers = (session.questions ?? []).map((q: any) => ({
          questionId: q.id,
          selectedIndex: answers[q.id] ?? -1,
        }))
      }
      const result = await submitTraining(session.id, payload)
      Alert.alert(
        'Formation terminée',
        result.status === 'REUSSI' ? `Félicitations ! Vous avez réussi avec un score de ${result.score}%` :
        result.status === 'ECHOUE' ? `Vous avez obtenu ${result.score}%. Le score requis est de ${session.passingScore}%.` :
        'Votre formation a été enregistrée.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message ?? 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-8 px-6 rounded-b-[30px] shadow-2xl"
      >
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-1 mb-4">
          <ChevronLeft size={20} color="#94a3b8" />
          <Text className="text-slate-400 text-sm">Retour</Text>
        </TouchableOpacity>
        <Text className="text-slate-400 text-xs font-medium uppercase tracking-widest">{TYPE_LABELS[session.type]}</Text>
        <Text className="text-white font-bold text-2xl mt-1">{session.title}</Text>
        {session.description && (
          <Text className="text-slate-400 text-sm mt-2">{session.description}</Text>
        )}
      </LinearGradient>

      <View className="px-4 -mt-4 pb-8">
        {/* Info cards */}
        <View className="flex-row gap-3 mb-4">
          {session.trainer && (
            <View className="flex-1 bg-white rounded-xl p-3 border border-slate-200">
              <Text className="text-xs text-slate-400">Formateur</Text>
              <Text className="text-sm font-medium text-slate-700 mt-0.5">{session.trainer}</Text>
            </View>
          )}
          {session.location && (
            <View className="flex-1 bg-white rounded-xl p-3 border border-slate-200">
              <Text className="text-xs text-slate-400">Lieu</Text>
              <Text className="text-sm font-medium text-slate-700 mt-0.5">{session.location}</Text>
            </View>
          )}
        </View>

        {/* Status banner if completed */}
        {isCompleted && (
          <View className={`rounded-xl p-4 mb-4 flex-row items-center gap-3 ${data.status === 'REUSSI' ? 'bg-green-50 border border-green-200' : data.status === 'ECHOUE' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            {data.status === 'REUSSI' ? <CheckCircle size={24} color="#16a34a" /> :
             data.status === 'ECHOUE' ? <XCircle size={24} color="#dc2626" /> :
             <CheckCircle size={24} color="#2563eb" />}
            <View className="flex-1">
              <Text className={`font-bold ${data.status === 'REUSSI' ? 'text-green-700' : data.status === 'ECHOUE' ? 'text-red-700' : 'text-blue-700'}`}>
                {data.status === 'REUSSI' ? 'Formation réussie' : data.status === 'ECHOUE' ? 'Formation échouée' : 'Formation terminée'}
              </Text>
              {data.score != null && (
                <Text className="text-sm text-slate-500 mt-0.5">Score: {data.score}% · Requis: {session.passingScore}%</Text>
              )}
            </View>
          </View>
        )}

        {/* QCM */}
        {session.type === 'QCM' && !isCompleted && (
          <View className="space-y-4">
            <Text className="text-sm font-bold text-slate-700">Questions ({session.questions?.length ?? 0})</Text>
            {(session.questions ?? []).map((q: any, qi: number) => (
              <View key={q.id} className="bg-white rounded-xl p-4 border border-slate-200">
                <Text className="font-semibold text-slate-800 text-sm mb-3">
                  {qi + 1}. {q.question}
                </Text>
                <View className="space-y-2">
                  {q.options.map((opt: string, oi: number) => {
                    const selected = answers[q.id] === oi
                    return (
                      <TouchableOpacity
                        key={oi}
                        onPress={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                        className={`flex-row items-center gap-3 p-3 rounded-lg border ${selected ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selected ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                          {selected && <View className="w-2 h-2 rounded-full bg-white" />}
                        </View>
                        <Text className={`text-sm flex-1 ${selected ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            ))}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="bg-amber-500 py-3.5 rounded-xl items-center active:opacity-70 disabled:opacity-60"
            >
              {submitting ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text className="text-slate-900 font-bold text-sm">Soumettre le QCM</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* LECTURE */}
        {session.type === 'LECTURE' && !isCompleted && (
          <View className="space-y-4">
            <View className="bg-white rounded-xl p-5 border border-slate-200">
              <Text className="text-sm font-bold text-slate-700 mb-2">Contenu à lire</Text>
              <Text className="text-sm text-slate-600 leading-6">{session.content ?? 'Aucun contenu'}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="bg-amber-500 py-3.5 rounded-xl items-center active:opacity-70 disabled:opacity-60"
            >
              {submitting ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <CheckCircle size={18} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-sm">J'ai lu et compris</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* VIDEO */}
        {session.type === 'VIDEO' && !isCompleted && (
          <View className="space-y-4">
            <View className="bg-white rounded-xl p-5 border border-slate-200">
              <Text className="text-sm font-bold text-slate-700 mb-2">Vidéo de formation</Text>
              {session.videoUrl ? (
                <Text className="text-sm text-blue-600 underline">{session.videoUrl}</Text>
              ) : (
                <Text className="text-sm text-slate-400">Aucune vidéo disponible</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="bg-amber-500 py-3.5 rounded-xl items-center active:opacity-70 disabled:opacity-60"
            >
              {submitting ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Play size={18} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-sm">Marquer comme visionné</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* PRATIQUE */}
        {session.type === 'PRATIQUE' && !isCompleted && (
          <View className="space-y-4">
            <View className="bg-white rounded-xl p-5 border border-slate-200">
              <View className="flex-row items-center gap-2 mb-3">
                <ClipboardCheck size={20} color="#f5b800" />
                <Text className="text-sm font-bold text-slate-700">Évaluation pratique</Text>
              </View>
              <Text className="text-sm text-slate-600 leading-6">
                Cette formation nécessite une évaluation pratique sur le terrain. Après avoir complété l'évaluation, soumettez-la pour validation par votre formateur.
              </Text>
              {session.description && (
                <Text className="text-sm text-slate-500 mt-3 italic">{session.description}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || data.status === 'TERMINE'}
              className="bg-amber-500 py-3.5 rounded-xl items-center active:opacity-70 disabled:opacity-60"
            >
              {submitting ? (
                <ActivityIndicator color="#0f172a" />
              ) : data.status === 'TERMINE' ? (
                <View className="flex-row items-center gap-2">
                  <CheckCircle size={18} color="#0f172a" />
                  <Text className="text-slate-900 font-bold text-sm">En attente de validation</Text>
                </View>
              ) : (
                <Text className="text-slate-900 font-bold text-sm">Soumettre pour évaluation</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Completed QCM review */}
        {session.type === 'QCM' && isCompleted && (
          <View className="space-y-4">
            <Text className="text-sm font-bold text-slate-700">Vos réponses</Text>
            {(session.questions ?? []).map((q: any, qi: number) => {
              const userAnswer = data.answers?.find((a: any) => a.questionId === q.id)
              return (
                <View key={q.id} className="bg-white rounded-xl p-4 border border-slate-200">
                  <Text className="font-semibold text-slate-800 text-sm mb-3">{qi + 1}. {q.question}</Text>
                  <View className="space-y-2">
                    {q.options.map((opt: string, oi: number) => {
                      const isCorrect = oi === q.correctIndex
                      const isUserChoice = userAnswer?.selectedIndex === oi
                      return (
                        <View key={oi} className={`flex-row items-center gap-2 p-2.5 rounded-lg ${
                          isCorrect ? 'bg-green-50 border border-green-200' :
                          isUserChoice ? 'bg-red-50 border border-red-200' :
                          'bg-slate-50'
                        }`}>
                          {isCorrect ? <CheckCircle size={16} color="#16a34a" /> :
                           isUserChoice ? <XCircle size={16} color="#dc2626" /> :
                           <View className="w-4" />}
                          <Text className={`text-sm flex-1 ${isCorrect ? 'text-green-700 font-medium' : isUserChoice ? 'text-red-700' : 'text-slate-600'}`}>
                            {String.fromCharCode(65 + oi)}. {opt}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
