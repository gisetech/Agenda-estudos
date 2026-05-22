import React, { useState, useEffect } from 'react';
import { Course, StudyNote } from '../types';
import { FileText, Plus, BookOpen, Clock, Calendar, Check, Save, Edit2, Eye, Trash2, ChevronRight } from 'lucide-react';
import { formatDateBr } from '../utils';

interface NoteSectionProps {
  courses: Course[];
  notes: StudyNote[];
  selectedCourseId?: string; // Optional starting category filter
  onAddNote: (note: StudyNote) => void;
  onUpdateNote: (note: StudyNote) => void;
  onDeleteNote: (noteId: string) => void;
}

// Simple custom Markdown previewer to avoid external dependencies
function CustomMarkdownPreview({ content }: { content: string }) {
  if (!content) return <p className="text-slate-400 italic text-xs">Escreva algo para visualizar aqui...</p>;

  const lines = content.split('\n');
  return (
    <div className="space-y-3.5 text-sm leading-relaxed text-slate-700">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={index} className="text-base font-bold text-slate-800 pt-3 border-b border-slate-50 font-display">{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={index} className="text-lg font-extrabold text-slate-800 pt-4 border-b border-slate-50 font-display">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={index} className="text-xl font-black text-slate-900 pt-4 pb-1 border-b border-slate-100 font-display">{line.replace('# ', '')}</h2>;
        }

        // Bullet lists
        if (line.startsWith('* ') || line.startsWith('- ')) {
          const itemText = line.substring(2);
          return (
            <ul key={index} className="list-disc pl-5 space-y-1 my-1">
              <li>{parseBold(itemText)}</li>
            </ul>
          );
        }

        // Ordered lists
        if (/^\d+\.\s/.test(line)) {
          const itemText = line.replace(/^\d+\.\s/, '');
          return (
            <ol key={index} className="list-decimal pl-5 space-y-1 my-1">
              <li>{parseBold(itemText)}</li>
            </ol>
          );
        }

        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-4 border-blue-500 bg-slate-50 px-4 py-2 my-2 text-slate-600 rounded-r-lg italic">
              {parseBold(line.substring(2))}
            </blockquote>
          );
        }

        // Regular line (parse bold dynamically)
        if (line.trim() === '') return <div key={index} className="h-2"></div>;

        return <p key={index} className="text-slate-600">{parseBold(line)}</p>;
      })}
    </div>
  );
}

// Inline Bold replacement parser helper
function parseBold(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length === 1) return text;
  
  return parts.map((part, i) => (
    i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-900">{part}</strong> : part
  ));
}

export default function NoteSection({
  courses,
  notes,
  selectedCourseId,
  onAddNote,
  onUpdateNote,
  onDeleteNote
}: NoteSectionProps) {
  
  // Category / Course filter state (pre-fills with passed selection if any)
  const [filterCourseId, setFilterCourseId] = useState<string>(selectedCourseId || 'all');
  
  // Selected note ID
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    return notes.length > 0 ? notes[0].id : null;
  });

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCourseId, setEditCourseId] = useState('');

  const activeNote = notes.find(n => n.id === activeNoteId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [activeNoteId]);

  // Trigger editing mode and populate states
  const startEditing = () => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditContent(activeNote.content);
      setEditCourseId(activeNote.courseId || '');
      setIsEditing(true);
    }
  };

  // Trigger creation of new fresh note
  const startNewNote = () => {
    const defaultCourse = filterCourseId !== 'all' ? filterCourseId : '';
    setEditTitle('Nova Anotação sem Título');
    setEditContent('### Escreva seu resumo aqui\n\nUse tópicos para facilitar:\n* **Ponto 1**: Detalhe crucial.\n* **Ponto 2**: Detalhe extra.');
    setEditCourseId(defaultCourse);
    setIsEditing(true);

    // Create immediate mock item
    const newId = `note-${Date.now()}`;
    const newNote: StudyNote = {
      id: newId,
      courseId: defaultCourse || undefined,
      title: 'Minhas anotações da Aula de hoje',
      content: '### Resumo da Aula\n\n* **Assunto principal**: ...\n* **Anotações**: ...\n* **Próximos Passos**: ...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onAddNote(newNote);
    setActiveNoteId(newId);
    
    // Auto populate editing states
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setEditCourseId(newNote.courseId || '');
  };

  // Save changes
  const handleSave = () => {
    if (!activeNoteId) return;
    
    onUpdateNote({
      id: activeNoteId,
      title: editTitle,
      content: editContent,
      courseId: editCourseId || undefined,
      createdAt: activeNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setIsEditing(false);
  };

  // Filtering notes
  const filteredNotes = notes.filter(note => {
    if (filterCourseId === 'all') return true;
    return note.courseId === filterCourseId;
  });

  const getCourse = (id?: string) => courses.find(c => c.id === id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Left panel: Notes catalog sidebar (4 cols on desktop) */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-202 p-5 space-y-4">
        
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pl-1">
            <FileText className="w-4 h-4 text-slate-900" />
            Cadernos de Notas
          </h3>
          <button
            onClick={startNewNote}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-205 text-slate-800 rounded-lg transition-all cursor-pointer"
            title="Nova Anotação"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Categories selector */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resumos por Matéria</label>
          <select
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-202 rounded-lg text-xs text-slate-800 focus:outline-hidden"
            value={filterCourseId}
            onChange={e => {
              setFilterCourseId(e.target.value);
              // reset active note to first in filtered list if active is no longer visible
              const filtered = notes.filter(n => e.target.value === 'all' || n.courseId === e.target.value);
              if (filtered.length > 0) {
                setActiveNoteId(filtered[0].id);
              } else {
                setActiveNoteId(null);
              }
            }}
          >
            <option value="all">Todas as Anotações</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <hr className="border-slate-100" />

        {/* Note cards list */}
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {filteredNotes.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 text-center rounded-lg text-slate-400 text-xs font-mono">
              NENHUM REGISTRO
            </div>
          ) : (
            filteredNotes.map(note => {
              const course = getCourse(note.courseId);
              const isActive = note.id === activeNoteId;
              
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    setIsEditing(false);
                  }}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left ${
                    isActive 
                      ? 'border-slate-900 bg-slate-50/50'
                      : 'border-slate-100 hover:border-slate-202 hover:bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className={`text-xs font-bold truncate ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                      {note.title}
                    </h5>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'text-slate-900 translate-x-0.5' : 'text-slate-305'}`} />
                  </div>
                  
                  {/* Note snippet preview */}
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-1">
                    {note.content.replace(/[#*`>]/g, '').slice(0, 55)}...
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[9px] font-semibold text-slate-400">
                    <span 
                      className="truncate max-w-[120px]"
                      style={{ color: course?.color || '#94a3b8' }}
                    >
                      {course ? course.title.split(' ')[0] : 'Geral'}
                    </span>
                    <span className="flex items-center gap-0.5 font-mono">
                      <Clock className="w-3 h-3" /> {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Right panel: Reader / editor view (8 cols on desktop) */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-202 p-5 space-y-6 min-h-[480px] flex flex-col justify-between">
        
        {activeNote ? (
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Header / Meta control actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-md uppercase font-mono"
                    style={{ 
                      backgroundColor: activeNote.courseId ? `${getCourse(activeNote.courseId)?.color}10` : '#f1f5f9',
                      color: activeNote.courseId ? getCourse(activeNote.courseId)?.color : '#475569'
                    }}
                  >
                    {activeNote.courseId ? getCourse(activeNote.courseId)?.title : 'Geral'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 font-mono inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Atualizado em {new Date(activeNote.updatedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                {isEditing ? (
                  <input
                    type="text"
                    className="text-base font-bold text-slate-900 bg-slate-50 px-3 py-1 border border-slate-205 rounded-lg focus:outline-hidden w-full max-w-lg"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                ) : (
                  <h3 className="text-base font-bold text-slate-900">{activeNote.title}</h3>
                )}
              </div>

              {/* Edit/Save/Trash tools */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Salvar Alterações
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-205 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEditing}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-202 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar Nota
                    </button>
                    {showDeleteConfirm ? (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg shadow-sm">
                        <span className="text-[11px] font-bold text-rose-700 animate-pulse font-sans">Excluir anotação?</span>
                        <button
                          onClick={() => {
                            if (activeNote) {
                              onDeleteNote(activeNote.id);
                              // select first available note if any remains
                              const remaining = notes.filter(n => n.id !== activeNote.id);
                              setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
                            }
                            setShowDeleteConfirm(false);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold font-sans cursor-pointer transition"
                        >
                          Sim, Apagar
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold font-sans cursor-pointer transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
                        title="Deletar anotação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Note Area */}
            <div className="flex-1 min-h-[320px] relative">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  {/* Left Column Text Editor */}
                  <div className="space-y-2 flex flex-col justify-between">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-1">Editor (Suporta Markdown simples)</label>
                      <select
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-202 rounded-lg text-xs font-semibold text-slate-600 mb-2 focus:outline-hidden"
                        value={editCourseId}
                        onChange={e => setEditCourseId(e.target.value)}
                      >
                        <option value="">Vincular a nenhum curso (Geral)</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    
                    <textarea
                      className="w-full flex-1 p-3 text-xs font-mono rounded-lg border border-slate-205 focus:outline-hidden bg-slate-50 text-slate-755 resize-none min-h-[260px] leading-relaxed"
                      placeholder="Use # para título, * para tópicos, e **negrito** para destacar."
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                    />

                    {/* Markdown Tips */}
                    <div className="p-2 border border-slate-202 bg-slate-50 rounded-lg text-[9px] font-medium text-slate-600 font-mono">
                      Ajuda rápida: # H1 • ## H2 • * Item • **negrito** • &gt; citação
                    </div>
                  </div>

                  {/* Right Column Instant Live Preview */}
                  <div className="bg-slate-50/40 p-4 rounded-xl border border-dashed border-slate-205 overflow-y-auto max-h-[380px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-2">Visualização em Tempo Real</span>
                    <CustomMarkdownPreview content={editContent} />
                  </div>
                </div>
              ) : (
                // Reader mode rendering
                <div className="prose prose-slate max-w-none prose-sm overflow-y-auto max-h-[380px] p-1">
                  <CustomMarkdownPreview content={activeNote.content} />
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center p-12 text-slate-400 flex-1 flex flex-col justify-center items-center space-y-3">
            <FileText className="w-12 h-12 text-slate-200" />
            <h4 className="font-semibold text-slate-700 text-sm">Sem notas de estudo selecionadas</h4>
            <p className="text-xs max-w-xs mx-auto text-slate-400">Você pode registrar ideias, resumos de aulas de CLP, fórmulas e anotações rápidas diretamente nos cursos para se manter organizado.</p>
            <button
              onClick={startNewNote}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Criar Primeira Anotação
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
