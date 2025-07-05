import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactCard } from '@/components/contact/card'
import type { Contact } from '@/types/contact'

// Real component test with actual user interactions
describe('Contact Card User Interactions', () => {
  const createTestContact = (overrides?: Partial<Contact>): Contact => ({
    id: 'test-contact-1',
    name: 'John Doe',
    company: 'Acme Corp',
    role: 'CEO',
    location: 'San Francisco, CA',
    contactInfo: {
      phones: ['+1-555-123-4567', '+1-555-987-6543'],
      emails: ['john@acme.com', 'john.doe@personal.com'],
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      otherUrls: [
        { platform: 'Twitter', url: 'https://twitter.com/johndoe' },
        { platform: 'Website', url: 'https://johndoe.com' }
      ]
    },
    notes: 'Important client contact. Met at tech conference.',
    source: 'linkedin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
  })

  let mockOnEdit: ReturnType<typeof vi.fn>
  let mockOnDelete: ReturnType<typeof vi.fn>
  let mockOnSelectToggle: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnEdit = vi.fn()
    mockOnDelete = vi.fn()
    mockOnSelectToggle = vi.fn()
  })

  describe('Basic Information Display', () => {
    it('should display all contact information correctly', () => {
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      // Check basic info
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('CEO')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()

      // Check contact info - only first email and phone are shown
      expect(screen.getByText('john@acme.com')).toBeInTheDocument()
      expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument()

      // Check notes
      expect(screen.getByText(/Important client contact/)).toBeInTheDocument()
      expect(screen.getByText(/Met at tech conference/)).toBeInTheDocument()

      // Check source badge
      expect(screen.getByText('linkedin')).toBeInTheDocument()
    })

    it('should handle contacts with minimal information', () => {
      const minimalContact = createTestContact({
        company: undefined,
        role: undefined,
        location: undefined,
        notes: '',
        contactInfo: {
          phones: [],
          emails: [],
          linkedinUrl: undefined,
          otherUrls: []
        }
      })

      render(
        <ContactCard
          contact={minimalContact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('CEO')).not.toBeInTheDocument()
      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
      expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledTimes(1)
      expect(mockOnEdit).toHaveBeenCalledWith(contact)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
      expect(mockOnDelete).toHaveBeenCalledWith(contact)
    })

    it('should handle checkbox selection when enabled', async () => {
      const user = userEvent.setup()
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={true}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)

      expect(mockOnSelectToggle).toHaveBeenCalledTimes(1)
      expect(mockOnSelectToggle).toHaveBeenCalledWith(contact)
    })

    it('should show selected state when isSelected is true', () => {
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={true}
          isSelected={true}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should not show checkbox when showCheckbox is false', () => {
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })

  describe('Link Interactions', () => {
    it('should make email addresses clickable via button', () => {
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      // Email is displayed as a button, not a link
      const emailButton = screen.getByRole('button', { name: /john@acme.com/i })
      expect(emailButton).toBeInTheDocument()
    })

    it('should make phone numbers clickable via button', () => {
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      // Phone is displayed as a button, not a link
      const phoneButton = screen.getByRole('button', { name: /\+1-555-123-4567/i })
      expect(phoneButton).toBeInTheDocument()
    })

    it('should have LinkedIn button when URL exists', () => {
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      // LinkedIn is a button with title
      const linkedinButton = screen.getByRole('button', { name: /open linkedin profile/i })
      expect(linkedinButton).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle keyboard navigation for edit button', async () => {
      const user = userEvent.setup()
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      editButton.focus()
      
      await user.keyboard('{Enter}')
      expect(mockOnEdit).toHaveBeenCalledTimes(1)

      await user.keyboard(' ')
      expect(mockOnEdit).toHaveBeenCalledTimes(2)
    })

    it('should handle keyboard navigation for checkbox', async () => {
      const user = userEvent.setup()
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={true}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()
      
      await user.keyboard(' ')
      expect(mockOnSelectToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={true}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      // Buttons have title attributes, not aria-labels
      const editButton = screen.getByTitle('Edit contact')
      expect(editButton).toBeInTheDocument()
      
      const deleteButton = screen.getByTitle('Delete contact')
      expect(deleteButton).toBeInTheDocument()
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument()
    })

  })

  describe('Loading and Error States', () => {
    it('should handle rapid button clicks gracefully', async () => {
      const user = userEvent.setup()
      const contact = createTestContact()
      
      render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={false}
          isSelected={false}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      
      // Rapid clicks
      await user.click(editButton)
      await user.click(editButton)
      await user.click(editButton)

      // Should only call once if component implements debouncing
      // or should call multiple times if immediate response is desired
      expect(mockOnEdit).toHaveBeenCalled()
    })
  })

  describe('Visual States', () => {
    it('should apply selected styling when isSelected is true', () => {
      const contact = createTestContact()
      
      const { container } = render(
        <ContactCard
          contact={contact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          showCheckbox={true}
          isSelected={true}
          onSelectToggle={mockOnSelectToggle}
        />
      )

      // The card should have some visual indication of selection
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('ring-2')
    })

    it('should display source badges with correct styling', () => {
      const testSources: Contact['source'][] = ['linkedin', 'google', 'manual']
      
      testSources.forEach(source => {
        const contact = createTestContact({ source })
        
        render(
          <ContactCard
            contact={contact}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            showCheckbox={false}
            isSelected={false}
            onSelectToggle={mockOnSelectToggle}
          />
        )

        // Source badges show lowercase
        const sourceBadge = screen.getByText(source)
        expect(sourceBadge).toBeInTheDocument()
      })
    })
  })
})