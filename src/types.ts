export interface Course {
  id: string;
  title: string;
  description: string;
  totalHours?: number;
  color: string; // Tailwind hex or class name
  accessLink?: string;
  location?: string;
}

export interface Session {
  id: string;
  courseId: string; // References Course.id
  title: string; // e.g. "Aula 01", "Aula 02"
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  accessLink?: string; // Specific link if different, else falls back to Course accessLink
  location?: string;
  status: 'scheduled' | 'canceled' | 'completed';
}

export interface StudyTask {
  id: string;
  courseId?: string; // Optional reference to course
  title: string;
  description: string;
  dueDate: string; // "YYYY-MM-DD"
  dueTime?: string; // "HH:MM"
  status: 'pending' | 'completed';
}

export interface StudyNote {
  id: string;
  courseId?: string; // Optional reference to course
  title: string;
  content: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}
