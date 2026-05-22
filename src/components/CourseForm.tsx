import React, { useState } from 'react';
import { Course, Session } from '../types';
import { Plus, Notebook, Link, MapPin, CalendarDays, BookOpen, Clock, AlertTriangle, Check } from 'lucide-react';

interface CourseFormProps {
  onAddCourse: (course: Course, sessions: Session[]) => void;
  existingCourses: Course[];
  onClose: () => void;
}

const PALETTE = [
  { name: 'Azul Celeste', value: '#0284c7', bg: 'bg-sky-500' },
  { name: 'Esmeralda', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Roxo Violeta', value: '#8b5cf6', bg: 'bg-violet-500' },
  { name: 'Rosa Coral', value: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Âmbar Quente', value: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Cinza Ardósia', value: '#64748b', bg: 'bg-slate-500' }
];

export default function CourseForm({ onAddCourse, onClose }: CourseFormProps) {
  // Course details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalHours, setTotalHours] = useState('40');
  const [color, setColor] = useState('#0284c7');
  const [accessLink, setAccessLink] = useState('');
  const [location, setLocation] = useState('');

  // Recurrence details
  const [scheduleType, setScheduleType] = useState<'mon-fri' | 'custom-weekdays' | 'single'>('mon-fri');
  const [startDate, setStartDate] = useState(() => {
    // Default to current date or standard date
    return '2026-05-22';
  });
  const [weeksCount, setWeeksCount] = useState('2');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('17:00');
  
  // Custom weekdays (for 'custom-weekdays' option)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // 1=Mon, 5=Fri

  const toggleWeekday = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, day].sort());
    }
  };

  const calculateSessionDuration = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    if (isNaN(startH) || isNaN(endH)) return 4; // default
    const durationMin = (endH * 60 + endM) - (startH * 60 + startM);
    return Math.max(0, durationMin / 60);
  };

  const previewSessionsCount = () => {
    if (scheduleType === 'single') return 1;
    
    let count = 0;
    const start = new Date(startDate + 'T00:00:00');
    const weeks = parseInt(weeksCount) || 1;
    
    // Simulate day by day
    for (let i = 0; i < weeks * 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
      
      if (scheduleType === 'mon-fri') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          count++;
        }
      } else if (scheduleType === 'custom-weekdays') {
        // Adjust standard weekday representation to match input (0-6 where 1=Mon, 0=Sun/7 depending on preferences)
        // Let's use 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
        if (selectedWeekdays.includes(dayOfWeek)) {
          count++;
        }
      }
    }
    return count;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const courseId = `course-${Date.now()}`;
    const hoursPerDay = calculateSessionDuration();
    const generatedSessions: Session[] = [];

    if (scheduleType === 'single') {
      generatedSessions.push({
        id: `sess-${courseId}-0`,
        courseId,
        title: `Aula Única: ${title}`,
        date: startDate,
        startTime,
        endTime,
        accessLink: accessLink || undefined,
        location: location || undefined,
        status: 'scheduled'
      });
    } else {
      const start = new Date(startDate + 'T00:00:00');
      const weeks = parseInt(weeksCount) || 1;
      let sessionIndex = 1;

      for (let i = 0; i < weeks * 7; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        const dayOfWeek = current.getDay();

        let matches = false;
        if (scheduleType === 'mon-fri') {
          matches = dayOfWeek >= 1 && dayOfWeek <= 5;
        } else if (scheduleType === 'custom-weekdays') {
          // selectedWeekdays contains 0-6 values
          matches = selectedWeekdays.includes(dayOfWeek);
        }

        if (matches) {
          // Format current date to YYYY-MM-DD
          const yyyy = current.getFullYear();
          const mm = String(current.getMonth() + 1).padStart(2, '0');
          const dd = String(current.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          generatedSessions.push({
            id: `sess-${courseId}-${sessionIndex}`,
            courseId,
            title: `Aula ${String(sessionIndex).padStart(2, '0')}: ${title}`,
            date: dateStr,
            startTime,
            endTime,
            accessLink: accessLink || undefined,
            location: location || undefined,
            status: 'scheduled'
          });
          sessionIndex++;
        }
      }
    }

    const calculatedTotalHours = generatedSessions.length * hoursPerDay;

    const newCourse: Course = {
      id: courseId,
      title,
      description,
      totalHours: totalHours ? parseFloat(totalHours) : calculatedTotalHours,
      color,
      accessLink: accessLink || undefined,
      location: location || undefined
    };

    onAddCourse(newCourse, generatedSessions);
    onClose();
  };

  const sessionsCount = previewSessionsCount();
  const calculatedHrs = sessionsCount * calculateSessionDuration();

  return (
    <div id="course-form-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div id="course-form-container" className="relative w-full max-w-2xl my-8 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-slate-800">Cadastrar Novo Curso ou Evento</h3>
              <p className="text-xs text-slate-500">Insira as datas, horários e configure a geração de cronograma automático.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Course Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">1. Dados Básicos</h4>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Curso / Evento *</label>
              <input
                type="text"
                required
                placeholder="Ex: Curso de Eletricidade Industrial (SENAI), Workshop de Design..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Notas rápidas</label>
              <textarea
                placeholder="Ex: Tópicos que serão abordados, requisitos mínimos, avaliações..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carga Horária Estimada (Horas)</label>
                <input
                  type="number"
                  placeholder="Ex: 40"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                  value={totalHours}
                  onChange={e => setTotalHours(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link de Acesso (Online)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Link className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    placeholder="https://suaclasse.com/login"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                    value={accessLink}
                    onChange={e => setAccessLink(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Local Físico / Sala</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: Prédio A, Sala 302"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cor do Tema</label>
                <div className="flex gap-2">
                  {PALETTE.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setColor(item.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        color === item.value ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                      } ${item.bg}`}
                      title={item.name}
                    >
                      {color === item.value && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Recurrence Schedule Generator */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">2. Agendamento e Cronograma Automático</h4>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setScheduleType('mon-fri');
                  setSelectedWeekdays([1, 2, 3, 4, 5]);
                }}
                className={`p-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  scheduleType === 'mon-fri'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Segunda a Sexta (SENAI Style)
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('custom-weekdays')}
                className={`p-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  scheduleType === 'custom-weekdays'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Dias Específicos
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('single')}
                className={`p-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  scheduleType === 'single'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Evento Único (Individual)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {scheduleType === 'single' ? 'Data do Evento' : 'Data de Início'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <CalendarDays className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário de Início</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="time"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário de Término</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="time"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Sub-panels based on schedule type */}
            {scheduleType === 'custom-weekdays' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Selecione as aulas na semana:</label>
                <div className="flex flex-wrap gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, idx) => {
                    const isSelected = selectedWeekdays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleWeekday(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-3xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {scheduleType !== 'single' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duração do Cronograma (Semanas)</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm"
                    value={weeksCount}
                    onChange={e => setWeeksCount(e.target.value)}
                  />
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <span className="font-semibold block">Geração Automática do Calendário:</span>
                    Com base nos filtros, serão geradas <strong>{sessionsCount} aulas / sessões</strong> neste cronograma, totalizando cerca de <strong>{calculatedHrs.toFixed(1)} horas</strong> de estudo controlado.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar Curso & Cronograma
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
