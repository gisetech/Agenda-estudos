import React, { useState } from 'react';
import { Course, StudyTask } from '../types';
import { CheckSquare, Square, Trash2, Calendar, ClipboardList, Plus, Clock, Filter, AlertCircle, Sparkles, Edit } from 'lucide-react';
import { formatDateBr } from '../utils';

interface TaskSectionProps {
  courses: Course[];
  tasks: StudyTask[];
  onAddTask: (task: StudyTask) => void;
  onUpdateTask: (task: StudyTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export default function TaskSection({
  courses,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask
}: TaskSectionProps) {
  
  // States
  const [filterCourseId, setFilterCourseId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);

  // Form input states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('2026-05-22');
  const [dueTime, setDueTime] = useState('23:59');
  const [courseId, setCourseId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    onAddTask({
      id: `task-${Date.now()}`,
      courseId: courseId || undefined,
      title,
      description,
      dueDate,
      dueTime: dueTime || undefined,
      status: 'pending'
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setDueDate('2026-05-22');
    setDueTime('23:59');
    setCourseId('');
    setShowForm(false);
  };

  // Filtering
  const filteredTasks = tasks.filter(task => {
    const matchesCourse = filterCourseId === 'all' || task.courseId === filterCourseId;
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && task.status === 'pending') || 
      (filterStatus === 'completed' && task.status === 'completed');
    return matchesCourse && matchesStatus;
  });

  const getCourse = (id?: string) => courses.find(c => c.id === id);

  // Stats calculation
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner section */}
      <div className="bg-white p-5 rounded-xl border border-slate-202 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-800" />
            Entregas e Atividades Práticas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle os relatórios, provas, roteiros de CLP e tarefas a entregar dos seus cursos.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Tarefa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Add task form & Filters */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Filters */}
          <div className="bg-white p-5 rounded-xl border border-slate-202 space-y-4">
            <h4 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Filter className="w-3.5 h-3.5" />
              Filtrar Tarefas
            </h4>

            {/* Filter by course */}
            <div className="space-y-1.5 flex flex-col">
              <label className="text-[11px] font-bold text-slate-600">Por Curso:</label>
              <select
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-202 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                value={filterCourseId}
                onChange={e => setFilterCourseId(e.target.value)}
              >
                <option value="all">Todos os Cursos</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Filter by status */}
            <div className="space-y-1.5 pt-1.5 flex flex-col">
              <label className="text-[11px] font-bold text-slate-600">Por Status:</label>
              <div className="grid grid-cols-3 gap-1">
                {(['all', 'pending', 'completed'] as const).map(status => {
                  const labels = { all: 'Todas', pending: 'Pendentes', completed: 'Concluídas' };
                  const isSelected = filterStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilterStatus(status)}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-mono font-bold cursor-pointer text-center transition-all border ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-950 text-white'
                          : 'bg-white hover:bg-slate-50 border-slate-202 text-slate-500'
                      }`}
                    >
                      {labels[status].toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick overview metric */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-202">
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Pendentes</span>
                <p className="text-base font-extrabold text-slate-800 font-mono mt-0.5">{pendingCount}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-202">
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Concluídas</span>
                <p className="text-base font-extrabold text-slate-800 font-mono mt-0.5">{completedCount}</p>
              </div>
            </div>
          </div>

          {/* Create Task Form Toggle */}
          {showForm && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl space-y-4 animate-fade-in">
              <h4 className="text-sm font-bold font-display text-slate-800">Cadastrar Nova Entrega</h4>
              
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Título da Atividade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Entregar Relatório Final de CLP"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden text-slate-800 text-xs"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Descrição</label>
                  <textarea
                    placeholder="Instruções para a entrega, critérios, links de envio..."
                    rows={2.5}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden text-slate-800 text-xs resize-none"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Data Limite *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden text-slate-800 text-xs"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Hora Limite</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden text-slate-800 text-xs"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Curso Associado</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden text-slate-800 text-xs bg-white"
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                  >
                    <option value="">Nenhum (Atividade Geral)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3.5 py-1.5 text-slate-500 rounded-md font-mono font-bold hover:bg-slate-100 transition-all cursor-pointer text-xs"
                  >
                    FECHAR
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all cursor-pointer text-xs"
                  >
                    Salvar Atividade
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Right column: Task list */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-202 space-y-4">
          <h4 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest pl-1">
            Catálogo • {filteredTasks.length} {filteredTasks.length === 1 ? 'atividade' : 'atividades'}
          </h4>

          {filteredTasks.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-200 text-center text-slate-400 bg-slate-50/20 rounded-xl space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
              <h5 className="font-semibold text-slate-700 text-sm">Nenhum registro</h5>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Não há nenhuma atividade correspondente aos filtros de buscas aplicados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTasks.map(task => {
                const course = getCourse(task.courseId);
                const isCompleted = task.status === 'completed';

                return (
                  <div 
                    key={task.id}
                    className={`py-3.5 flex items-start justify-between gap-4 transition-all group ${
                      isCompleted ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Interactive checkbox */}
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className={`mt-0.5 text-slate-400 hover:text-slate-800 focus:outline-hidden transition-all shrink-0 cursor-pointer p-0.5 rounded hover:bg-slate-50`}
                        title={isCompleted ? 'Marcar como Pendente' : 'Marcar como Concluída'}
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-slate-900 fill-slate-50" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 pointer" />
                        )}
                      </button>

                      <div className="space-y-1 min-w-0">
                        {/* Course tag badge */}
                        <div className="flex items-center flex-wrap gap-2">
                          {course && (
                            <span 
                              className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 font-mono" 
                              style={{ 
                                backgroundColor: `${course.color}11`, 
                                color: course.color 
                              }}
                            >
                              {course.title.split(' ')[0] || 'Curso'}
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-semibold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Entrega: {formatDateBr(task.dueDate)} 
                            {task.dueTime && ` às ${task.dueTime}`}
                          </span>
                        </div>

                        <h4 className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`}>
                          {task.title}
                        </h4>

                        <p className="text-xs text-slate-500 max-w-xl">
                          {task.description || 'Nenhuma descrição detalhada inserida.'}
                        </p>
                      </div>
                    </div>

                    {/* Quick actions button container */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="text-slate-350 hover:text-slate-700 p-1.5 hover:bg-slate-50 rounded transition-all cursor-pointer"
                        title="Editar tarefa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-slate-350 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        title="Deletar tarefa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div id="edit-task-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div id="edit-task-modal-container" className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-slate-500">Editar Atividade / Tarefa</h3>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingTask && editingTask.title.trim()) {
                onUpdateTask(editingTask);
              }
              setEditingTask(null);
            }} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Título da Atividade *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden text-slate-850"
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Descrição</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden text-slate-850 resize-none font-sans"
                  rows={3}
                  value={editingTask.description || ''}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Data Limite *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden text-slate-850 font-mono"
                    value={editingTask.dueDate}
                    onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Hora Limite</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden text-slate-850 font-mono"
                    value={editingTask.dueTime || ''}
                    onChange={e => setEditingTask({ ...editingTask, dueTime: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Curso Associado</label>
                <select
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg focus:outline-hidden text-slate-850 bg-white"
                  value={editingTask.courseId || ''}
                  onChange={e => setEditingTask({ ...editingTask, courseId: e.target.value || undefined })}
                >
                  <option value="">Nenhum (Atividade Geral)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-1.5 text-slate-500 rounded-md font-mono font-bold hover:bg-slate-100 transition-all text-xs"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
