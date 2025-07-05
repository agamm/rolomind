import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { ContactList } from '@/components/contact/list'
import type { Contact } from '@/types/contact'

// Mock dependencies
vi.mock('@/hooks/use-pagination', () => ({
  usePagination: (items: any[]) => ({
    paginatedItems: items,
    currentPage: 1,
    totalPages: 1,
    goToPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
  })
}))

vi.mock('@/hooks/use-local-contacts', () => ({
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
  deleteContacts: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock all the UI components that aren't essential for rerender testing
vi.mock('@/components/contact/card', () => ({
  ContactCard: ({ contact, onEdit, onDelete, showCheckbox, isSelected, onSelectToggle }: any) => (
    <div data-testid={`contact-${contact.id}`}>
      <span data-testid={`contact-name-${contact.id}`}>{contact.name}</span>
      <span data-testid={`contact-company-${contact.id}`}>{contact.company || ''}</span>
    </div>
  )
}))

vi.mock('@/components/contact/search-input', () => ({
  SearchInput: ({ onSearch }: any) => (
    <input data-testid="search-input" onChange={(e) => onSearch(e.target.value)} />
  )
}))

vi.mock('@/components/contact/edit-modal', () => ({
  EditContactModal: () => null
}))

vi.mock('@/components/contact/bulk-edit-modal', () => ({
  BulkEditModal: () => null
}))

vi.mock('@/components/pagination-controls', () => ({
  PaginationControls: () => null
}))

vi.mock('@/components/delete/delete-confirmation-dialog', () => ({
  DeleteConfirmationDialog: () => null
}))

vi.mock('@/components/delete/bulk-delete-dialog', () => ({
  BulkDeleteDialog: () => null
}))

vi.mock('@/components/export/export-query-button', () => ({
  ExportQueryButton: () => null
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}))

describe('Contact List Rerendering', () => {
  const createTestContact = (id: string, name: string, company: string = 'Test Company'): Contact => ({
    id,
    name,
    company,
    role: 'Test Role',
    location: 'Test Location',
    contactInfo: {
      phones: ['555-1234'],
      emails: [`${name.toLowerCase().replace(' ', '.')}@example.com`],
      otherUrls: []
    },
    notes: 'Test notes',
    source: 'manual',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  it('should rerender with updated contact after successful update', () => {
    const originalContact = createTestContact('1', 'Original Name')
    const updatedContact = createTestContact('1', 'Updated Name')
    
    const { rerender } = render(
      <ContactList contacts={[originalContact]} />
    )

    // Verify original contact is displayed
    expect(screen.getByTestId('contact-name-1')).toHaveTextContent('Original Name')

    // Rerender with updated contact
    rerender(<ContactList contacts={[updatedContact]} />)

    // Verify updated contact is displayed
    expect(screen.getByTestId('contact-name-1')).toHaveTextContent('Updated Name')
  })

  it('should rerender with contact removed after successful delete', () => {
    const contact1 = createTestContact('1', 'Contact 1')
    const contact2 = createTestContact('2', 'Contact 2')
    const initialContacts = [contact1, contact2]
    
    const { rerender } = render(
      <ContactList contacts={initialContacts} />
    )

    // Verify both contacts are displayed
    expect(screen.getByTestId('contact-1')).toBeInTheDocument()
    expect(screen.getByTestId('contact-2')).toBeInTheDocument()
    expect(screen.getByText('All Contacts (2)')).toBeInTheDocument()

    // Rerender with one contact removed
    rerender(<ContactList contacts={[contact2]} />)

    // Verify only contact2 remains
    expect(screen.queryByTestId('contact-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('contact-2')).toBeInTheDocument()
    expect(screen.getByText('All Contacts (1)')).toBeInTheDocument()
  })

  it('should rerender with multiple contacts removed after bulk delete', () => {
    const contacts = [
      createTestContact('1', 'Contact 1'),
      createTestContact('2', 'Contact 2'),
      createTestContact('3', 'Contact 3'),
      createTestContact('4', 'Contact 4')
    ]
    
    const { rerender } = render(
      <ContactList contacts={contacts} />
    )

    // Verify all contacts are displayed
    contacts.forEach(contact => {
      expect(screen.getByTestId(`contact-${contact.id}`)).toBeInTheDocument()
    })
    expect(screen.getByText('All Contacts (4)')).toBeInTheDocument()

    // Rerender with some contacts removed (keep 1 and 4)
    const remainingContacts = [contacts[0], contacts[3]]
    rerender(<ContactList contacts={remainingContacts} />)

    // Verify correct contacts remain
    expect(screen.getByTestId('contact-1')).toBeInTheDocument()
    expect(screen.queryByTestId('contact-2')).not.toBeInTheDocument()
    expect(screen.queryByTestId('contact-3')).not.toBeInTheDocument()
    expect(screen.getByTestId('contact-4')).toBeInTheDocument()
    expect(screen.getByText('All Contacts (2)')).toBeInTheDocument()
  })

  it('should rerender with new contacts after import', () => {
    const existingContacts = [createTestContact('1', 'Existing Contact')]
    const importedContacts = [
      createTestContact('2', 'Imported Contact 1'),
      createTestContact('3', 'Imported Contact 2')
    ]
    const allContacts = [...existingContacts, ...importedContacts]
    
    const { rerender } = render(
      <ContactList contacts={existingContacts} />
    )

    // Verify only existing contact is displayed
    expect(screen.getByTestId('contact-1')).toBeInTheDocument()
    expect(screen.queryByTestId('contact-2')).not.toBeInTheDocument()
    expect(screen.getByText('All Contacts (1)')).toBeInTheDocument()

    // Rerender with all contacts (simulating import completion)
    rerender(<ContactList contacts={allContacts} />)

    // Verify all contacts are now displayed
    expect(screen.getByTestId('contact-1')).toBeInTheDocument()
    expect(screen.getByTestId('contact-2')).toBeInTheDocument()
    expect(screen.getByTestId('contact-3')).toBeInTheDocument()
    expect(screen.getByText('All Contacts (3)')).toBeInTheDocument()
  })

  it('should show empty state when all contacts are deleted', () => {
    const contact = createTestContact('1', 'Last Contact')
    
    const { rerender } = render(
      <ContactList contacts={[contact]} />
    )

    // Verify contact is displayed
    expect(screen.getByTestId('contact-1')).toBeInTheDocument()
    expect(screen.queryByText('No contacts yet')).not.toBeInTheDocument()

    // Rerender with empty contacts array
    rerender(<ContactList contacts={[]} />)

    // Verify empty state is shown
    expect(screen.queryByTestId('contact-1')).not.toBeInTheDocument()
    expect(screen.getByText('No contacts yet')).toBeInTheDocument()
    expect(screen.getByText('All Contacts (0)')).toBeInTheDocument()
  })

  it('should maintain contact count display accuracy', () => {
    const contacts = [
      createTestContact('1', 'Contact 1'),
      createTestContact('2', 'Contact 2'),
      createTestContact('3', 'Contact 3')
    ]
    
    const { rerender } = render(
      <ContactList contacts={contacts} />
    )

    // Verify initial count
    expect(screen.getByText('All Contacts (3)')).toBeInTheDocument()

    // Update after deletion
    const remainingContacts = [contacts[0], contacts[2]]
    rerender(<ContactList contacts={remainingContacts} />)

    // Verify updated count
    expect(screen.getByText('All Contacts (2)')).toBeInTheDocument()

    // Update after adding more
    const expandedContacts = [...remainingContacts, createTestContact('4', 'New Contact')]
    rerender(<ContactList contacts={expandedContacts} />)

    // Verify count reflects addition
    expect(screen.getByText('All Contacts (3)')).toBeInTheDocument()
  })
})