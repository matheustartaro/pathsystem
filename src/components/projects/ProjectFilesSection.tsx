import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Upload, 
  Trash2, 
  Download, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  FolderOpen,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProjectFiles, ProjectFile } from '@/hooks/useProjectFiles';
import { cn } from '@/lib/utils';

interface ProjectFilesSectionProps {
  projectId: string;
}

const categoryConfig = {
  documento: { label: 'Documento', color: 'bg-blue-500/10 text-blue-500' },
  imagem: { label: 'Imagem', color: 'bg-purple-500/10 text-purple-500' },
  projeto: { label: 'Projeto', color: 'bg-green-500/10 text-green-500' },
  contrato: { label: 'Contrato', color: 'bg-orange-500/10 text-orange-500' },
  outro: { label: 'Outro', color: 'bg-muted text-muted-foreground' },
};

export function ProjectFilesSection({ projectId }: ProjectFilesSectionProps) {
  const { 
    files, 
    isLoading, 
    uploadFile, 
    deleteFile, 
    getFileUrl, 
    formatFileSize,
    isUploading 
  } = useProjectFiles(projectId);

  const [selectedCategory, setSelectedCategory] = useState<ProjectFile['categoria']>('outro');
  const [deleteFileData, setDeleteFileData] = useState<ProjectFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadFile({ file, categoria: selectedCategory });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      const url = await getFileUrl(file.storage_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDelete = async () => {
    if (deleteFileData) {
      await deleteFile(deleteFileData);
      setDeleteFileData(null);
    }
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (tipo.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (tipo.includes('spreadsheet') || tipo.includes('excel')) return <FileSpreadsheet className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Arquivos</CardTitle>
        <div className="flex items-center gap-2">
          <Select 
            value={selectedCategory} 
            onValueChange={(v) => setSelectedCategory(v as ProjectFile['categoria'])}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.dwg,.dxf,.skp,.zip,.rar"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Enviar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">Nenhum arquivo anexado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const category = categoryConfig[file.categoria];
              
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-muted">
                      {getFileIcon(file.tipo)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{file.nome_original}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.tamanho)}</span>
                        <span>•</span>
                        <span>{format(file.created_at, "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-xs', category.color)}>
                      {category.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteFileData(file)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteFileData} onOpenChange={() => setDeleteFileData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo "{deleteFileData?.nome_original}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
