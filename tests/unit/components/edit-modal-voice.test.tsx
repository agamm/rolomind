import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditContactModal } from '@/components/contact/edit-modal';
import type { Contact } from '@/types/contact';

// Mock dependencies
vi.mock('@/hooks/use-voice-recorder', () => ({
  useVoiceRecorder: vi.fn()
}));

vi.mock('@/hooks/use-api-keys-status', () => ({
  useApiKeysStatus: vi.fn()
}));

vi.mock('@/components/ui/voice-recorder', () => ({
  VoiceRecorder: () => <div data-testid="voice-recorder">Voice Recorder Component</div>
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}));

const { useApiKeysStatus } = await import('@/hooks/use-api-keys-status');
const { useVoiceRecorder } = await import('@/hooks/use-voice-recorder');

const mockContact: Contact = {
  id: 'test-contact-1',
  name: 'Test Contact',
  company: 'Test Company',
  role: 'Test Role',
  location: 'Test Location',
  notes: 'Test notes',
  contactInfo: {
    emails: ['test@example.com'],
    phones: ['123-456-7890'],
    linkedinUrl: 'https://linkedin.com/in/test',
    otherUrls: []
  },
  source: 'manual',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('EditContactModal - Voice Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for useVoiceRecorder
    vi.mocked(useVoiceRecorder).mockReturnValue({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      audioLevel: 0,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      pauseRecording: vi.fn(),
      resumeRecording: vi.fn(),
      error: null
    });
  });

  it('should show voice recorder when OpenAI key is available', async () => {
    vi.mocked(useApiKeysStatus).mockReturnValue({
      hasOpenrouterKey: true,
      hasOpenaiKey: true,
      isLoading: false,
      error: null
    });

    render(
      <EditContactModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    expect(screen.queryByText('Voice editing requires an OpenAI API key')).not.toBeInTheDocument();
  });

  it('should show warning message when OpenAI key is not available', async () => {
    vi.mocked(useApiKeysStatus).mockReturnValue({
      hasOpenrouterKey: true,
      hasOpenaiKey: false,
      isLoading: false,
      error: null
    });

    render(
      <EditContactModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByTestId('voice-recorder')).not.toBeInTheDocument();
    expect(screen.getByText('Voice editing requires an OpenAI API key.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configure AI Keys →' })).toHaveAttribute('href', '/dashboard/ai-keys');
  });

  it('should show voice recorder while API keys are loading', async () => {
    vi.mocked(useApiKeysStatus).mockReturnValue({
      hasOpenrouterKey: false,
      hasOpenaiKey: false,
      isLoading: true,
      error: null
    });

    render(
      <EditContactModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // While loading, it should show the voice recorder (default behavior)
    expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    expect(screen.queryByText('Voice editing requires an OpenAI API key')).not.toBeInTheDocument();
  });

  it('should show warning with correct link when no OpenAI key', async () => {
    vi.mocked(useApiKeysStatus).mockReturnValue({
      hasOpenrouterKey: true,
      hasOpenaiKey: false,
      isLoading: false,
      error: null
    });

    render(
      <EditContactModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const warningText = screen.getByText('Voice editing requires an OpenAI API key.');
    const configLink = screen.getByRole('link', { name: 'Configure AI Keys →' });
    
    expect(warningText).toBeInTheDocument();
    expect(configLink).toHaveAttribute('href', '/dashboard/ai-keys');
  });

  it('should prioritize showing voice recorder over warning when both loading and has key', async () => {
    vi.mocked(useApiKeysStatus).mockReturnValue({
      hasOpenrouterKey: true,
      hasOpenaiKey: true,
      isLoading: true,
      error: null
    });

    render(
      <EditContactModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // Should show voice recorder and no warning when has key (even while loading)
    expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    expect(screen.queryByText('Voice editing requires an OpenAI API key')).not.toBeInTheDocument();
  });

  it('should handle mixed key states correctly', async () => {
    vi.mocked(useApiKeysStatus).mockReturnValue({
      hasOpenrouterKey: false,
      hasOpenaiKey: true,
      isLoading: false,
      error: null
    });

    render(
      <EditContactModal
        contact={mockContact}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // Should show voice recorder when has OpenAI key regardless of OpenRouter key
    expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    expect(screen.queryByText('Voice editing requires an OpenAI API key')).not.toBeInTheDocument();
  });
});