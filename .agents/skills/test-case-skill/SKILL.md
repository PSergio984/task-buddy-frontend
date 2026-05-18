# Test Case Specification Skill

This skill defines the mandatory format for all system and integration test cases in this project.

## Naming Convention
- Format: `TC[Number]_[Type]_[Pos/Neg]_[ActionCamelCase]`
- Example: `TC001_Sys_Pos_RegisterNewUser`, `TC012_API_Neg_RateLimitTriggered`
- Numbers must be three-digit zero-padded (001, 002, etc.).

## Table Structure
Every test case must be represented in an 8-column Markdown table:

| TEST CASE NAME | POSITIVE/ NEGATIVE | TYPE | DESCRIPTION | PRE-CONDITION | TEST STEP NO. | TEST STEP DESCRIPTION | TEST EXPECTED RESULT |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

## Multi-Step Formatting Rules (Critical)
1. **First Row**: Contains all metadata (Name, Pos/Neg, Type, Description, Pre-condition) and the first step (Step 1).
2. **Subsequent Rows**: For test cases with multiple steps (Step 2, Step 3, etc.), the first 5 columns **MUST BE EMPTY**. Only "TEST STEP NO.", "TEST STEP DESCRIPTION", and "TEST EXPECTED RESULT" should contain data.
3. **Step Numbers**: Must be formatted exactly as `Step N` (e.g., `Step 1`, `Step 2`).

## Verification Criteria
- Use verifiable terms in expected results (e.g., "Toast appears", "Redirected to...", "RED alert is shown").
- Ensure type safety and boundary conditions are covered.
- Include both positive flows and negative/edge cases.
