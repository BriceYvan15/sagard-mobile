import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native'
import { FileText, X, DollarSign, ChevronRight, Receipt, AlertCircle, Calendar, Briefcase, Clock, TrendingUp, Target, Zap } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../lib/auth-context'
import { getPayrolls, getPayslip, getWorkStats } from '../../services/hr.service'

function fmtHours(hours: number): string {
  const h = Math.floor(hours)
  const min = Math.round((hours - h) * 60)
  return min > 0 ? `${h}h ${String(min).padStart(2, '0')}min` : `${h}h`
}

export default function PaieScreen() {
  const { user, agentId } = useAuth()
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payslip, setPayslip] = useState<any | null>(null)
  const [payslipLoading, setPayslipLoading] = useState(false)
  const [workStats, setWorkStats] = useState<any | null>(null)
  const [workStatsLoading, setWorkStatsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (!agentId) { setLoading(false); return }
      try {
        const data = await getPayrolls({ agentId })
        const myLines = data.flatMap((p: any) => p.lines?.filter((l: any) => l.agentId === agentId) ?? [])
        setPayrolls(myLines.length > 0 ? myLines : data)
      } catch (e) {
        console.error('Paie error', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [agentId])

  useEffect(() => {
    ;(async () => {
      if (!agentId) { setWorkStatsLoading(false); return }
      try {
        const data = await getWorkStats(agentId)
        setWorkStats(data)
      } catch (e) {
        console.error('WorkStats error', e)
      } finally {
        setWorkStatsLoading(false)
      }
    })()
  }, [agentId])

  const viewPayslip = async (lineId: string) => {
    setPayslipLoading(true)
    try {
      const data = await getPayslip(lineId)
      setPayslip(data)
    } catch {
      Alert.alert('Erreur', 'Impossible de charger la fiche de paie')
    } finally {
      setPayslipLoading(false)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Number(n))

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        className="pt-16 pb-12 px-6 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-widest">Ma rémunération</Text>
            <Text className="text-white font-black text-3xl mt-1">Paie & Fiches</Text>
          </View>
          <View className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5">
            <DollarSign size={24} color="#f5b800" />
          </View>
        </View>
      </LinearGradient>

      {/* ── Work Tracking Card ── */}
      <View className="px-6 -mt-8 mb-6">
        {workStatsLoading ? (
          <View className="bg-white rounded-[28px] p-8 items-center shadow-xl shadow-slate-200 border border-slate-100">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-3">Chargement...</Text>
          </View>
        ) : workStats ? (
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            className="rounded-[28px] p-6 shadow-xl shadow-slate-900/20"
          >
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-2">
                <View className="w-9 h-9 bg-sagard-yellow/20 rounded-xl items-center justify-center">
                  <Zap size={18} color="#f5b800" />
                </View>
                <View>
                  <Text className="text-white font-black text-base">Suivi temps réel</Text>
                  <Text className="text-slate-400 text-xs">{workStats.shift} · {workStats.hoursPerDay}h/jour</Text>
                </View>
              </View>
              <View className="bg-white/10 rounded-lg px-3 py-1">
                <Text className="text-sagard-yellow font-bold text-xs">{String(workStats.month).padStart(2, '0')}/{workStats.year}</Text>
              </View>
            </View>

            {/* Main stats grid */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Clock size={12} color="#94a3b8" />
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Heures</Text>
                </View>
                <Text className="text-white font-black text-xl">{fmtHours(workStats.hoursWorked)}</Text>
                <Text className="text-slate-500 text-[10px] mt-0.5">Objectif: {fmtHours(workStats.expectedHours)}</Text>
              </View>
              <View className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Calendar size={12} color="#94a3b8" />
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Jours</Text>
                </View>
                <Text className="text-white font-black text-xl">{workStats.daysWorked}<Text className="text-slate-500 text-sm font-normal">/{workStats.expectedDays}</Text></Text>
                <Text className="text-slate-500 text-[10px] mt-0.5">Sur {workStats.daysInMonth}j</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-slate-400 text-xs font-medium">Taux de présence</Text>
                <Text className={`font-black text-sm ${workStats.attendanceRate >= 80 ? 'text-green-400' : workStats.attendanceRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{workStats.attendanceRate}%</Text>
              </View>
              <View className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${workStats.attendanceRate >= 80 ? 'bg-green-500' : workStats.attendanceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(workStats.attendanceRate, 100)}%` }}
                />
              </View>
            </View>

            {/* Earnings + extra */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-sagard-yellow/10 rounded-2xl p-4 border border-sagard-yellow/20">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <DollarSign size={12} color="#f5b800" />
                  <Text className="text-sagard-yellow text-[10px] font-bold uppercase tracking-wider">Gains estimés</Text>
                </View>
                <Text className="text-sagard-yellow font-black text-2xl">{fmt(workStats.estimatedEarnings)}<Text className="text-sm font-normal"> F</Text></Text>
                <Text className="text-sagard-yellow/50 text-[10px] mt-0.5">{workStats.daysWorked} vacations × 2500 F</Text>
              </View>
              <View className="bg-white/5 rounded-2xl p-4 border border-white/5 justify-center">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <TrendingUp size={12} color="#94a3b8" />
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Heures supp.</Text>
                </View>
                <Text className="text-emerald-400 font-black text-base">{fmtHours(workStats.overtimeHours)}</Text>
                {workStats.lateCount > 0 && (
                  <Text className="text-amber-400 text-[10px] mt-1">{workStats.lateCount} retard(s) · {workStats.totalLateMinutes}min</Text>
                )}
              </View>
            </View>
          </LinearGradient>
        ) : null}
      </View>

      {/* ── Payroll list ── */}
      <View className="px-6 mb-10">
        {loading ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200">
            <ActivityIndicator color="#f5b800" />
            <Text className="text-slate-400 font-medium mt-4">Chargement des fiches...</Text>
          </View>
        ) : payrolls.length === 0 ? (
          <View className="bg-white rounded-[32px] p-12 items-center shadow-xl shadow-slate-200 border border-slate-100">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <Receipt size={40} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-lg text-center">Aucune fiche de paie</Text>
            <Text className="text-slate-400 mt-2 text-center leading-5">
              Vos fiches de paie apparaîtront ici une fois générées par l'administration.
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {payrolls.map((p: any) => {
              const myLine = (p.lines ?? []).find((l: any) => l.agentId === agentId)
              if (!myLine) return null
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => viewPayslip(myLine.id)}
                  activeOpacity={0.9}
                  className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex-row items-center"
                >
                  <View className="w-14 h-14 bg-sagard-yellow/10 rounded-2xl items-center justify-center">
                    <FileText size={24} color="#d99e00" />
                  </View>
                  
                  <View className="flex-1 ml-4">
                    <Text className="text-slate-900 font-black text-lg">
                      {String(p.month).padStart(2, '0')}/{p.year}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <View className={`w-2 h-2 rounded-full ${
                        myLine.paymentStatus === 'PAYE' ? 'bg-green-500' : myLine.paymentStatus === 'VALIDE' ? 'bg-blue-500' : 'bg-slate-300'
                      }`} />
                      <Text className="text-slate-400 text-xs font-bold uppercase tracking-tighter">
                        {myLine.paymentStatus === 'PAYE' ? 'Payé' : myLine.paymentStatus === 'VALIDE' ? 'Validé' : 'Brouillon'}
                        {myLine.blocked ? ' · Bloqué' : ''}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end mr-3">
                    <Text className={`font-black text-lg ${myLine.blocked ? 'text-red-400 line-through' : 'text-slate-900'}`}>
                      {fmt(myLine.netSalary)} F
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Net à payer</Text>
                  </View>

                  <View className="w-8 h-8 bg-slate-50 rounded-full items-center justify-center">
                    <ChevronRight size={16} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>

      {/* Payslip modal with refined design */}
      <Modal visible={!!payslip} animationType="slide" transparent>
        <View className="flex-1 bg-sagard-dark/95 justify-end">
          <View className="bg-white rounded-t-[40px] h-[85%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <View>
                <Text className="font-black text-slate-900 text-2xl">Détail Paie</Text>
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Bulletin de salaire</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setPayslip(null)}
                className="w-12 h-12 bg-slate-100 rounded-full items-center justify-center"
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-8 py-8" showsVerticalScrollIndicator={false}>
              {payslipLoading ? (
                <View className="py-20 items-center">
                  <ActivityIndicator color="#f5b800" size="large" />
                </View>
              ) : payslip ? (
                <View className="space-y-8 pb-10">
                  {/* Header info card */}
                  <LinearGradient
                    colors={['#f8fafc', '#f1f5f9']}
                    className="rounded-3xl p-6 border border-slate-100"
                  >
                    <View className="flex-row items-center gap-4 mb-4">
                      <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-sm">
                        <Briefcase size={24} color="#f5b800" />
                      </View>
                      <View>
                        <Text className="font-black text-slate-900 text-lg">
                          {payslip.agent?.user?.firstName} {payslip.agent?.user?.lastName}
                        </Text>
                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-tighter">
                          Matricule: {payslip.agent?.matricule}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="h-px bg-slate-200/50 mb-4" />
                    
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <Calendar size={14} color="#64748b" />
                        <Text className="text-slate-600 font-bold text-xs">
                          {String(payslip.payroll?.month).padStart(2, '0')}/{payslip.payroll?.year}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Clock size={14} color="#64748b" />
                        <Text className="text-slate-600 font-bold text-xs">
                          {payslip.daysWorked}j · {fmtHours(payslip.hoursWorked)}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Calculations */}
                  <View className="space-y-5">
                    <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] ml-1">Décompte Salaire</Text>
                    
                    <View className="bg-white space-y-4">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-slate-500 font-bold">Salaire de base</Text>
                        <Text className="font-black text-slate-900">{fmt(payslip.baseSalary)} F</Text>
                      </View>
                      
                      {Number(payslip.bonuses) > 0 && (
                        <View className="flex-row justify-between items-center">
                          <Text className="text-emerald-600 font-bold">Primes & Gratifications</Text>
                          <Text className="font-black text-emerald-600">+{fmt(payslip.bonuses)} F</Text>
                        </View>
                      )}

                      <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <Text className="font-black text-slate-700">Total Brut</Text>
                        <Text className="font-black text-slate-900 text-lg">{fmt(payslip.grossSalary)} F</Text>
                      </View>

                      {Number(payslip.deductions) > 0 && (
                        <View className="flex-row justify-between items-center">
                          <Text className="text-red-500 font-bold">Retenues & Avances</Text>
                          <Text className="font-black text-red-500">-{fmt(payslip.deductions)} F</Text>
                        </View>
                      )}

                      {payslip.blocked && (
                        <View className="bg-red-50 rounded-2xl p-5 border border-red-100 flex-row items-start gap-3">
                          <AlertCircle size={20} color="#ef4444" />
                          <View className="flex-1">
                            <Text className="text-red-700 font-black text-sm uppercase tracking-tighter">Paiement Bloqué</Text>
                            <Text className="text-red-500 text-xs mt-1 leading-4 font-medium">
                              Raison : {payslip.blockReason}
                            </Text>
                          </View>
                        </View>
                      )}

                      <LinearGradient
                        colors={['#0f172a', '#1e293b']}
                        className="rounded-[28px] p-8 mt-4 shadow-xl shadow-slate-900/20"
                      >
                        <View className="flex-row justify-between items-center">
                          <View>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">Net à Percevoir</Text>
                            <Text className="text-white font-black text-3xl">{fmt(payslip.netSalary)} F</Text>
                          </View>
                          <View className="w-12 h-12 bg-sagard-yellow rounded-2xl items-center justify-center">
                            <Receipt size={24} color="#0f172a" />
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
