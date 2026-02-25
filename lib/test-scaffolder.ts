import { callGPT4o } from './azure-openai';
import { RefactoredModule } from '@/types';

export async function generateTestScaffold(module: RefactoredModule): Promise<string> {
  const systemPrompt = `You are a senior test engineer specializing in automated test generation.
Your job is to create pytest test scaffolds for refactored code based on the original business intent.

Generate a complete test file that includes:
1. One happy path test that covers the main business logic
2. Edge case tests inferred from the intent description
3. Proper test structure with setup/teardown
4. Mock data where appropriate
5. Clear TODO comments for assertion implementation

Requirements:
- Use pytest framework
- Include descriptive test names that reflect business logic
- Add type hints and docstrings
- Use meaningful test data
- Include both positive and negative test cases where applicable
- Mark areas that need human review with # TODO comments

Output only the Python test file content. No preamble, no explanation, no markdown fences.`;

  const userPrompt = `Original Intent: ${module.intentUsedAsGuardrail}
Target Language: ${module.targetLanguage}
Original Code:
${module.originalCode}

Refactored Code:
${module.refactoredCode}

Generate comprehensive pytest tests for this refactored module.`;

  try {
    const testContent = await callGPT4o(systemPrompt, userPrompt);
    
    return testContent;
  } catch (error: any) {
    console.error('Test scaffold generation failed:', error);
    
    // Return basic scaffold on error
    return `import pytest
from unittest.mock import Mock

# Generated tests for ${module.moduleId}
# TODO: Add real assertions based on business logic

class Test${module.moduleId.replace(/[^a-zA-Z0-9]/g, '')}:
    """Test cases for ${module.moduleId}"""
    
    def setup_method(self):
        """Set up test environment"""
        pass
    
    def teardown_method(self):
        """Clean up test environment"""
        pass
    
    def test_main_functionality(self):
        """Test main business logic"""
        # TODO: Implement happy path test
        assert True, "Happy path test not implemented"
    
    def test_edge_cases(self):
        """Test edge cases and error conditions"""
        # TODO: Implement edge case tests
        assert True, "Edge case tests not implemented"

if __name__ == "__main__":
    pytest.main([__file__])`;
  }
}
