import { create } from 'zustand';
import { apiCall } from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  slug: string;
  githubRepo: string | null;
  createdAt: string;
}

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  selectProject: (id: string) => void;
  setSelectedProjectId: (id: string) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
}

function loadPersistedProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('pulseboard_selected_project');
  } catch {
    return null;
  }
}

function persistProjectId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem('pulseboard_selected_project', id);
    } else {
      localStorage.removeItem('pulseboard_selected_project');
    }
  } catch { /* ignore */ }
}

let fetchProjectsAbort: AbortController | null = null;

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProjectId: loadPersistedProjectId(),
  loading: false,
  error: null,

  fetchProjects: async () => {
    if (fetchProjectsAbort) fetchProjectsAbort.abort();
    const ac = new AbortController();
    fetchProjectsAbort = ac;
    set({ loading: true, error: null });

    try {
      const projects = await apiCall<Project[]>('/projects', { signal: ac.signal });
      if (ac.signal.aborted) return;
      const persistedId = get().selectedProjectId;
      const projectExists = persistedId && projects.some((p) => p.id === persistedId);
      const selectedProjectId = projectExists ? persistedId : (projects.length > 0 ? projects[0].id : null);
      set({
        projects,
        loading: false,
        selectedProjectId,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      set({ loading: false, error: 'Failed to load projects' });
    }
  },

  selectProject: (id: string) => {
    persistProjectId(id);
    set({ selectedProjectId: id });
  },
  setSelectedProjectId: (id: string) => {
    persistProjectId(id);
    set({ selectedProjectId: id });
  },

  addProject: (project: Project) => {
    persistProjectId(project.id);
    set((state) => ({
      projects: [project, ...state.projects],
      selectedProjectId: project.id,
    }));
  },

  removeProject: (id: string) =>
    set((state) => {
      const nextId =
        state.selectedProjectId === id
          ? state.projects.filter((p) => p.id !== id)[0]?.id ?? null
          : state.selectedProjectId;
      persistProjectId(nextId);
      return {
        projects: state.projects.filter((p) => p.id !== id),
        selectedProjectId: nextId,
      };
    }),
}));
