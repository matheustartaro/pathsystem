import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useColorPalettes } from '@/hooks/useColorPalettes';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ColorPalettePickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorPalettePicker({ selectedColor, onColorSelect }: ColorPalettePickerProps) {
  const { palettes, isLoading } = useColorPalettes();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map(j => (
                <Skeleton key={j} className="w-8 h-8 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-4 pr-4">
        {palettes.map((palette) => (
          <div key={palette.id}>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              {palette.group_name}
            </h4>
            <div className="flex flex-wrap gap-2">
              {palette.colors.map((color, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center",
                    selectedColor === color 
                      ? "border-foreground shadow-lg" 
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorSelect(color)}
                  title={color}
                >
                  {selectedColor === color && (
                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}