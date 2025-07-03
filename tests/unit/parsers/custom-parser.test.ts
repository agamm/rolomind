import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as customParser from '@/app/api/import/parsers/custom-parser'

// Mock the llm-normalizer module
vi.mock('@/app/api/import/parsers/llm-normalizer', () => ({
  normalizeCsvBatch: vi.fn()
}))

describe('Custom Parser with LLM', () => {
  const customCsv = readFileSync(
    join(__dirname, '../../fixtures/custom.csv'),
    'utf-8'
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isApplicableParser', () => {
    it('should always return true as fallback parser', () => {
      expect(customParser.isApplicableParser()).toBe(true)
    })
  })

  describe('parse', () => {
    it('should call normalizeCsvBatch with parsed CSV data', async () => {
      const { normalizeCsvBatch } = await import('@/app/api/import/parsers/llm-normalizer')
      const mockNormalizeCsvBatch = vi.mocked(normalizeCsvBatch)
      
      // Set up mock to return normalized contacts
      mockNormalizeCsvBatch.mockResolvedValueOnce({
        normalized: [
          {
            id: 'test-1',
            name: 'Test Contact',
            company: 'Test Company',
            role: 'Test Role',
            contactInfo: { emails: [], phones: [], otherUrls: [] },
            source: 'manual',
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        errors: []
      })
      
      const result = await customParser.parse(customCsv)
      
      // Verify the LLM normalizer was called with correct parameters
      expect(mockNormalizeCsvBatch).toHaveBeenCalledTimes(1)
      expect(mockNormalizeCsvBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            'Full Name': expect.any(String)
          })
        ]),
        expect.arrayContaining(['Full Name', 'Business', 'Job Title'])
      )
      
      // Verify it returns what the normalizer returns
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Contact')
    })

    it('should handle empty CSV gracefully', async () => {
      const emptyCsv = 'Header1,Header2,Header3\n'
      const { normalizeCsvBatch } = await import('@/app/api/import/parsers/llm-normalizer')
      const mockNormalizeCsvBatch = vi.mocked(normalizeCsvBatch)
      
      const contacts = await customParser.parse(emptyCsv)
      
      // Should not call normalizer for empty CSV
      expect(mockNormalizeCsvBatch).not.toHaveBeenCalled()
      expect(contacts).toHaveLength(0)
    })

    it('should log warnings for CSV parsing errors', async () => {
      const malformedCsv = 'Header1,Header2\nValue1,Value2,ExtraValue'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { normalizeCsvBatch } = await import('@/app/api/import/parsers/llm-normalizer')
      const mockNormalizeCsvBatch = vi.mocked(normalizeCsvBatch)
      
      mockNormalizeCsvBatch.mockResolvedValueOnce({
        normalized: [],
        errors: []
      })
      
      await customParser.parse(malformedCsv)
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'CSV parsing warnings:',
        expect.any(Array)
      )
      
      consoleWarnSpy.mockRestore()
    })

    it('should log normalization errors', async () => {
      const { normalizeCsvBatch } = await import('@/app/api/import/parsers/llm-normalizer')
      const mockNormalizeCsvBatch = vi.mocked(normalizeCsvBatch)
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      mockNormalizeCsvBatch.mockResolvedValueOnce({
        normalized: [],
        errors: ['Row 1: LLM API error', 'Row 2: Invalid data']
      })
      
      await customParser.parse(customCsv)
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Normalization errors:',
        ['Row 1: LLM API error', 'Row 2: Invalid data']
      )
      
      consoleWarnSpy.mockRestore()
    })

    it('should pass through all normalized contacts from LLM', async () => {
      const { normalizeCsvBatch } = await import('@/app/api/import/parsers/llm-normalizer')
      const mockNormalizeCsvBatch = vi.mocked(normalizeCsvBatch)
      
      const mockContacts = Array.from({ length: 5 }, (_, i) => ({
        id: `test-${i}`,
        name: `Contact ${i}`,
        company: `Company ${i}`,
        role: 'Test Role',
        contactInfo: { emails: [], phones: [], otherUrls: [] },
        source: 'manual' as const,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      mockNormalizeCsvBatch.mockResolvedValueOnce({
        normalized: mockContacts,
        errors: []
      })
      
      const result = await customParser.parse(customCsv)
      
      expect(result).toEqual(mockContacts)
      expect(result).toHaveLength(5)
    })
  })
})