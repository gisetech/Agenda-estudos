import React, { useState } from 'react';
import { Course, Session, StudyTask } from '../types';
import { ChevronLeft, ChevronRight, Clock, Plus, MapPin, ExternalLink, CalendarX, CheckCircle, RefreshCw, Calendar, CheckSquare, Trash2, Edit, Square } from 'lucide-react';
import { formatDateBr, getMonthNameBr } from '../utils';

interface CalendarViewProps {
  courses: Course[];
  sessions: Session[];
  tasks: StudyTask[];
  onCancelSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onModifySessionDate: (session: Session, newDate: string, newTime?: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSession: (session: Session) => void;
  onAddTask: (task: StudyTask) => void;
  onUpdateTask: (task: StudyTask) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function CalendarView({
  courses,
  sessions,
  tasks,
  onCancelSession,
  onCompleteSession,
  onModifySessionDate,
  onDeleteSession,
  onUpdateSession,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: CalendarViewProps) {
  
  // Set current calendar month/year focused on May 2026 (matching dynamic context)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Month index 4 is May
  const [selectedDayStr, setSelectedDayStr] = useState('2026-05-22'); // Selected May 22 (Friday) by default
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);

  // Deletion state to avoid confirm dialog blocks in sandboxed iframes
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper arrays
  const weekdaysBr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Calculate days of current month to render
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday ...
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); // number of days in this month

  // We want to fill previous month buffer days to render a neat grid
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      monthOffset: -1
    });
  }

  // Current month days
  const currentMonthDays = [];
  for (let i = 1; i <= lastDayOfMonth; i++) {
    currentMonthDays.push({
      day: i,
      isCurrentMonth: true,
      monthOffset: 0
    });
  }

  // Next month buffer days to fill a grid of 6 rows (42 cells total)
  const totalCellsUsed = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDays = [];
  const remainingCells = 42 - totalCellsUsed;
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push({
      day: i,
      isCurrentMonth: false,
      monthOffset: 1
    });
  }

  const allGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build the ISO date string "YYYY-MM-DD" for a clicked grid cell
  const getCellDateStr = (dayInfo: { day: number; isCurrentMonth: boolean; monthOffset: number }) => {
    let cellYear = year;
    let cellMonth = month + dayInfo.monthOffset;
    if (cellMonth < 0) {
      cellMonth = 11;
      cellYear -= 1;
    } else if (cellMonth > 11) {
      cellMonth = 0;
      cellYear += 1;
    }
    const yyyy = cellYear;
    const mm = String(cellMonth + 1).padStart(2, '0');
    const dd = String(dayInfo.day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Get course associated details
  const getCourse = (courseId: string) => courses.find(c => c.id === courseId);

  // Group items by date for the calendar
  const getItemsForDate = (dateStr: string) => {
    const daySessions = sessions.filter(s => s.date === dateStr);
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    return { sessions: daySessions, tasks: dayTasks };
  };

  // Get elements of the selected day
  const selectedDayItems = getItemsForDate(selectedDayStr);

  // Handle adding task on selected day Form state
  const [showQuickTaskForm, setShowQuickTaskForm] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDesc, setQuickTaskDesc] = useState('');
  const [quickTaskCourseId, setQuickTaskCourseId] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState('17:00');

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    onAddTask({
      id: `task-${Date.now()}`,
      courseId: quickTaskCourseId || undefined,
      title: quickTaskTitle,
      description: quickTaskDesc,
      dueDate: selectedDayStr,
      dueTime: quickTaskTime || undefined,
      status: 'pending'
    });

    setQuickTaskTitle('');
    setQuickTaskDesc('');
    setQuickTaskCourseId('');
    setShowQuickTaskForm(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Calendar Grid card - 7 cols on large desktop */}
      <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-6">
        
        {/* Header - Month and Year pagination */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {getMonthNameBr(month)} <span className="text-slate-400 font-normal">{year}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Selecione uma data para gerenciar as aulas e entregas.</p>
          </div>
          
          <div className="flex items-center gap-1 border border-slate-205 p-1 bg-slate-50 rounded-lg">
            <button 
              onClick={prevMonth} 
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(2026, 4, 1))} 
              className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-md transition-all cursor-pointer"
            >
              Hoje
            </button>
            <button 
              onClick={nextMonth} 
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="space-y-1">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center py-1.5 border-b border-slate-100">
            {weekdaysBr.map(day => (
              <span key={day} className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div id="calendar-days-grid" className="grid grid-cols-7 gap-1">
            {allGridDays.map((cell, idx) => {
              const cellDateStr = getCellDateStr(cell);
              const { sessions: daySessions, tasks: dayTasks } = getItemsForDate(cellDateStr);
              
              const isSelected = cellDateStr === selectedDayStr;
              const isToday = cellDateStr === '2026-05-22';
              
              // Count counts
              const activeSessions = daySessions.filter(s => s.status !== 'canceled');
              const canceledCount = daySessions.filter(s => s.status === 'canceled').length;
              const pendingTasksCount = dayTasks.filter(t => t.status === 'pending').length;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayStr(cellDateStr)}
                  className={`min-h-15 p-1.5 rounded-lg border transition-all text-left flex flex-col justify-between align-baseline cursor-pointer hover:border-slate-300 relative ${
                    isSelected 
                      ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/50' 
                      : cell.isCurrentMonth
                      ? 'bg-white border-slate-100 text-slate-700'
                      : 'bg-slate-50/30 border-transparent text-slate-400'
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                      isToday 
                        ? 'bg-slate-900 text-white shadow-3xs' 
                        : isSelected
                        ? 'text-slate-900 font-extrabold'
                        : 'text-slate-700'
                    }`}>
                      {cell.day}
                    </span>
                    
                    {/* Tiny stats or warnings */}
                    {pendingTasksCount > 0 && (
                      <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" title={`${pendingTasksCount} tarefa(s)`}></span>
                    )}
                  </div>

                  {/* Indicators / Dot or Mini representation */}
                  <div className="w-full space-y-1 mt-1 overflow-hidden">
                    {/* Show colored lines representing courses of the sessions */}
                    {activeSessions.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {activeSessions.slice(0, 3).map(s => {
                          const course = getCourse(s.courseId);
                          return (
                            <span 
                              key={s.id} 
                              className="w-full h-1 rounded-full inline-block" 
                              style={{ backgroundColor: course?.color || '#000000' }}
                              title={`${s.startTime}: ${s.title}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-slate-50 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-md"></span>
            <span>Hoje (22/05/2026)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 bg-sky-500 rounded-md"></span>
            <span>Aulas de Automação (SENAI)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 bg-violet-500 rounded-md"></span>
            <span>Aulas de React Avançado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            <span>Tarefas a Entregar</span>
          </div>
        </div>

      </div>

      {/* Date Details side card - 5 cols on large desktop */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Date Details Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-205 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">Compromissos do Dia</span>
            <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-900 shrink-0" />
              {formatDateBr(selectedDayStr)}
            </h3>
          </div>

          {/* Classes detailed list */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Aulas & Eventos ({selectedDayItems.sessions.length})</h4>
            
            {selectedDayItems.sessions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sem aulas ou compromissos programados.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayItems.sessions.map(session => {
                  const course = getCourse(session.courseId);
                  const isCanceled = session.status === 'canceled';
                  const isCompleted = session.status === 'completed';

                  return (
                    <div 
                      key={session.id} 
                      className={`p-3.5 rounded-lg border text-xs space-y-2 relative overflow-hidden ${
                        isCanceled 
                          ? 'bg-slate-50/50 border-slate-200 line-through text-slate-400' 
                          : isCompleted 
                          ? 'bg-slate-50 border-slate-150 text-slate-400'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase font-mono"
                            style={{ 
                              backgroundColor: `${course?.color}12`, 
                              color: course?.color 
                            }}
                          >
                            {course?.title || 'Curso'}
                          </span>
                          <h5 className={`font-bold mt-1 text-xs ${isCanceled ? 'text-slate-400' : 'text-slate-800'}`}>
                            {session.title}
                          </h5>
                          <span className="text-slate-500 font-medium mt-1 inline-flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="w-3 h-3 shrink-0" /> {session.startTime} - {session.endTime}
                          </span>
                        </div>

                        {/* Status tag */}
                        <div>
                          {isCanceled && (
                            <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md font-mono tracking-wider uppercase">Cancelada</span>
                          )}
                          {isCompleted && (
                            <span className="text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md font-mono tracking-wider uppercase">Concluída</span>
                          )}
                        </div>
                      </div>

                      {/* Display Location/Link */}
                      {(session.location || session.accessLink) && !isCanceled && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-3 text-[11px] text-slate-600">
                          {session.location && (
                            <span className="flex items-center gap-1 font-mono">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {session.location}
                            </span>
                          )}
                          {session.accessLink && (
                            <a 
                              href={session.accessLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-slate-800 font-semibold hover:underline inline-flex items-center gap-0.5"
                            >
                              Link de Acesso <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Interactive scheduling and full CRUD action menu */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px] font-mono">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingSession(session)}
                            className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 text-slate-500 rounded font-bold transition cursor-pointer"
                            title="Editar detalhes desta aula"
                          >
                            EDITAR
                          </button>
                          {sessionToDelete === session.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded shadow-xs">
                              <span className="text-[9px] font-black uppercase text-rose-700 animate-pulse">Apagar?</span>
                              <button
                                onClick={() => {
                                  onDeleteSession(session.id);
                                  setSessionToDelete(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8px] font-bold cursor-pointer font-sans text-center leading-none"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setSessionToDelete(null)}
                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[8px] font-bold cursor-pointer font-sans text-center leading-none"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSessionToDelete(session.id)}
                              className="px-2 py-0.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 rounded font-bold transition cursor-pointer"
                              title="Excluir do cronograma"
                            >
                              EXCLUIR
                            </button>
                          )}
                        </div>

                        {!isCanceled && !isCompleted && (
                          <div className="flex items-center justify-end gap-1 font-mono text-[9px]">
                            <button
                              onClick={() => {
                                const newDate = prompt(`Mudar DATA de "${session.title}" para qual dia? (Formato: AAAA-MM-DD)`, session.date);
                                if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
                                  onModifySessionDate(session, newDate);
                                } else if (newDate) {
                                  alert('Data inválida. Use AAAA-MM-DD.');
                                }
                              }}
                              className="px-1.5 py-0.5 bg-slate-55 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded font-medium transition cursor-pointer"
                            >
                              ALTERAR DIA
                            </button>
                            
                            <button
                              onClick={() => onCompleteSession(session.id)}
                              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium transition inline-flex items-center gap-0.5 cursor-pointer"
                              title="Marcar como Concluída"
                            >
                              ✓ CONCLUIR
                            </button>

                            <button
                              onClick={() => onCancelSession(session.id)}
                              className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-rose-650 border border-slate-200 rounded font-medium transition cursor-pointer"
                              title="Marcar aula como Cancelada"
                            >
                              CANCELAR
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-slate-200/50" />

          {/* Day Tasks List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Tarefas do Dia ({selectedDayItems.tasks.length})</h4>
              <button
                onClick={() => setShowQuickTaskForm(!showQuickTaskForm)}
                className="text-[10px] font-mono font-bold text-slate-800 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> INCLUIR TAREFA
              </button>
            </div>

            {showQuickTaskForm && (
              <form onSubmit={handleCreateQuickTask} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1 font-mono">Título da Entrega *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Entregar relatório de eletrônica..."
                    className="w-full px-2.5 py-1.5 bg-white rounded border border-slate-205 text-xs focus:outline-hidden text-slate-800"
                    value={quickTaskTitle}
                    onChange={e => setQuickTaskTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1 font-mono">Descrição</label>
                  <textarea
                    placeholder="Ex: Enviar pelo e-mail ou portal..."
                    className="w-full px-2.5 py-1.5 bg-white rounded border border-slate-205 text-xs focus:outline-hidden text-slate-800 resize-none"
                    rows={1.5}
                    value={quickTaskDesc}
                    onChange={e => setQuickTaskDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1 font-mono">Hora Limite</label>
                    <input
                      type="time"
                      className="w-full px-2.5 py-1.5 bg-white rounded border border-slate-205 text-xs focus:outline-hidden text-slate-800"
                      value={quickTaskTime}
                      onChange={e => setQuickTaskTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1 font-mono">Curso Vinculado</label>
                    <select
                      className="w-full px-2.5 py-1.5 bg-white rounded border border-slate-205 text-xs focus:outline-hidden text-slate-800"
                      value={quickTaskCourseId}
                      onChange={e => setQuickTaskCourseId(e.target.value)}
                    >
                      <option value="">Nenhum (Geral)</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title.split(' ')[0]}...</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickTaskForm(false)}
                    className="px-2.5 py-1 text-[10px] font-bold text-slate-500 rounded hover:bg-slate-100 border border-transparent cursor-pointer font-mono"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-[11px] font-mono font-bold text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
                  >
                    SALVAR
                  </button>
                </div>
              </form>
            )}

            {selectedDayItems.tasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma entrega agendada para hoje.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayItems.tasks.map(task => {
                  const course = task.courseId ? getCourse(task.courseId) : null;
                  const isCompleted = task.status === 'completed';

                  return (
                    <div 
                      key={task.id}
                      className={`p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs group relative ${
                        isCompleted ? 'bg-slate-100/50 border-slate-100 opacity-60' : ''
                      }`}
                    >
                      <div 
                        className="w-0.5 h-8 bg-slate-350 shrink-0" 
                        style={{ backgroundColor: course?.color || '#cbd5e1' }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <h5 className={`font-bold truncate text-slate-700 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                              {task.title}
                            </h5>
                          </div>

                          {/* Task CRUD Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <button
                              onClick={() => setEditingTask(task)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 hover:bg-slate-200 rounded cursor-pointer"
                              title="Editar Atividade"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            {taskToDelete === task.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded shadow-xs">
                                <span className="text-[8px] font-black uppercase text-rose-700 animate-pulse">Apagar?</span>
                                <button
                                  onClick={() => {
                                    onDeleteTask(task.id);
                                    setTaskToDelete(null);
                                  }}
                                  className="px-1 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8px] font-bold cursor-pointer font-sans leading-none"
                                >
                                  Sim
                                </button>
                                <button
                                  onClick={() => setTaskToDelete(null)}
                                  className="px-1 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[8px] font-bold cursor-pointer font-sans leading-none"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setTaskToDelete(task.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 hover:bg-rose-50 rounded cursor-pointer"
                                title="Deletar Atividade"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{task.description}</p>
                        {task.dueTime && (
                          <span className="text-[10px] font-mono font-semibold text-slate-400">Entrega até as {task.dueTime}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Edit Session Modal */}
      {editingSession && (
        <div id="edit-session-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div id="edit-session-modal-container" className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-xs">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-slate-500">Editar Aula / Evento</h3>
              <button onClick={() => setEditingSession(null)} className="text-slate-400 hover:text-slate-650 font-bold p-1 hover:bg-slate-100 rounded-lg">✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateSession(editingSession);
              setEditingSession(null);
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Título do Evento / Aula *</label>
                <input type="text" required value={editingSession.title} onChange={e => setEditingSession({ ...editingSession, title: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden text-slate-800" />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Disciplina / Curso</label>
                <select value={editingSession.courseId} onChange={e => setEditingSession({ ...editingSession, courseId: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-white text-slate-800">
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                  <option value="geral">Instruções Complementares (Geral)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Data *</label>
                  <input type="date" required value={editingSession.date} onChange={e => setEditingSession({ ...editingSession, date: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden font-mono text-slate-800" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Status</label>
                  <select value={editingSession.status} onChange={e => setEditingSession({ ...editingSession, status: e.target.value as any })} className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-white text-slate-800">
                    <option value="scheduled">Agendada</option>
                    <option value="completed">Concluída</option>
                    <option value="canceled">Cancelada</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hora Início *</label>
                  <input type="time" required value={editingSession.startTime} onChange={e => setEditingSession({ ...editingSession, startTime: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-800" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hora Término *</label>
                  <input type="time" required value={editingSession.endTime} onChange={e => setEditingSession({ ...editingSession, endTime: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-800" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Local (Opcional)</label>
                <input type="text" value={editingSession.location || ''} onChange={e => setEditingSession({ ...editingSession, location: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-800" />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Link de Acesso (Opcional)</label>
                <input type="url" value={editingSession.accessLink || ''} onChange={e => setEditingSession({ ...editingSession, accessLink: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-800" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingSession(null)} className="px-3.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded-md font-mono font-bold">CANCELAR</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div id="calendar-edit-task-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-slate-800">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-xs">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-slate-500">Editar Atividade / Tarefa</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1.5 rounded-lg">✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateTask(editingTask);
              setEditingTask(null);
            }} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Título da Atividade *</label>
                <input type="text" required value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-800" />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Descrição</label>
                <textarea rows={3} value={editingTask.description || ''} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg resize-none text-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Data Limite *</label>
                  <input type="date" required value={editingTask.dueDate} onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-800" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hora Limite</label>
                  <input type="time" value={editingTask.dueTime || ''} onChange={e => setEditingTask({ ...editingTask, dueTime: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-800" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Curso Associado</label>
                <select value={editingTask.courseId || ''} onChange={e => setEditingTask({ ...editingTask, courseId: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-white text-slate-800">
                  <option value="">Nenhum (Geral)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingTask(null)} className="px-3.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded-md font-mono font-bold">CANCELAR</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
