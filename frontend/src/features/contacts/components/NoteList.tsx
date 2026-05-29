import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Send } from 'lucide-react';
import { Button } from '@/components/common';
import type { Note } from '@/types/contact';

interface NoteListProps {
  notes: Note[];
  onAdd: (body: string) => void;
  adding?: boolean;
}

export function NoteList({ notes, onAdd, adding }: NoteListProps) {
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setBody('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="block flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <Button
          type="submit"
          size="sm"
          loading={adding}
          disabled={!body.trim()}
          leftIcon={<Send className="h-3.5 w-3.5" />}
          className="self-end"
        >
          Add
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <p className="whitespace-pre-wrap text-sm text-gray-700">{note.body}</p>
              <p className="mt-2 text-xs text-gray-400">
                {format(parseISO(note.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
