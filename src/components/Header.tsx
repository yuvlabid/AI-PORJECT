import { Download, Menu, X } from 'lucide-react';
import { useState } from 'react';

export type WorkspaceTab = 'studio' | 'recall' | 'quiz' | 'library';

interface HeaderProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  hasActiveDeck: boolean;
  onPrimaryAction: () => void;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'studio', label: 'Studio' },
  { id: 'recall', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'library', label: 'Saved Decks' },
];

export function Header({
  activeTab,
  onSelectTab,
  hasActiveDeck,
  onPrimaryAction,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="mac-toolbar sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('studio');
            setMobileMenuOpen(false);
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0062CC]"
        >
          RecallForge
        </a>

        {/* Zone 2: Clean macOS Segmented Bar Navigation */}
        <nav
          aria-label="Workspace navigation"
          className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/[0.045] p-1 ring-1 ring-slate-900/[0.05]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0062CC] ${
                  isActive
                    ? 'bg-white/95 text-[#005BB5] shadow-[0_1px_3px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,1)]'
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onPrimaryAction();
            }}
            className="mac-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0062CC]"
          >
            {hasActiveDeck ? (
              <>
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Export CSV</span>
              </>
            ) : (
              <span>Load Sample Deck</span>
            )}
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-900/10 bg-white/70 text-slate-700 md:hidden hover:bg-white"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile workspace navigation"
          className="border-t border-slate-900/[0.07] bg-white/85 backdrop-blur-xl px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0062CC]/10 text-[#005BB5]'
                      : 'text-slate-700 hover:bg-slate-900/[0.04]'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
