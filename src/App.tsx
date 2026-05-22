import React, { useState, useEffect } from 'react';
import { Course, Session, StudyTask, StudyNote } from './types';
import { generateInitialMockData } from './utils';
import { BookOpen, Calendar, CheckSquare, FileText, GraduationCap, LayoutDashboard, Settings, Sparkles, Clock, LogOut, Database, RefreshCw, AlertTriangle, ShieldCheck, Trash, Trash2 } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import CalendarView from './components/CalendarView';
import TaskSection from './components/TaskSection';
import NoteSection from './components/NoteSection';
import CourseForm from './components/CourseForm';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  fetchSupabaseData,
  syncLocalToSupabase,
  upsertCourseSupabase,
  deleteCourseSupabase,
  upsertSessionsSupabase,
  upsertSessionSupabase,
  deleteSessionSupabase,
  upsertTaskSupabase,
  deleteTaskSupabase,
  upsertNoteSupabase,
  deleteNoteSupabase
} from './supabaseService';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'tasks' | 'notes'>('dashboard');
  const [selectedCourseIdForNotes, setSelectedCourseIdForNotes] = useState<string>('all');
  
  // State lists
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);

  // Supabase Sync States
  const [supabaseActive, setSupabaseActive] = useState(isSupabaseConfigured);
  const [dbLoading, setDbLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showSyncBanner, setShowSyncBanner] = useState(false);

  // Modal Triggers
  const [showCourseForm, setShowCourseForm] = useState(false);

  // Load state from localStorage on mount or pull from Supabase if configured
  useEffect(() => {
    const fetchAllData = async () => {
      if (isSupabaseConfigured) {
        try {
          setDbLoading(true);
          setDbError(null);
          const data = await fetchSupabaseData();
          
          setCourses(data.courses);
          setSessions(data.sessions);
          setTasks(data.tasks);
          setNotes(data.notes);
          
          // Replicate to localStorage as a super fast offline fallback cache
          localStorage.setItem('study_courses', JSON.stringify(data.courses));
          localStorage.setItem('study_sessions', JSON.stringify(data.sessions));
          localStorage.setItem('study_tasks', JSON.stringify(data.tasks));
          localStorage.setItem('study_notes', JSON.stringify(data.notes));
          setShowSyncBanner(false);
        } catch (err: any) {
          console.error("Erro ao carregar dados do Supabase:", err);
          setDbError(err.message || String(err));
          // Fallback to local storage so the application stays operational
          loadFromLocalFallback();
          setShowSyncBanner(true);
        } finally {
          setDbLoading(false);
        }
      } else {
        loadFromLocalFallback();
      }
    };

    const loadFromLocalFallback = () => {
      const cachedCourses = localStorage.getItem('study_courses');
      const cachedSessions = localStorage.getItem('study_sessions');
      const cachedTasks = localStorage.getItem('study_tasks');
      const cachedNotes = localStorage.getItem('study_notes');

      if (cachedCourses && cachedSessions && cachedTasks && cachedNotes) {
        setCourses(JSON.parse(cachedCourses));
        setSessions(JSON.parse(cachedSessions));
        setTasks(JSON.parse(cachedTasks));
        setNotes(JSON.parse(cachedNotes));
      } else {
        // Setup the initial perfect SENAI & React workshop mock dataset!
        const initialData = generateInitialMockData();
        
        setCourses(initialData.courses);
        setSessions(initialData.sessions);
        setTasks(initialData.tasks);
        setNotes(initialData.notes);

        // Persist immediate copy
        localStorage.setItem('study_courses', JSON.stringify(initialData.courses));
        localStorage.setItem('study_sessions', JSON.stringify(initialData.sessions));
        localStorage.setItem('study_tasks', JSON.stringify(initialData.tasks));
        localStorage.setItem('study_notes', JSON.stringify(initialData.notes));
      }
    };

    fetchAllData();
  }, [supabaseActive]);

  // Save changes to localStorage helper
  const persist = (updatedCourses: Course[], updatedSessions: Session[], updatedTasks: StudyTask[], updatedNotes: StudyNote[]) => {
    localStorage.setItem('study_courses', JSON.stringify(updatedCourses));
    localStorage.setItem('study_sessions', JSON.stringify(updatedSessions));
    localStorage.setItem('study_tasks', JSON.stringify(updatedTasks));
    localStorage.setItem('study_notes', JSON.stringify(updatedNotes));
  };

  // Import existing local data directly to Supabase
  const handleMigrateLocalDataToSupabase = async () => {
    try {
      setSyncingAll(true);
      setDbError(null);
      await syncLocalToSupabase(courses, sessions, tasks, notes);
      alert("Sucesso! Todos os dados locais foram exportados e salvos no seu banco de dados Supabase (schema 'novo_site').");
      setShowSyncBanner(false);
    } catch (err: any) {
      console.error(err);
      setDbError(err.message || String(err));
      alert("Erro ao transferir dados para o Supabase: " + (err.message || String(err)));
    } finally {
      setSyncingAll(false);
    }
  };

  // ACTIONS: Courses
  const handleAddCourse = async (newCourse: Course, newSessions: Session[]) => {
    const nextCourses = [...courses, newCourse];
    const nextSessions = [...sessions, ...newSessions];
    
    setCourses(nextCourses);
    setSessions(nextSessions);
    persist(nextCourses, nextSessions, tasks, notes);

    if (supabaseActive) {
      try {
        await upsertCourseSupabase(newCourse);
        await upsertSessionsSupabase(newSessions);
      } catch (err: any) {
        console.error("Erro no salvamento remoto Supabase:", err);
        setDbError("Erro ao salvar curso no Supabase: " + err.message);
      }
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const nextCourses = courses.filter(c => c.id !== courseId);
    const nextSessions = sessions.filter(s => s.courseId !== courseId);
    const nextTasks = tasks.filter(t => t.courseId !== courseId);
    const nextNotes = notes.filter(n => n.courseId !== courseId);

    setCourses(nextCourses);
    setSessions(nextSessions);
    setTasks(nextTasks);
    setNotes(nextNotes);
    persist(nextCourses, nextSessions, nextTasks, nextNotes);

    if (supabaseActive) {
      try {
        await deleteCourseSupabase(courseId);
      } catch (err: any) {
        console.error("Erro na deleção remota Supabase:", err);
        setDbError("Erro ao remover do Supabase: " + err.message);
      }
    }
  };

  // ACTIONS: Sessions / Classes
  const handleCancelSession = async (sessionId: string) => {
    const nextSessions = sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, status: 'canceled' as const };
      }
      return s;
    });

    setSessions(nextSessions);
    persist(courses, nextSessions, tasks, notes);

    if (supabaseActive) {
      try {
        const found = nextSessions.find(s => s.id === sessionId);
        if (found) {
          await upsertSessionSupabase(found);
        }
      } catch (err: any) {
        console.error("Erro no cancelamento de aula no Supabase:", err);
      }
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    const nextSessions = sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, status: 'completed' as const };
      }
      return s;
    });

    setSessions(nextSessions);
    persist(courses, nextSessions, tasks, notes);

    if (supabaseActive) {
      try {
        const found = nextSessions.find(s => s.id === sessionId);
        if (found) {
          await upsertSessionSupabase(found);
        }
      } catch (err: any) {
        console.error("Erro na conclusão de aula no Supabase:", err);
      }
    }
  };

  const handleModifySessionDate = async (sessionToEdit: Session, newDate: string, newTime?: string) => {
    const nextSessions = sessions.map(s => {
      if (s.id === sessionToEdit.id) {
        return { 
          ...s, 
          date: newDate,
          startTime: newTime || s.startTime
        };
      }
      return s;
    });

    setSessions(nextSessions);
    persist(courses, nextSessions, tasks, notes);

    if (supabaseActive) {
      try {
        const found = nextSessions.find(s => s.id === sessionToEdit.id);
        if (found) {
          await upsertSessionSupabase(found);
        }
      } catch (err: any) {
        console.error("Erro ao alterar data da aula no Supabase:", err);
      }
    }
  };

  const handleAddSession = async (newSession: Session) => {
    const nextSessions = [...sessions, newSession];
    setSessions(nextSessions);
    persist(courses, nextSessions, tasks, notes);

    if (supabaseActive) {
      try {
        await upsertSessionSupabase(newSession);
      } catch (err: any) {
        console.error("Erro ao criar aula/evento no Supabase:", err);
        setDbError("Erro ao salvar aula ou evento no Supabase: " + err.message);
      }
    }
  };

  // ACTIONS: Tasks
  const handleAddTask = async (newTask: StudyTask) => {
    const nextTasks = [newTask, ...tasks];
    setTasks(nextTasks);
    persist(courses, sessions, nextTasks, notes);

    if (supabaseActive) {
      try {
        await upsertTaskSupabase(newTask);
      } catch (err: any) {
        console.error("Erro ao criar tarefa no Supabase:", err);
        setDbError("Erro ao salvar entrega no Supabase: " + err.message);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const nextTasks = tasks.filter(t => t.id !== taskId);
    setTasks(nextTasks);
    persist(courses, sessions, nextTasks, notes);

    if (supabaseActive) {
      try {
        await deleteTaskSupabase(taskId);
      } catch (err: any) {
        console.error("Erro ao deletar tarefa no Supabase:", err);
      }
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const nextTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: (t.status === 'pending' ? 'completed' : 'pending') as 'pending' | 'completed' };
      }
      return t;
    });
    setTasks(nextTasks);
    persist(courses, sessions, nextTasks, notes);

    if (supabaseActive) {
      try {
        const found = nextTasks.find(t => t.id === taskId);
        if (found) {
          await upsertTaskSupabase(found);
        }
      } catch (err: any) {
        console.error("Erro ao alternar status do card de tarefa no Supabase:", err);
      }
    }
  };

  // ACTIONS: Notes
  const handleAddNote = async (newNote: StudyNote) => {
    const nextNotes = [newNote, ...notes];
    setNotes(nextNotes);
    persist(courses, sessions, tasks, nextNotes);

    if (supabaseActive) {
      try {
        await upsertNoteSupabase(newNote);
      } catch (err: any) {
        console.error("Erro ao criar caderno de nota no Supabase:", err);
        setDbError("Erro ao salvar anotação no Supabase: " + err.message);
      }
    }
  };

  const handleUpdateNote = async (updatedNote: StudyNote) => {
    const nextNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    setNotes(nextNotes);
    persist(courses, sessions, tasks, nextNotes);

    if (supabaseActive) {
      try {
        await upsertNoteSupabase(updatedNote);
      } catch (err: any) {
        console.error("Erro ao atualizar anotação no Supabase:", err);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const nextNotes = notes.filter(n => n.id !== noteId);
    setNotes(nextNotes);
    persist(courses, sessions, tasks, nextNotes);

    if (supabaseActive) {
      try {
        await deleteNoteSupabase(noteId);
      } catch (err: any) {
        console.error("Erro ao deletar anotação no Supabase:", err);
      }
    }
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    const nextCourses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
    setCourses(nextCourses);
    persist(nextCourses, sessions, tasks, notes);

    if (supabaseActive) {
      try {
        await upsertCourseSupabase(updatedCourse);
      } catch (err: any) {
        console.error("Erro ao atualizar curso no Supabase:", err);
        setDbError("Erro ao salvar curso no Supabase: " + err.message);
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const nextSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(nextSessions);
    persist(courses, nextSessions, tasks, notes);

    if (supabaseActive) {
      try {
        await deleteSessionSupabase(sessionId);
      } catch (err: any) {
        console.error("Erro ao deletar aula no Supabase:", err);
        setDbError("Erro ao remover aula no Supabase: " + err.message);
      }
    }
  };

  const handleUpdateSession = async (updatedSession: Session) => {
    const nextSessions = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    setSessions(nextSessions);
    persist(courses, nextSessions, tasks, notes);

    if (supabaseActive) {
      try {
        await upsertSessionSupabase(updatedSession);
      } catch (err: any) {
        console.error("Erro ao atualizar aula no Supabase:", err);
        setDbError("Erro ao salvar aula no Supabase: " + err.message);
      }
    }
  };

  const handleUpdateTask = async (updatedTask: StudyTask) => {
    const nextTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(nextTasks);
    persist(courses, sessions, nextTasks, notes);

    if (supabaseActive) {
      try {
        await upsertTaskSupabase(updatedTask);
      } catch (err: any) {
        console.error("Erro ao atualizar tarefa no Supabase:", err);
        setDbError("Erro ao salvar tarefa no Supabase: " + err.message);
      }
    }
  };

  const handleClearAllDemoData = async () => {
    if (!confirm("Atenção: Tem certeza de que deseja deletar todos os dados cadastrados e as amostras padrão de demonstração para recomeçar o seu gerenciador com a agenda limpa?")) {
      return;
    }

    try {
      setDbLoading(true);
      
      // Delete local states
      setCourses([]);
      setSessions([]);
      setTasks([]);
      setNotes([]);

      // Persist empty values locally
      persist([], [], [], []);

      // Also clean up remote Supabase DB if enabled
      if (supabaseActive) {
        // Due to foreign keys, delete child tables first to avoid foreign key constraints
        const sRes = await supabase.from('sessions').delete().neq('id', 'placeholder-doesnot-exist');
        const tRes = await supabase.from('tasks').delete().neq('id', 'placeholder-doesnot-exist');
        const nRes = await supabase.from('notes').delete().neq('id', 'placeholder-doesnot-exist');
        const cRes = await supabase.from('courses').delete().neq('id', 'placeholder-doesnot-exist');

        if (sRes.error) throw sRes.error;
        if (tRes.error) throw tRes.error;
        if (nRes.error) throw nRes.error;
        if (cRes.error) throw cRes.error;

        alert("Sucesso! Todo o banco de dados local e remoto (Supabase) foi limpo. Agora você pode cadastrar apenas seus próprios eventos e cursos!");
      } else {
        alert("Sucesso! Todos os dados e amostras foram excluídos localmente. Seu painel está pronto para novos cadastros!");
      }
    } catch (err: any) {
      console.error("Erro ao limpar dados no Supabase:", err);
      alert("Os dados locais foram resetados com sucesso, mas ocorreu uma inconsistência ao tentar limpar as tabelas do Supabase: " + (err.message || String(err)));
    } finally {
      setDbLoading(false);
    }
  };

  // Dynamic values
  const pendingDeliveriesCount = tasks.filter(t => t.status === 'pending').length;

  // State to toggle daily reminder collapse
  const [isReminderCollapsed, setIsReminderCollapsed] = useState(false);

  // Active anchor date for the academic study planner
  const todayStr = '2026-05-22';
  const todaySessions = sessions.filter(s => s.date === todayStr);
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const todayPendingTasks = todayTasks.filter(t => t.status === 'pending');

  return (
    <div id="full-workspace" className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-brand-purple/10">
      
      {/* Dynamic Stripe Gradient using User Colors at the absolute top of the viewport */}
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-indigo via-brand-purple via-brand-violet via-brand-blue to-brand-magenta"></div>

      {/* Crisp Minimalist Brand bar */}
      <header id="main-navigation-header" className="sticky top-0 z-45 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Logo Brand Title with Custom User Color Palette Gradient */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-indigo via-brand-purple to-brand-violet flex items-center justify-center text-white shadow-sm shadow-brand-indigo/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 leading-none">
                Gerenciador de Estudos
                <span className="text-[10px] font-semibold py-0.5 px-2 rounded-md bg-brand-purple/10 text-brand-purple border border-brand-purple/20 font-mono">SUPABASE</span>
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">Console acadêmico integrado com isolamento de schema corporativo.</p>
            </div>
          </div>

          {/* Indicators container */}
          <div className="flex flex-wrap items-center gap-2.5 font-sans">
            {/* Supabase Status indicator */}
            <div className="flex items-center gap-2 font-medium text-slate-600 border border-slate-200 px-3 py-1 bg-slate-50/50 rounded-lg">
              <span className={`w-1.5 h-1.5 rounded-full ${supabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-mono tracking-tight text-slate-500">
                {supabaseActive ? 'SUPABASE: ATIVO (schema: ' : 'MODO LOCAL: '}
                <strong className={supabaseActive ? "text-brand-purple font-mono" : ""}>{supabaseActive ? 'novo_site)' : 'LOCALSTORAGE'}</strong>
              </span>
            </div>

            {/* Current Date Display */}
            <div className="flex items-center gap-2 font-semibold text-slate-600 border border-slate-200 px-3 py-1 bg-slate-50/50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-brand-purple shrink-0" />
              <span className="text-[11px] font-mono tracking-tight text-brand-purple">22 de Maio de 2026</span>
            </div>

            {/* Clear all demo data and start clean action */}
            <button
              onClick={handleClearAllDemoData}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 hover:text-rose-800 rounded-lg font-bold font-sans text-[11px] transition duration-155 cursor-pointer shadow-xs select-none"
              title="Deletar dados demonstrativos/fictícios para deixar apenas o que você cadastrar"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Excluir Amostras (Recomeçar do Zero)</span>
            </button>
          </div>

        </div>
      </header>

      {/* Primary Workspace container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-8 flex-1 space-y-6">

        {/* Lembrete de Hoje (Daily Reminder Widget at the TOP) */}
        <div 
          id="lembrete-do-dia-banner" 
          className="rounded-2xl border border-brand-purple/15 overflow-hidden bg-white shadow-sm transition-all duration-200"
        >
          {/* Header Bar styled with custom color palette gradients */}
          <div className="p-4.5 bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-violet text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-brand-magenta animate-pulse" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-brand-magenta bg-white px-2 py-0.5 rounded-full inline-block mb-1">
                  Atividade do Dia de Hoje
                </h3>
                <h4 className="text-base font-extrabold tracking-tight">
                  📋 Lembrete do Dia: Sexta-feira, 22 de Maio de 2026
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono bg-white/10 text-white border border-white/20 rounded-lg px-2.5 py-1 font-bold">
                {todaySessions.length} compromissos • {todayPendingTasks.length} pendências
              </span>
              <button 
                onClick={() => setIsReminderCollapsed(!isReminderCollapsed)}
                className="px-2.5 py-1 text-[10px] uppercase font-mono font-bold bg-white/10 hover:bg-white/20 text-white rounded transition cursor-pointer"
              >
                {isReminderCollapsed ? 'Expandir' : 'Recolher'}
              </button>
            </div>
          </div>

          {/* Collapsible Content detail columns */}
          {!isReminderCollapsed && (
            <div className="p-5 bg-gradient-to-b from-brand-indigo/5 to-white grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100">
              
              {/* Left Column: Events / Classes programadas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-brand-indigo/10 pb-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
                  </span>
                  <h5 className="text-xs font-black uppercase text-brand-blue tracking-wider font-mono">
                    Aulas e Eventos de Hoje ({todaySessions.length})
                  </h5>
                </div>

                {todaySessions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Nenhum evento ou aula agendados para hoje.</p>
                ) : (
                  <div className="space-y-2">
                    {todaySessions.map(session => {
                      const course = courses.find(c => c.id === session.courseId);
                      return (
                        <div 
                          key={session.id} 
                          className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-brand-blue/30 transition shadow-xs"
                        >
                          <div className="min-w-0">
                            <span 
                              className="text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider inline-block text-slate-600 mb-1"
                              style={{ 
                                backgroundColor: course?.color ? `${course.color}15` : '#6366f115', 
                                color: course?.color || '#6366f1' 
                              }}
                            >
                              {course?.title || 'Compromisso Geral'}
                            </span>
                            <h6 className="text-xs font-bold text-slate-900 truncate leading-tight">
                              {session.title}
                            </h6>
                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
                              <Clock className="w-3 h-3 text-brand-purple shrink-0" />
                              <span>{session.startTime} - {session.endTime}</span>
                              {session.location && (
                                <span className="text-slate-400 truncate">| {session.location}</span>
                              )}
                            </p>
                          </div>

                          {session.accessLink && (
                            <a 
                              href={session.accessLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-brand-blue text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-brand-blue/90 shrink-0 select-none cursor-pointer"
                            >
                              Links <span className="scale-75">&rarr;</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Deadlines / Pending activities */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-brand-purple/10 pb-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-magenta opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-magenta"></span>
                  </span>
                  <h5 className="text-xs font-black uppercase text-brand-purple tracking-wider font-mono">
                    Entregas e Atividades Limite Hoje ({todayTasks.length})
                  </h5>
                </div>

                {todayTasks.length === 0 ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs">
                    <span>✨</span>
                    <span>Nenhuma entrega marcada para hoje! Tudo livre.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map(task => {
                      const course = courses.find(c => c.id === task.courseId);
                      const isCompleted = task.status === 'completed';
                      return (
                        <div 
                          key={task.id} 
                          className={`border p-3.5 rounded-xl flex items-center justify-between gap-3 transition-all shadow-xs ${
                            isCompleted 
                              ? 'bg-emerald-50/20 border-emerald-100 opacity-75' 
                              : 'bg-white border-slate-150 hover:border-brand-purple/30'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {course && (
                                <span 
                                  className="text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase mb-0.5 tracking-wide decoration-0 inline-block"
                                  style={{ 
                                    backgroundColor: `${course.color}15`, 
                                    color: course.color 
                                  }}
                                >
                                  {course.title.split(' ')[0]}
                                </span>
                              )}
                              {task.dueTime && (
                                <span className="text-[9px] font-mono font-bold text-brand-magenta bg-brand-magenta/5 border border-brand-magenta/10 rounded px-1.5">
                                  Limite: {task.dueTime}
                                </span>
                              )}
                            </div>
                            <h6 className={`text-xs font-bold leading-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'} truncate`}>
                              {task.title}
                            </h6>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{task.description}</p>
                          </div>

                          <div className="shrink-0 flex items-center">
                            <input 
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleToggleTask(task.id)}
                              className="w-4.5 h-4.5 text-brand-purple border-slate-300 rounded focus:ring-brand-purple hover:border-brand-purple shrink-0 select-none cursor-pointer"
                              title="Concluir Atividade Diretamente"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Supabase Interactive Load State & Warning Widgets */}
        {dbLoading && (
          <div className="bg-white border border-slate-202 rounded-xl p-4 flex items-center justify-between text-xs text-slate-600 animate-pulse font-mono">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />

              <span>Conectando e baixando dados acadêmicos do schema 'novo_site'...</span>
            </div>
          </div>
        )}

        {dbError && (
          <div className="bg-red-50/30 border border-red-200/60 rounded-xl p-5 text-xs text-red-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold uppercase tracking-wider text-[10px] font-mono text-red-600 mb-0.5">Pendência de Estrutura Supabase</p>
                <p className="text-red-700/90 leading-relaxed">
                  As chaves de conexão estão corretas, mas as tabelas ainda não foram geradas no schema customizado <code className="bg-red-100/50 px-1 py-0.5 rounded text-red-800 font-mono text-[10px]">novo_site</code>.
                  Execute o arquivo de migração SQL para que a sincronização automática seja ativada.
                </p>
                <p className="font-mono text-[9px] bg-red-100/20 font-medium p-2.5 rounded border border-red-200/30 overflow-auto max-w-full text-red-900 mt-2.5 whitespace-pre">
                  Mensagem de erro: {dbError}
                </p>
              </div>
            </div>
            
            <div className="pt-2.5 border-t border-red-200/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <span className="text-[10px] text-red-600 font-medium leading-relaxed">
                Adicione as tabelas abrindo o arquivo <strong className="font-mono bg-red-200/40 px-1 py-0.5 rounded text-red-800">/supabase-schema.sql</strong> localizado na sua raiz e colando no painel Supabase.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSupabaseActive(false);
                    alert("A aplicação reverteu para o modo offline localStorage provisoriamente!");
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-700 font-bold transition-all text-[10px] font-mono cursor-pointer"
                >
                  USAR LOCALSTORAGE
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`CREATE SCHEMA IF NOT EXISTS novo_site;`);
                    alert("Comando auxiliar 'CREATE SCHEMA IF NOT EXISTS novo_site;' copiado para área de transferência! Veja o arquivo 'supabase-schema.sql' para o DDL completo.");
                  }}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold transition-all text-[10px] font-mono cursor-pointer"
                >
                  COPIAR COMANDO SQL
                </button>
              </div>
            </div>
          </div>
        )}

        {showSyncBanner && !dbLoading && !dbError && (
          <div className="bg-slate-900 text-white border border-slate-950 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 animate-pulse">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">Sincronização Disponível</h4>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Suas variáveis do Supabase estão configuradas! Gostaria de migrar todos os dados locais atuais (cursos, calendários de aula, notas e entregas) para povoar o novo schema isolado <code className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">novo_site</code> agora?
              </p>
            </div>
            <button
              onClick={handleMigrateLocalDataToSupabase}
              disabled={syncingAll}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold font-mono rounded text-xs transition duration-150 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {syncingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  SINCRONIZANDO...
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  SINCRONIZAR AGORA
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Navigation Selector Tabs row */}
        <div className="flex items-center border-b border-slate-200 gap-1 scroll-x pb-0">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border-b-2 relative -mb-[2px] ${
              activeTab === 'dashboard'
                ? 'border-brand-purple text-brand-purple font-bold'
                : 'border-transparent text-slate-400 hover:text-brand-purple/70'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-brand-indigo" />
            Painel Geral
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border-b-2 relative -mb-[2px] ${
              activeTab === 'calendar'
                ? 'border-brand-purple text-brand-purple font-bold'
                : 'border-transparent text-slate-400 hover:text-brand-purple/70'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-brand-violet" />
            Calendário Integrado
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border-b-2 relative -mb-[2px] ${
              activeTab === 'tasks'
                ? 'border-brand-purple text-brand-purple font-bold'
                : 'border-transparent text-slate-400 hover:text-brand-purple/70'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-brand-blue" />
            Minhas Entregas
            {pendingDeliveriesCount > 0 && (
              <span className="text-[9px] bg-brand-magenta text-white font-mono font-bold w-4 h-4 rounded-full inline-flex items-center justify-center leading-none shadow-sm shadow-brand-magenta/30">
                {pendingDeliveriesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('notes');
              setSelectedCourseIdForNotes('all'); // Reset course focus when clicking directly
            }}
            className={`py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border-b-2 relative -mb-[2px] ${
              activeTab === 'notes'
                ? 'border-brand-purple text-brand-purple font-bold'
                : 'border-transparent text-slate-400 hover:text-brand-purple/70'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-brand-magenta" />
            Anotações de Aula
          </button>

        </div>

        {/* Tab content renderer panels */}
        <div id="active-tab-panel" className="min-h-[460px]">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              courses={courses}
              sessions={sessions}
              tasks={tasks}
              onOpenCourseForm={() => setShowCourseForm(true)}
              onDeleteCourse={handleDeleteCourse}
              onUpdateCourse={handleUpdateCourse}
              onCancelSession={handleCancelSession}
              onCompleteSession={handleCompleteSession}
              onModifySessionDate={handleModifySessionDate}
              onDeleteSession={handleDeleteSession}
              onUpdateSession={handleUpdateSession}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onSwitchTab={setActiveTab}
              setSelectedCourseIdForNotes={setSelectedCourseIdForNotes}
              onAddSession={handleAddSession}
              onAddTask={handleAddTask}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              courses={courses}
              sessions={sessions}
              tasks={tasks}
              onCancelSession={handleCancelSession}
              onCompleteSession={handleCompleteSession}
              onModifySessionDate={handleModifySessionDate}
              onDeleteSession={handleDeleteSession}
              onUpdateSession={handleUpdateSession}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskSection
              courses={courses}
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
            />
          )}

          {activeTab === 'notes' && (
            <NoteSection
              courses={courses}
              notes={notes}
              selectedCourseId={selectedCourseIdForNotes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          )}
        </div>

      </main>

      {/* Elegant minimalist site footer */}
      <footer id="applet-general-footer" className="bg-white border-t border-slate-200 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Isolamento Realizado • Schema: 'novo_site' no Supabase DB © 2026</span>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>Estudos Sincronizados em Nuvem e Disponíveis em Cache Offline</span>
          </div>
        </div>
      </footer>

      {/* Course Recurrence Creation dialog overlay */}
      {showCourseForm && (
        <CourseForm
          onAddCourse={handleAddCourse}
          existingCourses={courses}
          onClose={() => setShowCourseForm(false)}
        />
      )}

    </div>
  );
}

