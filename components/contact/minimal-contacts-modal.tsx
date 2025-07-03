"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Contact } from '@/types/contact';
import { getContactDataScore } from '@/lib/config';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface MinimalContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onDelete: (contactIds: string[]) => void;
}

export function MinimalContactsModal({
  isOpen,
  onClose,
  contacts,
  onDelete
}: MinimalContactsModalProps) {
  const [selectedContacts, setSelectedContacts] = React.useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Reset selection when contacts change (after deletion)
  React.useEffect(() => {
    setSelectedContacts(new Set());
  }, [contacts]);

  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const toggleAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedContacts.size === 0) return;
    
    setIsDeleting(true);
    try {
      await onDelete(Array.from(selectedContacts));
      setSelectedContacts(new Set());
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const getContactSummary = (contact: Contact) => {
    const parts = [];
    if (contact.company) parts.push(`${contact.company}`);
    if (contact.role) parts.push(`${contact.role}`);
    if (contact.location) parts.push(`${contact.location}`);
    if (contact.contactInfo.emails.length > 0) parts.push(`${contact.contactInfo.emails.length} email${contact.contactInfo.emails.length > 1 ? 's' : ''}`);
    if (contact.contactInfo.phones.length > 0) parts.push(`${contact.contactInfo.phones.length} phone${contact.contactInfo.phones.length > 1 ? 's' : ''}`);
    if (contact.notes) parts.push('Has notes');
    return parts.join(' • ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Minimal Contacts</DialogTitle>
          <DialogDescription>
            These contacts have minimal information and can be deleted to free up space. 
            Sorted by least amount of data first.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedContacts.size === contacts.length && contacts.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all ({contacts.length} contacts)
            </span>
          </div>
          {selectedContacts.size > 0 && (
            <span className="text-sm font-medium">
              {selectedContacts.size} selected
            </span>
          )}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {contacts.map((contact) => {
              const score = getContactDataScore(contact);
              const isNameOnly = score === 1;
              
              return (
                <div
                  key={contact.id}
                  className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                    selectedContacts.has(contact.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => toggleContact(contact.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedContacts.has(contact.id)}
                      onCheckedChange={() => toggleContact(contact.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{contact.name}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isNameOnly 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {isNameOnly ? 'Name only' : `${score} fields`}
                        </span>
                      </div>
                      {!isNameOnly && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {getContactSummary(contact)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={selectedContacts.size === 0 || isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {selectedContacts.size > 0 ? `${selectedContacts.size} contacts` : 'selected'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}