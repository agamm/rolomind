"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Search, Users, FileX } from "lucide-react";
import { CONTACT_LIMITS, findEmptyContacts, findMinimalContacts, findContactsWithoutNotes, getContactTokenCount, isApproachingContactLimit } from "@/lib/config";
import { Contact } from "@/types/contact";

interface ContactLimitWarningProps {
  contacts: Contact[];
  onSearchEmpty?: () => void;
  onSearchMinimal?: () => void;
  onSearchWithoutNotes?: () => void;
}

export function ContactLimitWarning({ 
  contacts, 
  onSearchEmpty,
  onSearchMinimal,
  onSearchWithoutNotes
}: ContactLimitWarningProps) {
  const totalContacts = contacts.length;
  const emptyContacts = findEmptyContacts(contacts).length;
  const minimalContacts = findMinimalContacts(contacts).length;
  const contactsWithoutNotes = findContactsWithoutNotes(contacts).length;
  const oversizedContacts = contacts.filter(c => getContactTokenCount(c) > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT).length;
  const percentUsed = totalContacts / CONTACT_LIMITS.MAX_CONTACTS;
  const isNearLimit = isApproachingContactLimit(totalContacts);
  const isAtLimit = totalContacts >= CONTACT_LIMITS.MAX_CONTACTS;
  
  if (!isNearLimit && !isAtLimit && oversizedContacts === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {isAtLimit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Contact Limit Reached</AlertTitle>
          <AlertDescription>
            <p className="mb-3">
              You&apos;ve reached the maximum limit of {CONTACT_LIMITS.MAX_CONTACTS.toLocaleString()} contacts. 
              Please delete some contacts to add new ones.
            </p>
            <div className="flex flex-col gap-2">
              {emptyContacts > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSearchEmpty}
                    className="gap-2"
                  >
                    <Search className="h-3 w-3" />
                    Search for {emptyContacts} empty contacts
                  </Button>
                  <span className="text-sm text-muted-foreground">then delete them</span>
                </div>
              )}
              {minimalContacts > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSearchMinimal}
                    className="gap-2"
                  >
                    <Users className="h-3 w-3" />
                    Find minimal contacts
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {minimalContacts} contacts with minimal data
                  </span>
                </div>
              )}
              {contactsWithoutNotes > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSearchWithoutNotes}
                    className="gap-2"
                  >
                    <FileX className="h-3 w-3" />
                    Find contacts without notes
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {contactsWithoutNotes} contacts
                  </span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!isAtLimit && isNearLimit && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Approaching Contact Limit</AlertTitle>
          <AlertDescription>
            <p className="mb-3">
              You have {totalContacts.toLocaleString()} of {CONTACT_LIMITS.MAX_CONTACTS.toLocaleString()} contacts 
              ({(percentUsed * 100).toFixed(1)}% used).
            </p>
            {emptyContacts > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Free up space by deleting {emptyContacts} empty contact{emptyContacts > 1 ? 's' : ''}:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSearchEmpty}
                    className="gap-2"
                  >
                    <Search className="h-3 w-3" />
                    Find empty contacts
                  </Button>
                  {minimalContacts > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSearchMinimal}
                      className="gap-2"
                    >
                      <Users className="h-3 w-3" />
                      Find minimal contacts ({minimalContacts})
                    </Button>
                  )}
                  {contactsWithoutNotes > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSearchWithoutNotes}
                      className="gap-2"
                    >
                      <FileX className="h-3 w-3" />
                      Without notes ({contactsWithoutNotes})
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Consider removing contacts with minimal information:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {minimalContacts > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSearchMinimal}
                      className="gap-2"
                    >
                      <Users className="h-3 w-3" />
                      Find {minimalContacts} minimal contacts
                    </Button>
                  )}
                  {contactsWithoutNotes > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSearchWithoutNotes}
                      className="gap-2"
                    >
                      <FileX className="h-3 w-3" />
                      Find {contactsWithoutNotes} without notes
                    </Button>
                  )}
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {oversizedContacts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Oversized Contacts Detected</AlertTitle>
          <AlertDescription>
            <p className="mb-3">
              {oversizedContacts} contact{oversizedContacts > 1 ? 's' : ''} exceed 
              the {CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} token limit and may cause issues with AI processing.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // This would trigger a search/filter for oversized contacts
                if (onSearchEmpty) {
                  onSearchEmpty(); // Reuse the search function
                }
              }}
              className="gap-2"
            >
              <Search className="h-3 w-3" />
              View oversized contacts
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Storage indicator component
export function StorageIndicator({ contacts }: { contacts: Contact[] }) {
  const totalContacts = contacts.length;
  const percentUsed = (totalContacts / CONTACT_LIMITS.MAX_CONTACTS) * 100;
  const isNearLimit = isApproachingContactLimit(totalContacts);
  const isAtLimit = totalContacts >= CONTACT_LIMITS.MAX_CONTACTS;
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">Contacts:</span>
        <span className={isAtLimit ? "text-red-600 font-medium" : isNearLimit ? "text-amber-600" : ""}>
          {totalContacts.toLocaleString()}
        </span>
        <span className="text-muted-foreground">/ {CONTACT_LIMITS.MAX_CONTACTS.toLocaleString()}</span>
      </div>
      {percentUsed > 50 && (
        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              isAtLimit ? "bg-red-600" : 
              isNearLimit ? "bg-amber-600" : 
              "bg-primary"
            }`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}