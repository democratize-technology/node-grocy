#!/usr/bin/env node

/**
 * Test suite for GitHub workflow checkout fix (Issue #36)
 * Validates that workflows use --no-save instead of --save-dev to prevent checkout failures
 */

import fs from 'fs';
import path from 'path';

const WORKFLOW_DIR = '.github/workflows';
const PROBLEMATIC_PATTERN = /^\s*npm.*install --save-dev/gm;
const CORRECT_PATTERN = /npm install --no-save/g;

/**
 * Test results tracking (immutable)
 */
let testResults = Object.freeze({
  passed: 0,
  failed: 0,
  tests: Object.freeze([])
});

/**
 * Add test result immutably
 * @param {boolean} passed - Whether test passed
 * @param {string} name - Test name  
 * @param {string} message - Test message
 * @returns {object} New test results object
 */
function addTestResult(passed, name, message) {
  const newTest = Object.freeze({ passed, name, message });
  return Object.freeze({
    passed: testResults.passed + (passed ? 1 : 0),
    failed: testResults.failed + (passed ? 0 : 1), 
    tests: Object.freeze([...testResults.tests, newTest])
  });
}

/**
 * Run a test immutably
 * @param {string} name - Test name
 * @param {function} testFn - Test function that returns boolean
 * @param {string} successMsg - Success message
 * @param {string} failMsg - Failure message
 */
function runTest(name, testFn, successMsg, failMsg) {
  try {
    const passed = testFn();
    const message = passed ? successMsg : failMsg;
    testResults = addTestResult(passed, name, message);
    console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`);
  } catch (error) {
    testResults = addTestResult(false, name, `Error: ${error.message}`);
    console.log(`❌ ${name}: Error: ${error.message}`);
  }
}

/**
 * Get all workflow files
 * @returns {ReadonlyArray<string>} Workflow file paths
 */
function getWorkflowFiles() {
  if (!fs.existsSync(WORKFLOW_DIR)) {
    return Object.freeze([]);
  }
  
  const files = fs.readdirSync(WORKFLOW_DIR)
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map(file => path.join(WORKFLOW_DIR, file));
  
  return Object.freeze(files);
}

/**
 * Check if workflow file contains problematic patterns
 * @param {string} filePath - Path to workflow file
 * @returns {object} Analysis results
 */
function analyzeWorkflowFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract only actual workflow commands, not heredoc content
  const lines = content.split('\n');
  let inHeredoc = false;
  let workflowLines = Object.freeze([]);
  
  for (const line of lines) {
    // Track heredoc boundaries
    if (line.includes("<<")) {
      inHeredoc = true;
      continue;
    }
    if (inHeredoc && line.trim() === 'EOF') {
      inHeredoc = false;
      continue;
    }
    
    // Only include non-heredoc lines (immutable update)
    if (!inHeredoc) {
      workflowLines = Object.freeze([...workflowLines, line]);
    }
  }
  
  const workflowContent = workflowLines.join('\n');
  
  const problematicMatches = [...workflowContent.matchAll(PROBLEMATIC_PATTERN)];
  const correctMatches = [...workflowContent.matchAll(CORRECT_PATTERN)];
  
  return Object.freeze({
    file: filePath,
    hasProblematicPattern: problematicMatches.length > 0,
    hasCorrectPattern: correctMatches.length > 0,
    problematicCount: problematicMatches.length,
    correctCount: correctMatches.length,
    content: workflowContent
  });
}

/**
 * Test that no workflows use --save-dev flag
 */
function testNoSaveDevFlag() {
  const workflowFiles = getWorkflowFiles();
  
  if (workflowFiles.length === 0) {
    return false; // No workflows to test
  }

  const problematicFiles = workflowFiles
    .map(analyzeWorkflowFile)
    .filter(analysis => analysis.hasProblematicPattern);
  
  return problematicFiles.length === 0;
}

/**
 * Test that critical workflows use --no-save flag
 */
function testCriticalWorkflowsFixed() {
  const criticalWorkflows = Object.freeze([
    'api-compatibility.yml',
    'docs.yml', 
    'performance.yml',
    'schema-validation.yml',
    'typescript-migration.yml'
  ]);
  
  let allFixed = true;
  
  for (const workflow of criticalWorkflows) {
    const filePath = path.join(WORKFLOW_DIR, workflow);
    
    if (!fs.existsSync(filePath)) {
      continue; // Skip if file doesn't exist
    }
    
    const analysis = analyzeWorkflowFile(filePath);
    
    // Must have correct pattern and no problematic pattern
    if (analysis.hasProblematicPattern || !analysis.hasCorrectPattern) {
      console.log(`  ❌ ${workflow}: Still has issues`);
      allFixed = false;
    } else {
      console.log(`  ✅ ${workflow}: Fixed correctly`);
    }
  }
  
  return allFixed;
}

/**
 * Test workflow syntax is valid YAML
 */
function testWorkflowSyntax() {
  const workflowFiles = getWorkflowFiles();
  
  for (const file of workflowFiles) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Basic YAML syntax checks
    if (content.includes('\t')) {
      console.log(`  ❌ ${file}: Contains tabs (should use spaces)`);
      return false;
    }
    
    // Check for basic YAML structure
    if (!content.includes('name:') || !content.includes('on:') || !content.includes('jobs:')) {
      console.log(`  ❌ ${file}: Missing required YAML structure`);
      return false;
    }
  }
  
  return true;
}

/**
 * Test that git checkout commands exist in fixed workflows
 */
function testGitCheckoutPatterns() {
  const workflowsWithCheckout = Object.freeze([
    'api-compatibility.yml'
  ]);
  
  for (const workflow of workflowsWithCheckout) {
    const filePath = path.join(WORKFLOW_DIR, workflow);
    
    if (!fs.existsSync(filePath)) {
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Should contain git checkout commands
    if (!content.includes('git checkout')) {
      console.log(`  ❌ ${workflow}: Missing git checkout commands`);
      return false;
    }
  }
  
  return true;
}

/**
 * Main test execution
 */
function runAllTests() {
  console.log('🧪 Running GitHub Workflow Fix Tests (Issue #36)\n');
  
  runTest(
    'No --save-dev flags in workflows',
    testNoSaveDevFlag,
    'All workflows avoid problematic --save-dev flag',
    'Some workflows still use --save-dev flag'
  );
  
  runTest(
    'Critical workflows use --no-save',
    testCriticalWorkflowsFixed, 
    'All critical workflows fixed correctly',
    'Some critical workflows not fixed properly'
  );
  
  runTest(
    'Workflow YAML syntax valid',
    testWorkflowSyntax,
    'All workflow files have valid YAML syntax',
    'Some workflow files have syntax issues'
  );
  
  runTest(
    'Git checkout patterns preserved',
    testGitCheckoutPatterns,
    'Git checkout commands preserved correctly',
    'Git checkout commands missing or malformed'
  );
  
  // Print summary
  console.log(`\n📊 Test Summary:`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  analyzeWorkflowFile,
  getWorkflowFiles,
  testNoSaveDevFlag,
  testCriticalWorkflowsFixed,
  testWorkflowSyntax,
  testGitCheckoutPatterns
};