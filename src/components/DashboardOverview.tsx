import React, { useState, useEffect } from 'react';
import { Course, Session, StudyTask } from '../types';
import { 
  BookOpen, Calendar, CheckSquare, Clock, ArrowRight, ExternalLink, Trash2, 
  Plus, FileText, CheckCircle2, MapPin, Link, Sparkles, Check, 
  CalendarDays, Trash, AlertTriangle, CalendarX, PlusCircle, Edit
} from 'lucide-react';
import { formatDateBr, formatDayOfWeek } from '../utils';

interface DashboardOverviewProps {
  courses: Course[];
  sessions: Session[];
  tasks: StudyTask[];
  onOpenCourseForm: () => void;
  onDeleteCourse: (courseId: string) => void;
  onUpdateCourse?: (updatedCourse: Course) => void;
  onCancelSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
  onModifySessionDate: (session: Session, newDate: string, newTime?: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onUpdateSession?: (updatedSession: Session) => void;
  onUpdateTask?: (updatedTask: StudyTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onSwitchTab: (tab: 'dashboard' | 'calendar' | 'tasks' | 'notes') => void;
  setSelectedCourseIdForNotes: (courseId: string) => void;
  onAddSession?: (newSession: Session) => void;
  onAddTask?: (newTask: StudyTask) => void;
}

export default function DashboardOverview({
  courses,
  sessions,
  tasks,
  onOpenCourseForm,
  onDeleteCourse,
  onUpdateCourse,
  onCancelSession,
  onCompleteSession,
  onModifySessionDate,
  onDeleteSession,
  onUpdateSession,
  onUpdateTask,
  onDeleteTask,
  onSwitchTab,
  setSelectedCourseIdForNotes,
  onAddSession,
  onAddTask
}: DashboardOverviewProps) {

  // Current Reference Date setup
  const todayStr = '2026-05-22'; // Consistent Friday, May 22, 2026

  // Week Selector Offset state (0 = current week, 1 = next week, -1 = previous week)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  
  // Editing individual item overlays
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);

  // Selected date defaults to today or first day of current week
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Deletion confirmation states to bypass standard window.confirm blocks in sandboxed frames
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Quick Form management states
  const [activeFormTab, setActiveFormTab] = useState<'evento' | 'tarefa'>('evento');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Event (Session/Aula) Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventCourseId, setEventCourseId] = useState('');
  const [eventDate, setEventDate] = useState(todayStr);
  const [eventStartTime, setEventStartTime] = useState('19:00');
  const [eventEndTime, setEventEndTime] = useState('22:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventAccessLink, setEventAccessLink] = useState('');

  // Task (Atividade) Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourseId, setTaskCourseId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(todayStr);
  const [taskDueTime, setTaskDueTime] = useState('22:00');
  const [taskDescription, setTaskDescription] = useState('');

  // Pre-populate first course as default when courses list changes
  useEffect(() => {
    if (courses.length > 0) {
      if (!eventCourseId) setEventCourseId(courses[0].id);
      if (!taskCourseId) setTaskCourseId(courses[0].id);
    }
  }, [courses]);

  // Compute dynamic weekdays list for the active offset week
  const getWeekDays = (offset: number) => {
    const baseDate = new Date('2026-05-22T12:00:00');
    baseDate.setDate(baseDate.getDate() + (offset * 7));
    
    // Get Monday of this week
    const startOfWeek = new Date(baseDate);
    const day = baseDate.getDay(); // 0 Sunday, 1 Monday...
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const list = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      list.push({
        dateStr,
        labelShort: current.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').substring(0, 3),
        labelFull: current.toLocaleDateString('pt-BR', { weekday: 'long' }),
        dayNum: current.getDate(),
        monthNum: current.getMonth() + 1,
        isToday: dateStr === todayStr
      });
    }
    return list;
  };

  const weekDays = getWeekDays(weekOffset);

  // Helper to select a day, updating both preview and quick form pre-fills!
  const selectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEventDate(dateStr);
    setTaskDueDate(dateStr);
  };

  // Switch dynamic week offset and auto-select its Monday as active view
  const adjustWeekOffset = (amt: number) => {
    const nextOffset = weekOffset + amt;
    setWeekOffset(nextOffset);
    const nextWeekDays = getWeekDays(nextOffset);
    selectDay(nextWeekDays[0].dateStr);
  };

  const resetToCurrentWeek = () => {
    setWeekOffset(0);
    selectDay(todayStr);
  };

  // Metrics state calculations
  const totalCourses = courses.length;
  let completedHours = 0;
  let totalHours = 0;
  
  sessions.forEach(s => {
    const startParts = s.startTime.split(':').map(Number);
    const endParts = s.endTime.split(':').map(Number);
    const sessionHrs = (endParts[0]*60 + endParts[1] - (startParts[0]*60 + startParts[1])) / 60;
    
    totalHours += sessionHrs;
    if (s.status === 'completed') {
      completedHours += sessionHrs;
    }
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const finishedTasks = tasks.filter(t => t.status === 'completed');

  // Course models lookup
  const getCourse = (courseId: string) => courses.find(c => c.id === courseId);

  // Filter Event & Tasks for active selected date
  const selectedDaySessions = sessions.filter(s => s.date === selectedDate);
  const selectedDayTasks = tasks.filter(t => t.dueDate === selectedDate);

  // Course stats helper
  const getCourseStats = (courseId: string) => {
    const courseSessions = sessions.filter(s => s.courseId === courseId);
    const completed = courseSessions.filter(s => s.status === 'completed');
    const canceled = courseSessions.filter(s => s.status === 'canceled');
    
    let studyHrs = 0;
    courseSessions.forEach(s => {
      if (s.status === 'completed') {
        const start = s.startTime.split(':').map(Number);
        const end = s.endTime.split(':').map(Number);
        studyHrs += (end[0]*60 + end[1] - (start[0]*60 + start[1])) / 60;
      }
    });

    return {
      total: courseSessions.length,
      completed: completed.length,
      canceled: canceled.length,
      hoursFinished: studyHrs
    };
  };

  // HANDLER: Create single custom session/event
  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      alert("Por favor, informe o título do seu evento acadêmico.");
      return;
    }

    if (onAddSession) {
      const newSessionSession: any = {
        id: 'sess-custom-' + Math.random().toString(36).substring(2, 9),
        courseId: eventCourseId || (courses[0]?.id || 'geral'),
        title: eventTitle,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        location: eventLocation.trim() || undefined,
        accessLink: eventAccessLink.trim() || undefined,
        status: 'scheduled'
      };
      
      onAddSession(newSessionSession);
      setFormSuccessMessage(`Compromisso "${eventTitle}" cadastrado com sucesso para ${formatDateBr(eventDate)}!`);
      setTimeout(() => setFormSuccessMessage(null), 3500);
      
      // Clear
      setEventTitle('');
      setEventLocation('');
      setEventAccessLink('');
    } else {
      alert("Ação não suportada no momento.");
    }
  };

  // HANDLER: Create single task
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      alert("Por favor, informe a descrição ou título da atividade.");
      return;
    }

    if (onAddTask) {
      const newTaskItem: any = {
        id: 'task-custom-' + Math.random().toString(36).substring(2, 9),
        courseId: taskCourseId || undefined,
        title: taskTitle,
        description: taskDescription.trim() || 'Estudo ou entrega programada.',
        dueDate: taskDueDate,
        dueTime: taskDueTime || undefined,
        status: 'pending'
      };

      onAddTask(newTaskItem);
      setFormSuccessMessage(`Atividade "${taskTitle}" registrada com sucesso para o dia ${formatDateBr(taskDueDate)}!`);
      setTimeout(() => setFormSuccessMessage(null), 3500);

      // Clear
      setTaskTitle('');
      setTaskDescription('');
    } else {
      alert("Ação não suportada no momento.");
    }
  };

  return (
    <div id="dashboard-overview-container" className="space-y-8 animate-fade-in">
      
      {/* Dynamic Key metrics ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div id="stat-card-courses" className="minimal-card p-4.5 flex items-center gap-4.5">
          <div className="p-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg">
            <BookOpen className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Cursos / Matérias</p>
            <h4 className="text-xl font-bold text-slate-800 leading-none mt-1">{totalCourses}</h4>
            <p className="text-[10px] text-slate-400 mt-1">Sincronizados em nuvem</p>
          </div>
        </div>

        <div id="stat-card-hours" className="minimal-card p-4.5 flex items-center gap-4.5">
          <div className="p-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Estudo Total</p>
            <h4 className="text-xl font-bold text-slate-800 leading-none mt-1">
              {completedHours.toFixed(0)}h <span className="text-xs font-normal text-slate-400">/ {totalHours.toFixed(0)}h</span>
            </h4>
            <div className="w-20 bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
              <div 
                className="bg-slate-850 h-1 rounded-full" 
                style={{ width: `${totalHours > 0 ? (completedHours / totalHours) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div id="stat-card-tasks" className="minimal-card p-4.5 flex items-center gap-4.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Minhas Entregas</p>
            <h4 className="text-xl font-bold text-slate-850 leading-none mt-1">{pendingTasks.length}</h4>
            <p className="text-[10px] text-slate-400 mt-1">{finishedTasks.length} já concluídas</p>
          </div>
        </div>

        <div id="stat-card-calendar" className="minimal-card p-4.5 flex items-center gap-4.5">
          <div className="p-2.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Eventos Ativos</p>
            <h4 className="text-xl font-bold text-slate-800 leading-none mt-1">
              {sessions.filter(s => s.status === 'scheduled').length}
              <span className="text-xs font-normal text-slate-400"> un</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">Esta semana e futuro</p>
          </div>
        </div>

      </div>

      {/* Primary Layout Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Organizer Control & Display Panel (2/3 col span) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            
            {/* Header with week navigation */}
            <div className="bg-slate-50 border-b border-slate-200 p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4.5 h-4.5 text-slate-800" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850 tracking-tight">Controle de Estudos Semanal</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Clique em um dia para planejar o que estudar e entregar.</p>
                </div>
              </div>

              {/* Week switcher buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => adjustWeekOffset(-1)}
                  className="px-2.5 py-1.5 text-[10px] font-mono font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition cursor-pointer"
                  title="Semana Anterior"
                >
                  &larr; VOLTAR
                </button>
                
                {weekOffset !== 0 && (
                  <button 
                    onClick={resetToCurrentWeek}
                    className="px-2.5 py-1.5 text-[10px] font-mono font-bold bg-slate-900 text-white rounded hover:bg-slate-800 transition cursor-pointer"
                  >
                    HOJE
                  </button>
                )}

                <button 
                  onClick={() => adjustWeekOffset(1)}
                  className="px-2.5 py-1.5 text-[10px] font-mono font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition cursor-pointer"
                  title="Próxima Semana"
                >
                  AVANÇAR &rarr;
                </button>
              </div>
            </div>

            {/* Informative timeframe subtitle */}
            <div className="bg-slate-100/50 text-center py-2 border-b border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Período: {formatDateBr(weekDays[0].dateStr)} a {formatDateBr(weekDays[6].dateStr)} 
                {weekOffset === 0 && ' (Semana Vigente)'}
              </span>
            </div>

            {/* Active responsive 7-day ribbon */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-white divide-x divide-slate-150">
              {weekDays.map(day => {
                const daySessionsCount = sessions.filter(s => s.date === day.dateStr).length;
                const dayPendingTasksCount = tasks.filter(t => t.dueDate === day.dateStr && t.status === 'pending').length;
                const isSelected = selectedDate === day.dateStr;

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => selectDay(day.dateStr)}
                    className={`p-3 text-center flex flex-col items-center justify-between gap-1 transition-all group overflow-hidden cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-900 text-white' 
                        : day.isToday
                        ? 'bg-amber-50/50 hover:bg-amber-50 text-slate-900 border-b-2 border-b-amber-500'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`text-[9px] uppercase font-bold tracking-tight ${isSelected ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      {day.labelShort}
                    </span>
                    
                    <span className="text-sm font-extrabold font-mono tracking-tight my-0.5 block">
                      {day.dayNum}
                    </span>

                    {/* Dot indicators: Blue (Sessions) and Orange (Pending tasks) */}
                    <div className="flex gap-1 justify-center items-center h-1.5 mt-0.5">
                      {daySessionsCount > 0 && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-sky-300' : 'bg-blue-600'}`} title={`${daySessionsCount} aula(s)`} />
                      )}
                      {dayPendingTasksCount > 0 && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-orange-600 animate-pulse'}`} title={`${dayPendingTasksCount} tarefa(s) pendente(s)`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected day control board details */}
            <div className="p-5 space-y-5 bg-white">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-800 animate-pulse"></div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {formatDayOfWeek(selectedDate)} — {formatDateBr(selectedDate)}
                    {selectedDate === todayStr && <span className="ml-1.5 text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase">Hoje</span>}
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Visualizando dia selecionado no controle</span>
              </div>

              {/* Sub-grid: events on left, tasks on right for the selected day */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Classes & Study Sessions for the Day */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Aulas e Eventos Agendados ({selectedDaySessions.length})</span>
                  </div>

                  {selectedDaySessions.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-lg p-5 text-center text-slate-400 bg-slate-50/50">
                      <p className="text-[11px] font-semibold text-slate-505">Nenhuma aula ou evento programado.</p>
                      <button 
                        onClick={() => {
                          setActiveFormTab('evento');
                          setEventDate(selectedDate);
                        }}
                        className="text-[10px] text-blue-600 hover:underline mt-1 bg-transparent border-none cursor-pointer font-bold block mx-auto"
                      >
                        + Cadastrar Aula para este dia
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedDaySessions.map(session => {
                        const course = getCourse(session.courseId);
                        const isCanceled = session.status === 'canceled';
                        const isCompleted = session.status === 'completed';

                        return (
                          <div 
                            key={session.id} 
                            className={`p-3 rounded-lg border flex flex-col justify-between gap-2.5 text-xs transition-all ${
                              isCanceled 
                                ? 'bg-slate-50/75 border-slate-200 line-through text-slate-400' 
                                : isCompleted
                                ? 'bg-emerald-50/30 border-emerald-100 opacity-90'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span 
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase block truncate max-w-[120px]"
                                  style={{ 
                                    backgroundColor: `${course?.color || '#3b82f6'}15`, 
                                    color: course?.color || '#3b82f6' 
                                  }}
                                >
                                  {course?.title || 'Compromisso Geral'}
                                </span>
                                
                                <span className="font-mono font-bold text-slate-500 scale-90 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" /> {session.startTime} - {session.endTime}
                                </span>
                              </div>

                              <h5 className={`font-semibold mt-1.5 text-slate-800 ${isCanceled ? 'line-through text-slate-400' : ''}`}>
                                {session.title}
                              </h5>

                              {session.location && (
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate">{session.location}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-1.5 mt-0.5">
                              {session.accessLink && !isCanceled ? (
                                <a 
                                  href={session.accessLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline"
                                >
                                  Acessar Link <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : <span />}

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setEditingSession(session)}
                                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                                  title="Editar Aula / Evento"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {sessionToDelete === session.id ? (
                                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded shadow-xs">
                                    <span className="text-[9px] font-black uppercase text-rose-700 animate-pulse">Apagar?</span>
                                    <button
                                      onClick={() => {
                                        onDeleteSession?.(session.id);
                                        setSessionToDelete(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8px] font-bold cursor-pointer font-sans"
                                    >
                                      Sim
                                    </button>
                                    <button
                                      onClick={() => setSessionToDelete(null)}
                                      className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[8px] font-bold cursor-pointer font-sans"
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSessionToDelete(session.id)}
                                    className="p-1 hover:bg-rose-50 text-slate-450 hover:text-rose-650 rounded transition cursor-pointer"
                                    title="Remover Aula / Evento"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                
                                {!isCanceled && !isCompleted && (
                                  <>
                                    <button
                                      onClick={() => onCompleteSession(session.id)}
                                      className="p-1 hover:bg-emerald-105 text-emerald-600 rounded cursor-pointer"
                                      title="Completar"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onCancelSession(session.id)}
                                      className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <CalendarX className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                {isCanceled && (
                                  <span className="text-[8px] font-bold text-rose-500 uppercase bg-rose-50 px-1 py-0.5 rounded select-none">Cancelada</span>
                                )}
                                {isCompleted && (
                                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5 select-none">✓ Concluída</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Deadlines & Tasks for the Day */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                    <CheckSquare className="w-3.5 h-3.5 text-orange-600" />
                    <span>Estudos e Entregas Pendentes ({selectedDayTasks.length})</span>
                  </div>

                  {selectedDayTasks.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-lg p-5 text-center text-slate-400 bg-slate-50/50">
                      <p className="text-[11px] font-semibold text-slate-505">Nenhuma tarefa marcada para hoje.</p>
                      <button 
                        onClick={() => {
                          setActiveFormTab('tarefa');
                          setTaskDueDate(selectedDate);
                        }}
                        className="text-[10px] text-orange-600 hover:underline mt-1 bg-transparent border-none cursor-pointer font-bold block mx-auto"
                      >
                        + Registrar Tarefa para hoje
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedDayTasks.map(task => {
                        const course = task.courseId ? getCourse(task.courseId) : null;
                        const isDone = task.status === 'completed';

                        return (
                          <div 
                            key={task.id} 
                            className={`p-3 rounded-lg border text-xs transition-all flex items-start justify-between gap-2 bg-white ${
                              isDone ? 'opacity-70 bg-slate-50/50 border-slate-100' : 'border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {course && (
                                  <span 
                                    className="text-[8px] font-extrabold px-1 rounded uppercase tracking-wider block shrink-0"
                                    style={{ 
                                      backgroundColor: `${course?.color || '#cbd5e1'}15`, 
                                      color: course?.color || '#a1a1aa' 
                                    }}
                                  >
                                    {course.title.split(' ')[0]}
                                  </span>
                                )}
                                {task.dueTime && (
                                  <span className="text-[9px] font-mono font-semibold text-slate-400">
                                    Limite: {task.dueTime}
                                  </span>
                                )}
                              </div>

                              <p className={`font-bold text-slate-800 ${isDone ? 'line-through text-slate-400' : ''} mt-1 text-xs truncate`}>
                                {task.title}
                              </p>
                              
                              <p className="text-[10px] text-slate-550 line-clamp-1 mt-0.5">
                                {task.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                                title="Editar Atividade"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {taskToDelete === task.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded shadow-xs">
                                  <span className="text-[9px] font-black uppercase text-rose-700 animate-pulse">Apagar?</span>
                                  <button
                                    onClick={() => {
                                      if (onDeleteTask) {
                                        onDeleteTask(task.id);
                                      }
                                      setTaskToDelete(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8px] font-bold cursor-pointer"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    onClick={() => setTaskToDelete(null)}
                                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setTaskToDelete(task.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer"
                                  title="Deletar Atividade"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <input 
                                type="checkbox"
                                checked={isDone}
                                onChange={() => {
                                  if (onUpdateTask) {
                                    onUpdateTask({ ...task, status: isDone ? 'pending' : 'completed' });
                                  } else if (onAddTask) {
                                    onAddTask({ ...task, status: isDone ? 'pending' : 'completed' });
                                  }
                                }}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 shrink-0 select-none cursor-pointer"
                                title="Marcar como Completa"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* Academic Courses / Programs Manager list (repositioned right under weekly list) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-800">Cursos e Grades Sincronizadas ({courses.length})</h3>
              </div>
              <button
                onClick={onOpenCourseForm}
                className="px-3 py-1.5 bg-slate-900 border border-slate-950 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Cadastrar Curso
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl bg-white p-10 text-center text-slate-400 shadow-xs">
                <p className="text-xs font-semibold text-slate-600">Nenhum programa ou curso configurado.</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">Cadastre sua grade de disciplinas do SENAI ou eventos complementares para liberar o agendamento em massa automático.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(course => {
                  const stats = getCourseStats(course.id);
                  const progressPct = stats.total > 0 ? (stats.completed / (stats.total - stats.canceled || 1)) * 100 : 0;
                  
                  return (
                    <div 
                      key={course.id} 
                      className="bg-white rounded-xl border border-slate-200 hover:border-slate-250 p-4.5 relative flex flex-col justify-between overflow-hidden shadow-xs transition duration-150"
                    >
                      {/* Course Accent Tag color */}
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: course.color }}></div>

                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-850 line-clamp-1">{course.title}</h4>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingCourse(course);
                              }}
                              className="p-1 text-slate-450 hover:text-slate-800 rounded transition cursor-pointer"
                              title="Editar Curso"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {courseToDelete === course.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg shadow-sm">
                                <span className="text-[8px] font-black uppercase text-rose-700 animate-pulse leading-none">Excluir tudo?</span>
                                <button
                                  onClick={() => {
                                    onDeleteCourse(course.id);
                                    setCourseToDelete(null);
                                  }}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-extrabold cursor-pointer transition"
                                >
                                  Sim
                                </button>
                                <button
                                  onClick={() => setCourseToDelete(null)}
                                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-extrabold cursor-pointer transition"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCourseToDelete(course.id)}
                                className="p-1 text-slate-450 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Remover Curso"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 min-h-6 leading-relaxed">
                          {course.description || 'Sem descrição inserida.'}
                        </p>

                        {(course.location || course.accessLink) && (
                          <div className="p-2 bg-slate-50/70 border border-slate-100 rounded-lg space-y-1 text-[10px] text-slate-600">
                            {course.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{course.location}</span>
                              </div>
                            )}
                            {course.accessLink && (
                              <div className="flex items-center gap-1">
                                <Link className="w-3 h-3 text-slate-400" />
                                <a href={course.accessLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Virtual Portal &rarr;
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-550 font-bold">
                            <span>Aulas Completas</span>
                            <span>{stats.completed}/{stats.total - stats.canceled} de Cronograma ({progressPct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1">
                            <div className="h-1 rounded-full" style={{ width: `${progressPct}%`, backgroundColor: course.color }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50 text-[10px] font-mono">
                        <span className="font-bold text-slate-400">CARGA HORÁRIA: {course.totalHours || stats.completed * 4}h</span>
                        <button
                          onClick={() => {
                            setSelectedCourseIdForNotes(course.id);
                            onSwitchTab('notes');
                          }}
                          className="px-2 py-0.5 text-slate-600 bg-slate-150 hover:bg-slate-200 hover:text-slate-850 rounded font-semibold transition"
                        >
                          Ver Caderno
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Weekly Quick Registrar Column (1/3 col span) */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-950 overflow-hidden shadow-md">
            
            <div className="p-4.5 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white tracking-tight">Registro de Atividades</h3>
              </div>
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">CADASTRO</span>
            </div>

            {/* Quick feedback alerts banner space */}
            {formSuccessMessage && (
              <div className="bg-emerald-950/80 border-b border-emerald-900 p-3.5 text-xs text-emerald-350 font-medium animate-pulse flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            {/* Form category pick tabs */}
            <div className="grid grid-cols-2 bg-slate-900 border-b border-slate-850 text-center select-none text-xs">
              <button
                onClick={() => setActiveFormTab('evento')}
                className={`py-3 font-semibold transition cursor-pointer border-b ${
                  activeFormTab === 'evento' 
                    ? 'border-b-emerald-400 text-white bg-slate-850/40' 
                    : 'border-b-transparent text-slate-400 hover:bg-slate-850/20 hover:text-slate-200'
                }`}
              >
                1. Aula / Evento
              </button>
              <button
                onClick={() => setActiveFormTab('tarefa')}
                className={`py-3 font-semibold transition cursor-pointer border-b ${
                  activeFormTab === 'tarefa' 
                    ? 'border-b-emerald-400 text-white bg-slate-850/40' 
                    : 'border-b-transparent text-slate-400 hover:bg-slate-850/20 hover:text-slate-200'
                }`}
              >
                2. Entrega / Estudo
              </button>
            </div>

            {/* Active Forms */}
            <div className="p-5">
              {activeFormTab === 'evento' ? (
                // LECTURE / SESSION FORM
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Event / Título da Aula</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Aula Prática CLP, Prova SENAI, Reunião de Grupo"
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Disciplina Relacionada</label>
                    <select
                      value={eventCourseId}
                      onChange={e => setEventCourseId(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
                    >
                      <option value="">-- Selecione uma Disciplina / Especialidade --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                      <option value="geral">Instruções Complementares (Geral)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Data Programada</label>
                      <input 
                        type="date"
                        required
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700 font-mono" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Horário Entrada</label>
                      <input 
                        type="time"
                        required
                        value={eventStartTime}
                        onChange={e => setEventStartTime(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700 font-mono" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Saída / Término</label>
                      <input 
                        type="time"
                        required
                        value={eventEndTime}
                        onChange={e => setEventEndTime(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700 font-mono" 
                      />
                    </div>
                    <div className="space-y-1 font-mono text-[9px] text-slate-500 flex items-center pl-1 h-full mt-3">
                      <span>Carga Horária sugerida baseada no intervalo.</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Local Presencial (Opcional)</label>
                    <input 
                      type="text"
                      placeholder="Ex: Lab 102 SENAI, Auditório Principal"
                      value={eventLocation}
                      onChange={e => setEventLocation(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Link de Acesso Remoto (Opcional)</label>
                    <input 
                      type="url"
                      placeholder="Ex: http://teams.microsoft.com/..."
                      value={eventAccessLink}
                      onChange={e => setEventAccessLink(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700 font-mono" 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 font-extrabold focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-slate-950 rounded-lg text-xs tracking-wide uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Cadastrar Aula / Evento
                  </button>
                  
                </form>
              ) : (
                // TASKS / DEADLINE FORM
                <form onSubmit={handleTaskSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Título / O que Tenho que Fazer</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Enviar Exercício Banner, Revisar Relatórios"
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Matéria / Disciplina</label>
                    <select
                      value={taskCourseId}
                      onChange={e => setTaskCourseId(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
                    >
                      <option value="">Geral (Sem disciplina específica)</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Prazo Atividade</label>
                      <input 
                        type="date"
                        required
                        value={taskDueDate}
                        onChange={e => setTaskDueDate(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700 font-mono" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Horário Máximo</label>
                      <input 
                        type="time"
                        required
                        value={taskDueTime}
                        onChange={e => setTaskDueTime(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-slate-700 font-mono" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Instruções / Descrição das Entregas</label>
                    <textarea 
                      rows={3}
                      placeholder="Indique as especificações da entrega, arquivos PDF a enviar, bibliografias, ou notas complementares de estudo."
                      value={taskDescription}
                      onChange={e => setTaskDescription(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-700" 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 font-extrabold focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-slate-950 rounded-lg text-xs tracking-wide uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Registrar Tarefa / Entrega
                  </button>

                </form>
              )}
            </div>

            <div className="bg-slate-950 p-4 font-sans text-[10px] text-slate-400 border-t border-slate-850 space-y-1.5">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping"></span>
                <span>Configurado para o schema isolado <strong className="text-emerald-350">novo_site</strong></span>
              </p>
              <p className="leading-normal">
                Para controle do calendário de forma visual complexa, use o menu superior <strong>"Calendário Integrado"</strong>.
              </p>
            </div>

          </div>

          {/* Quick Help box advice */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 text-slate-600">
            <span className="p-2 bg-slate-50 border border-slate-100 rounded-lg shrink-0 h-9 flex items-center justify-center text-slate-800">💡</span>
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-slate-700">Dica de Planejamento:</span> Ao selecionar qualquer um dos dias no banner lateral à esquerda, os campos de "data" das ações de cadastro rápido atualizam-se sozinhos. Planeje sua semana em segundos!
            </div>
          </div>

        </div>

      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <div id="edit-course-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-slate-800">
          <div id="edit-course-modal-container" className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-xs">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-slate-500">Editar Detalhes do Curso</h3>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-655 font-bold p-1 hover:bg-slate-100 rounded-lg">✕</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateCourse) {
                onUpdateCourse(editingCourse);
              }
              setEditingCourse(null);
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nome do Curso / Disciplina *</label>
                <input
                  type="text"
                  required
                  value={editingCourse.title}
                  onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Descrição</label>
                <textarea
                  value={editingCourse.description || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden resize-none text-slate-800"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Carga Horária (Shrs)</label>
                  <input
                    type="number"
                    value={editingCourse.totalHours || ''}
                    onChange={e => setEditingCourse({ ...editingCourse, totalHours: Number(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Cor do Curso *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingCourse.color}
                      onChange={e => setEditingCourse({ ...editingCourse, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0"
                    />
                    <span className="font-mono text-[10px] text-slate-500">{editingCourse.color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Localização (Opcional)</label>
                <input
                  type="text"
                  value={editingCourse.location || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, location: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Link de Acesso (Opcional)</label>
                <input
                  type="url"
                  value={editingCourse.accessLink || ''}
                  onChange={e => setEditingCourse({ ...editingCourse, accessLink: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden font-mono text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-3.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded-md font-mono font-bold hover:bg-slate-100 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div id="edit-session-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-slate-800">
          <div id="edit-session-modal-container" className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-xs text-slate-850">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-slate-505">Editar Aula / Evento</h3>
              <button onClick={() => setEditingSession(null)} className="text-slate-400 hover:text-slate-655 font-bold p-1 hover:bg-slate-100 rounded-lg">✕</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateSession) {
                onUpdateSession(editingSession);
              }
              setEditingSession(null);
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Título do Evento / Aula *</label>
                <input type="text" required value={editingSession.title} onChange={e => setEditingSession({ ...editingSession, title: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden text-slate-800" />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Disciplina / Curso</label>
                <select value={editingSession.courseId} onChange={e => setEditingSession({ ...editingSession, courseId: e.target.value })} className="w-full px-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-800">
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                  <option value="geral">Instruções Complementares (Geral)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Data *</label>
                  <input type="date" required value={editingSession.date} onChange={e => setEditingSession({ ...editingSession, date: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden font-mono text-slate-805" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Status</label>
                  <select value={editingSession.status} onChange={e => setEditingSession({ ...editingSession, status: e.target.value as any })} className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-white text-slate-805">
                    <option value="scheduled">Agendada</option>
                    <option value="completed">Concluída</option>
                    <option value="canceled">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hora Início *</label>
                  <input type="time" required value={editingSession.startTime} onChange={e => setEditingSession({ ...editingSession, startTime: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-805" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hora Término *</label>
                  <input type="time" required value={editingSession.endTime} onChange={e => setEditingSession({ ...editingSession, endTime: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-850" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Local (Opcional)</label>
                <input type="text" value={editingSession.location || ''} onChange={e => setEditingSession({ ...editingSession, location: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-800" />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Link de Acesso (Opcional)</label>
                <input type="url" value={editingSession.accessLink || ''} onChange={e => setEditingSession({ ...editingSession, accessLink: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-250 rounded-lg font-mono text-slate-800" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingSession(null)} className="px-3.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded-md font-mono font-bold hover:bg-slate-100 cursor-pointer">CANCELAR</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs cursor-pointer">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div id="dashboard-edit-task-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-slate-800">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-xs">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-slate-500">Editar Atividade / Tarefa</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1.5 rounded-lg font-sans">✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateTask) {
                onUpdateTask(editingTask);
              }
              setEditingTask(null);
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Título da Atividade *</label>
                <input type="text" required value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-850 focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Descrição</label>
                <textarea rows={3} value={editingTask.description || ''} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg resize-none text-slate-850 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Data Limite *</label>
                  <input type="date" required value={editingTask.dueDate} onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-850 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hora Limite</label>
                  <input type="time" value={editingTask.dueTime || ''} onChange={e => setEditingTask({ ...editingTask, dueTime: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-205 rounded-lg font-mono text-slate-850 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Curso Associado</label>
                <select value={editingTask.courseId || ''} onChange={e => setEditingTask({ ...editingTask, courseId: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-850 focus:outline-none">
                  <option value="">Nenhum (Geral)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingTask(null)} className="px-3.5 py-1.5 text-slate-500 hover:bg-slate-105 rounded-md font-mono font-bold cursor-pointer">CANCELAR</button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs cursor-pointer">SALVAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
