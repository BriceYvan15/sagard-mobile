import { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native'
import { ChevronLeft, ChevronRight, Check, X, Calendar } from 'lucide-react-native'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface Props {
  value: Date
  onChange: (date: Date) => void
  minimumDate?: Date
  label?: string
}

export default function DatePickerInput({ value, onChange, minimumDate, label }: Props) {
  const [show, setShow] = useState(false)
  const [tempDate, setTempDate] = useState(value)
  const [viewYear, setViewYear] = useState(value.getFullYear())
  const [viewMonth, setViewMonth] = useState(value.getMonth())

  useEffect(() => {
    if (show) {
      setTempDate(value)
      setViewYear(value.getFullYear())
      setViewMonth(value.getMonth())
    }
  }, [show])

  const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const isDisabled = (day: number) => {
    if (!minimumDate) return false
    const d = new Date(viewYear, viewMonth, day)
    return d < new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate())
  }

  const getDaysInMonth = () => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    let firstWeekday = firstDay.getDay() - 1
    if (firstWeekday < 0) firstWeekday = 6

    const days: (number | null)[] = []
    for (let i = 0; i < firstWeekday; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const selectDay = (day: number) => {
    if (isDisabled(day)) return
    setTempDate(new Date(viewYear, viewMonth, day))
  }

  const confirm = () => {
    onChange(tempDate)
    setShow(false)
  }

  return (
    <>
      <Text className="text-slate-400 text-xs font-bold uppercase mb-2">{label}</Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className="bg-slate-50 rounded-2xl px-4 py-4 mb-4 border border-slate-100 flex-row items-center justify-between"
      >
        <Text className="text-slate-900 font-medium">{formatDate(value)}</Text>
        <Calendar size={18} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={show} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] overflow-hidden">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-slate-100">
              <Text className="font-black text-slate-900 text-lg">Sélectionner une date</Text>
              <TouchableOpacity
                onPress={() => setShow(false)}
                className="w-9 h-9 bg-slate-100 rounded-full items-center justify-center"
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Month navigation */}
            <View className="flex-row items-center justify-between px-6 py-4">
              <TouchableOpacity onPress={prevMonth} className="w-10 h-10 items-center justify-center">
                <ChevronLeft size={22} color="#0f172a" />
              </TouchableOpacity>
              <Text className="font-bold text-slate-900 text-base">
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} className="w-10 h-10 items-center justify-center">
                <ChevronRight size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View className="flex-row px-4 pb-2">
              {WEEKDAYS.map(d => (
                <View key={d} className="flex-1 items-center">
                  <Text className="text-slate-400 text-xs font-bold">{d}</Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View className="flex-row flex-wrap px-4 pb-4">
              {getDaysInMonth().map((day, i) => {
                if (day === null) return <View key={i} className="w-[14.28%] h-12" />
                const selected = isSameDay(tempDate, new Date(viewYear, viewMonth, day))
                const disabled = isDisabled(day)
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => selectDay(day)}
                    disabled={disabled}
                    className="w-[14.28%] h-12 items-center justify-center"
                  >
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center ${
                        selected ? 'bg-sagard-yellow' : disabled ? 'bg-transparent' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          selected
                            ? 'text-sagard-dark'
                            : disabled
                            ? 'text-slate-200'
                            : 'text-slate-700'
                        }`}
                      >
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Confirm button */}
            <View className="px-6 pb-8 pt-2 border-t border-slate-50">
              <TouchableOpacity
                onPress={confirm}
                className="bg-sagard-yellow rounded-2xl py-4 flex-row items-center justify-center"
              >
                <Check size={18} color="#0f172a" />
                <Text className="text-sagard-dark font-black ml-2">Confirmer — {formatDate(tempDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}
