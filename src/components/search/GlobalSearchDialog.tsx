import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, Users, Receipt, Wrench, Package, ArrowRight } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useGlobalSearch, SearchResultType } from '@/hooks/useGlobalSearch';
import { Badge } from '@/components/ui/badge';

const typeIcons: Record<SearchResultType, React.ReactNode> = {
  projeto: <FolderKanban className="h-4 w-4" />,
  cliente: <Users className="h-4 w-4" />,
  transacao: <Receipt className="h-4 w-4" />,
  servico: <Wrench className="h-4 w-4" />,
  produto: <Package className="h-4 w-4" />,
};

const typeLabels: Record<SearchResultType, string> = {
  projeto: 'Projetos',
  cliente: 'Clientes',
  transacao: 'Transações',
  servico: 'Serviços',
  produto: 'Produtos',
};

const typeColors: Record<SearchResultType, string> = {
  projeto: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cliente: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  transacao: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  servico: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  produto: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export function GlobalSearchDialog() {
  const navigate = useNavigate();
  const { 
    query, 
    setQuery, 
    groupedResults, 
    isOpen, 
    close, 
    toggle 
  } = useGlobalSearch();

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const handleSelect = useCallback((url: string) => {
    close();
    navigate(url);
  }, [close, navigate]);

  const hasAnyResults = Object.values(groupedResults).some(arr => arr.length > 0);

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <CommandInput 
        placeholder="Buscar projetos, clientes, transações..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length < 2 ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Digite pelo menos 2 caracteres para buscar
              </p>
              <p className="text-xs text-muted-foreground/70">
                Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl</kbd> + 
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono ml-1">K</kbd> para abrir a qualquer momento
              </p>
            </div>
          </CommandEmpty>
        ) : !hasAnyResults ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum resultado encontrado para "{query}"
              </p>
            </div>
          </CommandEmpty>
        ) : (
          <>
            {(['projeto', 'cliente', 'transacao', 'servico', 'produto'] as SearchResultType[]).map((type, index) => {
              const results = groupedResults[type];
              if (results.length === 0) return null;

              return (
                <div key={type}>
                  {index > 0 && <CommandSeparator />}
                  <CommandGroup heading={typeLabels[type]}>
                    {results.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={`${result.title} ${result.subtitle}`}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                      >
                        <div className={`p-1.5 rounded ${typeColors[result.type]}`}>
                          {typeIcons[result.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              );
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
