const { OpenCodeTransformer } = require('../transformers/opencode-transformer');
const { BaseTransformer } = require('../transformers/base-transformer');

jest.mock('../transformers/base-transformer');

describe('OpenCodeTransformer', () => {
  let transformer;
  let mockLogger;

  beforeEach(() => {
    mockLogger = { debug: jest.fn() };
    BaseTransformer.mockImplementation(() => ({}));
    transformer = new OpenCodeTransformer(mockLogger);
  });

  describe('getToolName', () => {
    it('returns opencode', () => {
      expect(transformer.getToolName()).toBe('opencode');
    });
  });

  describe('getFileExtension', () => {
    it('returns .txt', () => {
      expect(transformer.getFileExtension()).toBe('.txt');
    });
  });

  describe('transformAgent', () => {
    it('transforms full agent data successfully', async () => {
      const agentData = {
        metadata: { name: 'Test', description: 'Desc', tools: ['tool1'], version: '1.0', category: 'cat' },
        mission: { summary: '**Summary**', boundaries: { handles: '*Handles*', doesNotHandle: '*No*', collaboratesOn: '*Collab*' }, expertise: [{ name: 'Exp1', description: '*Desc1*' }] },
        responsibilities: [{ title: 'Resp1', description: '*Desc1*', priority: 'high' }],
        examples: [{ title: 'Ex1', antiPattern: { code: 'bad', language: 'js', issues: ['issue1'] }, bestPractice: { code: 'good', language: 'js', benefits: ['benefit1'] } }],
        qualityStandards: { codeQuality: [{ name: 'Std1', description: '*Desc1*', enforcement: 'required' }], testing: { unit: { minimum: 80 } } },
        integrationProtocols: { handoffFrom: [{ agent: 'Agent1', context: '*Ctx1*' }], handoffTo: [{ agent: 'Agent2', deliverables: '*Deliv1*' }] },
        delegationCriteria: { whenToUse: ['Use1'], whenToDelegate: [{ agent: 'DelAgent', triggers: ['Trig1'] }] },
      };

      const result = await transformer.transformAgent(agentData);
      expect(result).toContain('AGENT: TEST');
      expect(result).toContain('MISSION:\nSummary');
      expect(result).toContain('CORE RESPONSIBILITIES:');
      expect(result).toContain('CODE EXAMPLES:');
      expect(result).toContain('QUALITY STANDARDS:');
      expect(result).toContain('INTEGRATION:');
      expect(result).toContain('DELEGATION RULES:');
    });

    it('handles minimal agent data', async () => {
      const minimalData = {
        metadata: { name: 'Minimal', description: 'Desc', tools: [], version: '1.0', category: 'cat' },
        mission: { summary: 'Summary' },
        responsibilities: [],
      };
      const result = await transformer.transformAgent(minimalData);
      expect(result).toContain('AGENT: MINIMAL');
      expect(result).toContain('MISSION:\nSummary');
      expect(result).toContain('CORE RESPONSIBILITIES:');
    });

    it('handles missing optional sections', async () => {
      const data = {
        metadata: { name: 'Test', description: 'Desc', tools: [], version: '1.0', category: 'cat' },
        mission: { summary: 'Summary' },
        responsibilities: [],
      };
      const result = await transformer.transformAgent(data);
      expect(result).not.toContain('CODE EXAMPLES:');
      expect(result).not.toContain('QUALITY STANDARDS:');
    });

    it('strips markdown correctly', () => {
      expect(transformer.stripMarkdown('**bold** *italic* `code` [link](url) # Header > Quote ✅')).toBe('bold italic code link Header Quote');
    });

    it('handles edge case: empty strings', () => {
      expect(transformer.stripMarkdown('')).toBe('');
    });
  });

  describe('transformCommand', () => {
    it('transforms full command data successfully', async () => {
      const commandData = {
        metadata: { name: 'TestCmd', description: 'Desc', version: '1.0', category: 'cat' },
        mission: { summary: 'Mission' },
        workflow: { phases: [{ order: 1, name: 'Phase1', steps: [{ order: 1, title: 'Step1', description: 'Desc1', delegation: { agent: 'Agent1' } }] }] },
        expectedInput: { format: 'JSON', sections: [{ name: 'Sec1', required: true, description: 'Desc1' }] },
        expectedOutput: { format: 'Markdown', structure: [{ name: 'Out1', description: 'Desc1' }] },
      };

      const result = await transformer.transformCommand(commandData);
      expect(result).toContain('COMMAND: /TestCmd');
      expect(result).toContain('PURPOSE:\nMission');
      expect(result).toContain('WORKFLOW:');
      expect(result).toContain('EXPECTED INPUT:');
      expect(result).toContain('EXPECTED OUTPUT:');
    });

    it('handles minimal command data', async () => {
      const minimalData = {
        metadata: { name: 'MinimalCmd', description: 'Desc' },
        mission: { summary: 'Summary' },
      };
      const result = await transformer.transformCommand(minimalData);
      expect(result).toContain('COMMAND: /MinimalCmd');
      expect(result).toContain('PURPOSE:\nSummary');
    });

    it('handles missing optional sections', async () => {
      const data = {
        metadata: { name: 'Test', description: 'Desc' },
        mission: { summary: 'Summary' },
      };
      const result = await transformer.transformCommand(data);
      expect(result).not.toContain('WORKFLOW:');
      expect(result).not.toContain('EXPECTED INPUT:');
    });
  });
});