'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Plus, 
  Check, 
  Search,
  Command,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store/project.store';
import { useRouter } from 'next/navigation';

export function ProjectSelector() {
  const router = useRouter();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    setSelectedProjectId(id);
    setIsOpen(false);
    setSearch('');
  };

  const navigateToNew = () => {
    setIsOpen(false);
    router.push('/projects/new');
  };

  return (
    <div className="relative w-full z-40" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 group",
          isOpen 
            ? "bg-card border-primary/50 shadow-lg shadow-primary/5 ring-2 ring-primary/20" 
            : "bg-background/40 border-border/40 hover:border-primary/20 hover:bg-card/60"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center text-[10px] font-black transition-all duration-500",
            selectedProject 
              ? "from-primary to-indigo-600 text-white shadow-md shadow-primary/10 group-hover:rotate-[5deg]" 
              : "from-muted/40 to-muted-foreground/10 text-muted-foreground/40 border border-border/40"
          )}>
            {selectedProject ? selectedProject.name.slice(0, 2).toUpperCase() : <LayoutGrid className="h-5 w-5 opacity-40" />}
          </div>
          <div className="flex flex-col items-start min-w-0 overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none mb-1">Project Scope</span>
            <span className={cn(
              "text-xs font-bold truncate w-full text-left transition-colors",
              selectedProject ? "text-foreground" : "text-muted-foreground"
            )}>
              {selectedProject?.name || 'Select Project'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-all duration-300",
            isOpen && "rotate-180 text-primary"
          )} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 mt-2 p-2 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden"
          >
            {/* Search Protocol */}
            <div className="relative mb-2 group/search">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors" />
              <input
                autoFocus
                placeholder="Search Active Projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-background/50 rounded-xl border border-border/60 focus:border-primary/40 text-xs font-bold placeholder:text-muted-foreground/40 focus:outline-none transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-black text-muted-foreground/30 bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                <Command className="h-2 w-2" />
                <span>P</span>
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
              {filteredProjects.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Search className="h-6 w-6 text-muted-foreground/25 mx-auto" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">No Records Found</p>
                  </div>
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const isSelected = project.id === selectedProjectId;
                  return (
                    <button
                      key={project.id}
                      onClick={() => handleSelect(project.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-xl transition-all duration-200 group/item relative overflow-hidden",
                        isSelected 
                          ? "bg-primary text-white shadow-md shadow-primary/15" 
                          : "hover:bg-primary/5 text-muted-foreground hover:text-foreground border border-transparent hover:border-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 z-10">
                        <div className={cn(
                          "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black tracking-tight transition-all duration-300 shadow-sm",
                          isSelected ? "bg-white/20 border border-white/20" : "bg-muted text-muted-foreground group-hover/item:bg-primary group-hover/item:text-white group-hover/item:rotate-3"
                        )}>
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                          <span className={cn("text-xs font-black tracking-tight truncate w-full", isSelected ? "text-white" : "text-foreground")}>
                            {project.name}
                          </span>
                          <span className={cn(
                            "text-[9px] font-semibold truncate w-full opacity-60",
                            isSelected ? "text-white/80" : "text-muted-foreground"
                          )}>
                            {project.githubRepo ? `@${project.githubRepo}` : 'Direct API Stream'}
                          </span>
                        </div>
                      </div>
                      
                      {isSelected ? (
                        <div className="h-5 w-5 rounded bg-white/20 flex items-center justify-center z-10">
                          <Check className="h-3 text-white" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded bg-muted/20 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="h-3 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-border/40">
              <button
                onClick={navigateToNew}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-primary/5 text-primary font-black uppercase tracking-wider text-[9px] hover:bg-primary hover:text-white transition-all duration-300 group/new"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center group-hover/new:bg-white/20 group-hover/new:rotate-90 transition-all duration-300">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  Provision New Project
                </div>
                <Command className="h-2.5 w-2.5 opacity-30 group-hover/new:opacity-60 transition-opacity" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
