import { Course, Session, StudyTask, StudyNote } from './types';
import { supabase } from './supabaseClient';

// ==========================================
// MAPPERS: TypeScript UI models <-> Postgres DB (snake_case)
// ==========================================

export const mapCourseToDB = (c: Course) => ({
  id: c.id,
  title: c.title,
  description: c.description || null,
  total_hours: c.totalHours || null,
  color: c.color,
  access_link: c.accessLink || null,
  location: c.location || null
});

export const mapCourseFromDB = (row: any): Course => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  totalHours: row.total_hours ? Number(row.total_hours) : undefined,
  color: row.color,
  accessLink: row.access_link || undefined,
  location: row.location || undefined
});

export const mapSessionToDB = (s: Session) => ({
  id: s.id,
  course_id: s.courseId,
  title: s.title,
  date: s.date,
  start_time: s.startTime,
  end_time: s.endTime,
  access_link: s.accessLink || null,
  location: s.location || null,
  status: s.status
});

export const mapSessionFromDB = (row: any): Session => ({
  id: row.id,
  courseId: row.course_id,
  title: row.title,
  date: row.date,
  startTime: row.start_time,
  endTime: row.end_time,
  accessLink: row.access_link || undefined,
  location: row.location || undefined,
  status: row.status as any
});

export const mapTaskToDB = (t: StudyTask) => ({
  id: t.id,
  course_id: t.courseId || null,
  title: t.title,
  description: t.description || null,
  due_date: t.dueDate,
  due_time: t.dueTime || null,
  status: t.status
});

export const mapTaskFromDB = (row: any): StudyTask => ({
  id: row.id,
  courseId: row.course_id || undefined,
  title: row.title,
  description: row.description || '',
  dueDate: row.due_date,
  dueTime: row.due_time || undefined,
  status: row.status as any
});

export const mapNoteToDB = (n: StudyNote) => ({
  id: n.id,
  course_id: n.courseId || null,
  title: n.title,
  content: n.content,
  created_at: n.createdAt,
  updated_at: n.updatedAt
});

export const mapNoteFromDB = (row: any): StudyNote => ({
  id: row.id,
  courseId: row.course_id || undefined,
  title: row.title,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});


// ==========================================
// DB SERVICE ACTIONS
// ==========================================

/**
 * Fetches all academic data from the 'novo_site' schema in Supabase
 */
export const fetchSupabaseData = async () => {
  const [coursesRes, sessionsRes, tasksRes, notesRes] = await Promise.all([
    supabase.from('courses').select('*').order('title', { ascending: true }),
    supabase.from('sessions').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('notes').select('*'),
  ]);

  if (coursesRes.error) throw coursesRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (notesRes.error) throw notesRes.error;

  return {
    courses: (coursesRes.data || []).map(mapCourseFromDB),
    sessions: (sessionsRes.data || []).map(mapSessionFromDB),
    tasks: (tasksRes.data || []).map(mapTaskFromDB),
    notes: (notesRes.data || []).map(mapNoteFromDB)
  };
};

/**
 * Syncs/Pushes existing local storage elements into Supabase in bulk
 */
export const syncLocalToSupabase = async (
  courses: Course[],
  sessions: Session[],
  tasks: StudyTask[],
  notes: StudyNote[]
) => {
  // Insert/upsert courses first due to foreign key relationships
  if (courses.length > 0) {
    const { error } = await supabase.from('courses').upsert(courses.map(mapCourseToDB));
    if (error) throw error;
  }
  
  // Simultaneously upsert all relational rows
  const promises = [];
  if (sessions.length > 0) {
    promises.push(supabase.from('sessions').upsert(sessions.map(mapSessionToDB)));
  }
  if (tasks.length > 0) {
    promises.push(supabase.from('tasks').upsert(tasks.map(mapTaskToDB)));
  }
  if (notes.length > 0) {
    promises.push(supabase.from('notes').upsert(notes.map(mapNoteToDB)));
  }

  if (promises.length > 0) {
    const results = await Promise.all(promises);
    for (const res of results) {
      if (res.error) throw res.error;
    }
  }
};

/**
 * Upserts a Single Course
 */
export const upsertCourseSupabase = async (course: Course) => {
  const { error } = await supabase.from('courses').upsert(mapCourseToDB(course));
  if (error) throw error;
};

/**
 * Deletes a Course
 */
export const deleteCourseSupabase = async (courseId: string) => {
  // Defensive manual cascade delete of related rows first
  await supabase.from('sessions').delete().eq('course_id', courseId);
  await supabase.from('tasks').delete().eq('course_id', courseId);
  await supabase.from('notes').delete().eq('course_id', courseId);

  // Finally delete the course itself
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw error;
};

/**
 * Upserts multiple sessions/classes (usually when creating a course)
 */
export const upsertSessionsSupabase = async (sessionsList: Session[]) => {
  if (sessionsList.length === 0) return;
  const { error } = await supabase.from('sessions').upsert(sessionsList.map(mapSessionToDB));
  if (error) throw error;
};

/**
 * Upserts a Single Session
 */
export const upsertSessionSupabase = async (session: Session) => {
  const { error } = await supabase.from('sessions').upsert(mapSessionToDB(session));
  if (error) throw error;
};

/**
 * Deletes a target session
 */
export const deleteSessionSupabase = async (sessionId: string) => {
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  if (error) throw error;
};

/**
 * Upserts a single Task / Delivery
 */
export const upsertTaskSupabase = async (task: StudyTask) => {
  const { error } = await supabase.from('tasks').upsert(mapTaskToDB(task));
  if (error) throw error;
};

/**
 * Deletes an active Task / Delivery
 */
export const deleteTaskSupabase = async (taskId: string) => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
};

/**
 * Upserts a Study Note
 */
export const upsertNoteSupabase = async (note: StudyNote) => {
  const { error } = await supabase.from('notes').upsert(mapNoteToDB(note));
  if (error) throw error;
};

/**
 * Deletes an active Study Note
 */
export const deleteNoteSupabase = async (noteId: string) => {
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) throw error;
};
