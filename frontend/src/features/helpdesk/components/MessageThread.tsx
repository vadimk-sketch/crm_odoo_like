import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Button, Badge } from '@/components/common';
import { createTicketMessage } from '@/api/helpdesk';
import type { TicketMessage } from '@/types/helpdesk';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface MessageThreadProps {
  ticketId: number;
  messages: TicketMessage[];
}

export function MessageThread({ ticketId, messages }: MessageThreadProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const sendMutation = useMutation({
    mutationFn: (payload: { body: string; message_type?: string }) =>
      createTicketMessage(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
      setBody('');
      toast.success(isInternal ? 'Internal note added' : 'Reply sent');
    },
    onError: () => toast.error('Failed to send message'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    sendMutation.mutate({
      body: trimmed,
      message_type: isInternal ? 'internal_note' : 'comment',
    });
  };

  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-3">
        {sorted.map((msg) => {
          const internal = msg.message_type === 'internal_note';
          return (
            <div
              key={msg.id}
              className={clsx(
                'rounded-lg border p-4',
                internal
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-white',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  {getInitials(msg.author_name || 'U')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {msg.author_name || 'Unknown'}
                    </span>
                    {internal && (
                      <Badge variant="warning" size="sm">
                        Internal
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(parseISO(msg.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
              <div className="mt-2 pl-11 text-sm text-gray-700 whitespace-pre-wrap">
                {msg.body}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            No messages yet. Start the conversation below.
          </p>
        )}
      </div>

      {/* Reply form */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isInternal ? 'Write an internal note...' : 'Write a reply...'}
          rows={3}
          className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Internal Note
          </label>
          <Button
            type="submit"
            size="sm"
            loading={sendMutation.isPending}
            disabled={!body.trim()}
            leftIcon={<Send className="h-4 w-4" />}
          >
            {isInternal ? 'Add Note' : 'Reply'}
          </Button>
        </div>
      </form>
    </div>
  );
}
