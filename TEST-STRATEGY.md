# 80/20 Test Strategy for OpenRouter Migration

## Overview
This document outlines a production-ready test strategy focusing on the 80/20 principle - testing the 20% of features that provide 80% of the value and risk coverage.

## Critical Test Areas

### 1. Core AI Query Functionality
**Priority: CRITICAL**
- Test searching "CEOs in Israel" returns >20 results
- Test chunked streaming for >500 contacts
- Test summary generation after search completion
- Test temporal queries (e.g., "contacts before 2024")

```typescript
// Test file: __tests__/api/query-contacts.test.ts
describe('Query Contacts with OpenRouter', () => {
  it('should find CEOs in Israel', async () => {
    const response = await fetch('/api/query-contacts', {
      method: 'POST',
      body: JSON.stringify({
        query: 'CEOs in Israel',
        contacts: mockContacts
      })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.matches.length).toBeGreaterThan(0);
  });
});
```

### 2. Contact Import & Normalization
**Priority: HIGH**
- Test CSV import with LLM normalization
- Test duplicate detection during import
- Test various CSV formats (LinkedIn, Google, custom)

```typescript
// Test file: __tests__/api/import.test.ts
describe('Import with OpenRouter', () => {
  it('should normalize CSV data correctly', async () => {
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('type', 'linkedin');
    
    const response = await fetch('/api/import', {
      method: 'POST',
      body: formData
    });
    expect(response.status).toBe(200);
  });
});
```

### 3. Contact Merging
**Priority: HIGH**
- Test intelligent contact merging
- Test duplicate field removal
- Test preservation of important data

```typescript
// Test file: __tests__/api/merge-contacts.test.ts
describe('Merge Contacts with OpenRouter', () => {
  it('should merge contacts intelligently', async () => {
    const response = await fetch('/api/merge-contacts', {
      method: 'POST',
      body: JSON.stringify({
        existing: existingContact,
        incoming: incomingContact
      })
    });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.mergedContact.name).toBeTruthy();
  });
});
```

### 4. Error Handling & Rate Limits
**Priority: HIGH**
- Test OpenRouter API key validation
- Test rate limit handling
- Test fallback behavior on errors

```typescript
// Test file: __tests__/lib/openrouter-config.test.ts
describe('OpenRouter Configuration', () => {
  it('should handle missing API key', () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(() => openrouter('model')).toThrow();
  });
  
  it('should handle rate limits gracefully', async () => {
    // Mock rate limit response
    const response = await handleRateLimitedRequest();
    expect(response.status).toBe(429);
  });
});
```

### 5. Voice Transcription (Optional Feature)
**Priority: MEDIUM**
- Test audio file upload
- Test transcription with OpenRouter
- Test contact update from voice

## Integration Test Suite

```typescript
// __tests__/integration/full-flow.test.ts
describe('Full Contact Management Flow', () => {
  it('should handle complete user journey', async () => {
    // 1. Import contacts
    const importResponse = await importContacts(csvFile);
    expect(importResponse.ok).toBe(true);
    
    // 2. Query contacts
    const queryResponse = await queryContacts('CEOs in Israel');
    expect(queryResponse.matches.length).toBeGreaterThan(0);
    
    // 3. Generate summary
    const summaryResponse = await generateSummary(queryResponse.matches);
    expect(summaryResponse.summary).toBeTruthy();
  });
});
```

## Performance Tests

```typescript
// __tests__/performance/streaming.test.ts
describe('Streaming Performance', () => {
  it('should handle 1000+ contacts efficiently', async () => {
    const startTime = Date.now();
    const response = await queryLargeDataset(1000);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(30000); // 30 seconds
    expect(response.chunks).toBeGreaterThan(1);
  });
});
```

## Manual Testing Checklist

### Pre-Production Checklist
- [ ] Verify OPENROUTER_API_KEY is set in production
- [ ] Test all AI features with production API key
- [ ] Monitor OpenRouter dashboard for usage/errors
- [ ] Test with different model availability scenarios

### Browser Testing
1. Search for "CEOs in Israel" and verify:
   - Loading state appears
   - Results stream in chunks
   - Summary generates after completion
   
2. Import a CSV file and verify:
   - Progress modal shows
   - Duplicates are detected
   - Merge confirmation works

3. Edit a contact with voice:
   - Record audio
   - Verify transcription
   - Check contact updates

## Monitoring & Observability

### Key Metrics to Track
1. **API Response Times**
   - Query contacts: <5s average
   - Generate summary: <3s average
   - Contact merge: <2s average

2. **Error Rates**
   - OpenRouter API errors: <1%
   - Rate limit errors: <0.1%

3. **Usage Metrics**
   - Tokens used per request
   - Cost per operation
   - Model availability

### Logging Requirements
```typescript
// Add to each API route
console.log('OpenRouter request', {
  model: modelId,
  operation: 'query-contacts',
  timestamp: new Date().toISOString(),
  userId: session?.userId
});
```

## Rollback Plan

If issues occur in production:

1. **Quick Rollback**
   - Keep old AI SDK dependencies in package.json (commented)
   - Switch back to direct Anthropic/OpenAI calls
   - Redeploy with original configuration

2. **Feature Flags** (Optional)
   ```typescript
   const useOpenRouter = process.env.USE_OPENROUTER === 'true';
   const model = useOpenRouter 
     ? openrouter('anthropic/claude-3.5-sonnet')
     : anthropic('claude-3-5-sonnet-20241022');
   ```

## Cost Optimization

### Model Selection Strategy
- Use `claude-3-haiku` for simple tasks (CSV normalization, voice processing)
- Use `claude-3.5-sonnet` for complex tasks (contact search, merging)
- Monitor costs via OpenRouter dashboard

### Caching Strategy
- Cache common queries for 5 minutes
- Cache summaries for 15 minutes
- Implement request deduplication

## Security Considerations

1. **API Key Security**
   - Never expose OPENROUTER_API_KEY in client code
   - Use environment variables only
   - Rotate keys regularly

2. **Input Validation**
   - Validate all user inputs before AI processing
   - Limit query lengths to prevent abuse
   - Sanitize file uploads

## Recommended Test Implementation Order

1. **Week 1**: Core API integration tests
2. **Week 2**: Performance and error handling tests
3. **Week 3**: Full integration testing
4. **Week 4**: Production monitoring setup

This 80/20 approach focuses on testing the most critical paths while keeping the test suite maintainable and execution time reasonable.