import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Send, Trash2, Reply, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useProjectComments, ProjectComment } from '@/hooks/useProjectComments';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ProjectCommentsSectionProps {
  projectId: string;
}

function CommentItem({ 
  comment, 
  onReply, 
  onDelete,
  currentUserId,
  depth = 0 
}: { 
  comment: ProjectComment; 
  onReply: (parentId: string) => void;
  onDelete: (comment: ProjectComment) => void;
  currentUserId?: string;
  depth?: number;
}) {
  const initials = comment.user_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <div className={cn('space-y-3', depth > 0 && 'ml-8 pl-4 border-l-2 border-border')}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm">{comment.user_name || 'Usuário'}</span>
              <span className="text-xs text-muted-foreground" title={format(comment.created_at, "dd/MM/yyyy HH:mm", { locale: ptBR })}>
                {formatDistanceToNow(comment.created_at, { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.conteudo}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {depth < 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onReply(comment.id)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Responder
              </Button>
            )}
            {comment.user_id === currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => onDelete(comment)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectCommentsSection({ projectId }: ProjectCommentsSectionProps) {
  const { user } = useAuth();
  const { comments, isLoading, addComment, deleteComment, isSubmitting } = useProjectComments(projectId);
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [deleteCommentData, setDeleteCommentData] = useState<ProjectComment | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addComment({
      conteudo: newComment.trim(),
      parentId: replyingTo || undefined,
    });

    setNewComment('');
    setReplyingTo(null);
  };

  const handleDelete = async () => {
    if (deleteCommentData) {
      await deleteComment(deleteCommentData.id);
      setDeleteCommentData(null);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    // Focus on textarea
    const textarea = document.querySelector('textarea[name="comment"]') as HTMLTextAreaElement;
    textarea?.focus();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comentários
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Reply className="w-4 h-4" />
              <span>Respondendo a comentário</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => setReplyingTo(null)}
              >
                Cancelar
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              name="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={2}
              className="flex-1 resize-none"
            />
            <Button type="submit" size="icon" disabled={!newComment.trim() || isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Comments list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">Nenhum comentário ainda</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onDelete={setDeleteCommentData}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <AlertDialog open={!!deleteCommentData} onOpenChange={() => setDeleteCommentData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              O comentário e todas as respostas serão removidos permanentemente.
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
