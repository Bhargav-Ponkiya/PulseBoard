'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Plus, 
  Check, 
  Briefcase,
  Search,
  Command,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore, Project } from '@/store/project.store';
import { useRouter } from 'next/navigation';

export function ProjectSelector() {
  const router = useRouter();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Update coordinates when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Handle window resize/scroll to reposition
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Only close if click is NOT inside the portal
        const portal = document.getElementById('project-selector-portal');
        if (portal && portal.contains(e.target as Node)) return;
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
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-5 py-4 rounded-[1.5rem] border transition-all duration-500 group",
          isOpen 
            ? "bg-card border-primary/40 shadow-[0_0_40px_rgba(var(--primary),0.1)] ring-4 ring-primary/5" 
            : "bg-background/20 border-border/40 hover:border-primary/20 hover:bg-card/40"
        )}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn(
            "h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br flex items-center justify-center text-[10px] font-black transition-all duration-700",
            selectedProject 
              ? "from-primary to-indigo-600 text-white shadow-xl shadow-primary/20 group-hover:rotate-[10deg]" 
              : "from-muted/40 to-muted-foreground/10 text-muted-foreground/40 border border-border/40"
          )}>
            {selectedProject ? selectedProject.name.slice(0, 2).toUpperCase() : <LayoutGrid className="h-5 w-5 opacity-40" />}
          </div>
          <div className="flex flex-col items-start min-w-0 overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none mb-1.5">Project Scope</span>
            <span className={cn(
              "text-sm font-bold truncate w-full text-left transition-colors",
              selectedProject ? "text-foreground" : "text-muted-foreground"
            )}>
              {selectedProject?.name || 'Initialization Required'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-[1px] bg-border/40 mx-1 hidden md:block" />
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-all duration-500",
            isOpen && "rotate-180 text-primary"
          )} />
        </div>
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="project-selector-portal"
              initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              style={{
                position: 'fixed',
                top: coords.top + 12,
                left: coords.left,
                width: coords.width,
                zIndex: 9999
              }}
              className="p-3 rounded-[2.5rem] border border-border/40 bg-card/90 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden"
            >
              {/* Search Protocol */}
              <div className="relative mb-3 group/search">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-muted/20 flex items-center justify-center transition-colors group-focus-within/search:bg-primary/10">
                  <Search className="h-4 w-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                </div>
                <input
                  autoFocus
                  placeholder="Search Active Projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 pl-14 pr-4 bg-background/40 rounded-2xl border border-transparent focus:border-primary/20 text-sm font-bold placeholder:text-muted-foreground/30 focus:outline-none transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/30 bg-muted/20 px-2 py-1 rounded-lg border border-border/40">
                  <Command className="h-2.5 w-2.5" />
                  <span>P</span>
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredProjects.length === 0 ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="h-16 w-16 rounded-[2rem] bg-muted/10 border border-dashed border-border/40 flex items-center justify-center mx-auto">
                      <Search className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No Records Found</p>
                      <p className="text-[10px] text-muted-foreground/40 font-medium">Try a different project identifier</p>
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
                          "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group/item relative overflow-hidden",
                          isSelected 
                            ? "bg-primary text-white shadow-xl shadow-primary/20" 
                            : "hover:bg-primary/5 text-muted-foreground hover:text-foreground border border-transparent hover:border-primary/10"
                        )}
                      >
                        {isSelected && (
                          <motion.div layoutId="selection-bg" className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 -z-10" />
                        )}
                        
                        <div className="flex items-center gap-4 min-w-0 z-10">
                          <div className={cn(
                            "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-[11px] font-black tracking-tight transition-all duration-500 shadow-sm",
                            isSelected ? "bg-white/20 border border-white/20" : "bg-muted text-muted-foreground group-hover/item:bg-primary group-hover/item:text-white group-hover/item:rotate-3"
                          )}>
                            {project.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col items-start min-w-0">
                            <span className={cn("text-xs font-black tracking-tight truncate w-full", isSelected ? "text-white" : "text-foreground")}>
                              {project.name}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold truncate w-full opacity-60",
                              isSelected ? "text-white/80" : "text-muted-foreground"
                            )}>
                              {project.githubRepo ? `@${project.githubRepo}` : 'Direct API Stream'}
                            </span>
                          </div>
                        </div>
                        
                        {isSelected ? (
                          <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center z-10">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-lg bg-muted/20 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-border/10">
                <button
                  onClick={navigateToNew}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/5 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all duration-500 group/new"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover/new:bg-white/20 group-hover/new:rotate-90 transition-all duration-500">
                      <Plus className="h-4 w-4" />
                    </div>
                    Provision New Project
                  </div>
                  <Command className="h-3 w-3 opacity-30 group-hover/new:opacity-60 transition-opacity" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
