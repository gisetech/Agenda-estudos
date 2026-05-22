import { Course, Session, StudyTask, StudyNote } from './types';

// Format dynamic dates relative to current date (May 22, 2026)
// May 22, 2026 is a Friday.
// Monday of that week is May 18, 2026.
// Let's programmatically generate the 10 weekdays around this date.
export function generateInitialMockData() {
  const senaiCourseId = 'senai-clp-40h';
  
  const initialCourses: Course[] = [
    {
      id: senaiCourseId,
      title: 'Curso de Automação Industrial e CLP (SENAI)',
      description: 'Curso presencial/híbrido de CLP e Sistemas de Automação com carga horária de 40 horas.',
      totalHours: 40,
      color: '#0284c7', // sky-600
      accessLink: 'https://virtual.senai.br',
      location: 'SENAI - Bloco B / Lab 102'
    },
    {
      id: 'react-advanced',
      title: 'Workshop de React Avançado e TypeScript',
      description: 'Treinamento online ao vivo focado em arquiteturas escaláveis e state management.',
      totalHours: 12,
      color: '#8b5cf6', // violet-500
      accessLink: 'https://zoom.us/j/study-react-advanced',
      location: 'Zoom / Sympla'
    }
  ];

  // Helper to construct "YYYY-MM-DD" dates relative to standard May 2026
  const dates = [
    '2026-05-18', // Mon (Week 1)
    '2026-05-19', // Tue
    '2026-05-20', // Wed
    '2026-05-21', // Thu
    '2026-05-22', // Fri (Today!)
    '2026-05-25', // Mon (Week 2)
    '2026-05-26', // Tue
    '2026-05-27', // Wed
    '2026-05-28', // Thu
    '2026-05-29'  // Fri
  ];

  const initialSessions: Session[] = [];

  // Generate 10 classes of 4 hours = 40 hours total
  dates.forEach((date, index) => {
    const classNum = index + 1;
    initialSessions.push({
      id: `senai-class-${classNum}`,
      courseId: senaiCourseId,
      title: `Aula ${String(classNum).padStart(2, '0')}: Automação & CLP`,
      date: date,
      startTime: '13:00',
      endTime: '17:00',
      accessLink: 'https://virtual.senai.br',
      location: 'SENAI - Bloco B / Lab 102',
      // Class 1 to 4 are completed (Mon to Thu)
      // Class 5 is today (Friday, scheduled) - or let's mark it scheduled
      status: index < 4 ? 'completed' : 'scheduled'
    });
  });

  // Add the online workshop sessions: Saturday May 23 and Sunday May 24 (6h each = 12h total)
  initialSessions.push(
    {
      id: 'react-sess-1',
      courseId: 'react-advanced',
      title: 'React Avançado - Parte 1',
      date: '2026-05-23',
      startTime: '09:00',
      endTime: '15:00',
      accessLink: 'https://zoom.us/j/study-react-advanced',
      location: 'Zoom',
      status: 'scheduled'
    },
    {
      id: 'react-sess-2',
      courseId: 'react-advanced',
      title: 'React Avançado - Parte 2',
      date: '2026-05-24',
      startTime: '09:00',
      endTime: '15:00',
      accessLink: 'https://zoom.us/j/study-react-advanced',
      location: 'Zoom',
      status: 'scheduled'
    }
  );

  const initialTasks: StudyTask[] = [
    {
      id: 'task-1',
      courseId: senaiCourseId,
      title: 'Entregar Exercício de Lógica Ladder',
      description: 'Resolver o circuito de partida estrela-triângulo usando reles temporizadores no simulador.',
      dueDate: '2026-05-20',
      dueTime: '17:00',
      status: 'completed'
    },
    {
      id: 'task-2',
      courseId: senaiCourseId,
      title: 'Entrega do Relatório Técnico de CLP',
      description: 'Elaborar arquivo em PDF detalhando as variáveis de entrada, saída e o diagrama desenvolvido na bancada física.',
      dueDate: '2026-05-22', // Today
      dueTime: '23:59',
      status: 'pending'
    },
    {
      id: 'task-3',
      courseId: 'react-advanced',
      title: 'Configurar Repositório com React 19',
      description: 'Criar uma conta no Vercel e configurar o deploy contínuo da aplicação experimental usando Server Actions.',
      dueDate: '2026-05-24',
      dueTime: '22:00',
      status: 'pending'
    },
    {
      id: 'task-4',
      courseId: senaiCourseId,
      title: 'Projeto Final de Automação',
      description: 'Apresentação prática da automação da esteira classificadora com sensor capacitivo e indutivo.',
      dueDate: '2026-05-29', // Friday
      dueTime: '16:00',
      status: 'pending'
    }
  ];

  const initialNotes: StudyNote[] = [
    {
      id: 'note-1',
      courseId: senaiCourseId,
      title: 'Anotações Aula 01: Variáveis e Estrutura do CLP',
      content: `### Introdução ao CLP (Controles Lógicos Programáveis)

Hoje vimos os conceitos iniciais da arquitetura do CLP.
* **Memória de Imagem**: Entradas são lidas no início do ciclo de varredura (Scan Cycle).
* **Varredura (Scan)**: Leitura de Entradas -> Execução do Programa -> Atualização de Saídas.
* **Entradas (I/O)**: Botoeiras (NF/NA), sensores capacitivos, chaves limitadoras.

#### Comando de Liga/Desliga com Autoretenção (Selo):
* Utilizar contato auxiliar da saída em paralelo com a botoeira de Start.
* Botoeira de Stop SEMPRE posicionada de forma a cortar a corrente do selo (prioridade para desligar).`,
      createdAt: '2026-05-18T18:30:00Z',
      updatedAt: '2026-05-18T19:00:00Z'
    },
    {
      id: 'note-2',
      courseId: senaiCourseId,
      title: 'Anotações Aula 03: Temporizadores TON e TOF',
      content: `### Diferença entre TON e TOF em Ladder

1. **TON (Timer On Delay)**:
   * Retarda a ativação da saída.
   * Quando a entrada ativa, começa a contar o tempo presetado (PT).
   * A saída ativa após decorrer o tempo. Se a entrada resetar antes, o temporizador zera.

2. **TOF (Timer Off Delay)**:
   * Retarda a desativação da saída.
   * Quando a entrada ativa, a saída ativa IMMEDIATAMENTE.
   * Quando a entrada desliga, começa a contagem de tempo para só então desligar a saída.

*Utilizado na automação da ventilação pós-descaldamento da caldeira.*`,
      createdAt: '2026-05-20T20:15:00Z',
      updatedAt: '2026-05-20T20:45:00Z'
    }
  ];

  return {
    courses: initialCourses,
    sessions: initialSessions,
    tasks: initialTasks,
    notes: initialNotes
  };
}

export function formatDateBr(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDayOfWeek(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[date.getDay()];
}

export function getMonthNameBr(monthIndex: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex];
}
