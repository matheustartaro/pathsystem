import React, { memo } from 'react';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ExportDropdownProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  label?: string;
}

export const ExportDropdown = memo(function ExportDropdown({
  onExportPDF,
  onExportExcel,
  disabled = false,
  size = 'default',
  variant = 'outline',
  label = 'Exportar',
}: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          disabled={disabled}
          aria-label="Menu de exportação"
        >
          <FileDown className="w-4 h-4 mr-2" aria-hidden="true" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={onExportPDF}
          className="cursor-pointer"
          role="menuitem"
        >
          <FileText className="w-4 h-4 mr-2 text-red-500" aria-hidden="true" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onExportExcel}
          className="cursor-pointer"
          role="menuitem"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" aria-hidden="true" />
          Exportar Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
