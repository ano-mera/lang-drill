# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LangDrill** - A comprehensive TOEIC practice application built with Next.js 15, TypeScript, and Tailwind CSS. The app covers all TOEIC test parts (1-7) with AI-powered translations and audio support.

## Key Commands

### Development
```bash
npm run dev        # Runs development server on port 3001
npm run build      # Production build
npm run lint       # ESLint checking
npm start          # Start production server
```

### Question Generation
```bash
cd generator/scripts/generate

# Generate unified passages (recommended)
node generate-passages-unified.js --difficulty=hard --count=5

# Part-specific generation
node generate-part1-passages.js    # Photos
node generate-part2-passages.js    # Question-Response
node generate-part3-passages.js    # Conversations
node generate-part4-speeches.js    # Talks
node generate-part5-questions.js   # Incomplete Sentences
node generate-part6-questions.js   # Text Completion

# Test mode (no database updates)
node generate-passages-unified.js --test --count=3
```

### Audio File Management
**IMPORTANT**: All audio files must be uploaded to **Cloudflare R2**, not Vercel public directory.

```bash
# Upload Part0 audio files to R2
node scripts/upload-part0-to-r2.js

# Upload other part audio files
node scripts/upload-audio-to-r2.js

# Check R2 upload status
node scripts/check-blob-status.js
```

**Audio Storage Architecture**:
- **Local**: `/public/audio/part[0-7]/` - For development only
- **Production**: Cloudflare R2 storage with CDN
- **Access**: Files served via R2 public URLs
- **Upload**: Required after any audio generation

**Why R2?**
- Vercel has file size limits for static files
- R2 provides unlimited audio storage
- Better performance with global CDN
- Cost-effective for large audio collections

### Environment Setup

**OpenAI API Key**: Set as environment variable `OPENAI_API_KEY` (already configured globally).
No .env file needed - scripts use `process.env.OPENAI_API_KEY` via `generator/lib/openai-config.js`.

## Architecture Overview

### High-Level Structure
The app follows a question-based learning system where each TOEIC part has its own:
- Data file (`/src/data/part[1-7]-questions.json`)
- Component (`/src/components/Part[1-7]Component.tsx`)
- Generation script (`/generator/scripts/generate/`)

### Key Architectural Patterns

1. **Question Flow**
   - Questions loaded from JSON files
   - Displayed via part-specific components
   - User interactions tracked in localStorage
   - Results calculated and displayed immediately

2. **Translation System**
   - OpenAI GPT-4o integration for Japanese translations
   - Translations stored with questions (not fetched on-demand)
   - Fallback mechanisms for missing translations

3. **Audio Architecture** (Parts 1-4)
   - Audio files stored in `/public/audio/part[1-4]/`
   - Referenced by file paths in question data
   - Playback controlled by audio components

4. **State Management**
   - Local component state for UI interactions
   - Game settings stored in localStorage
   - Statistics tracked across sessions

### Important Files
- `/src/lib/types.ts` - Core TypeScript definitions
- `/src/utils/gameSettings.ts` - Game configuration management
- `/src/components/RandomPassage.tsx` - Main Part 7 component
- `/SPECIFICATION.md` - Detailed app specifications

### Data Structure
All questions follow this pattern:
```typescript
{
  id: string,
  content: string,
  contentTranslation: string,
  questions: [{
    id: string,
    options: string[],
    optionTranslations: string[],
    correct: string,
    explanation: string,
    questionType: string
  }]
}
```

### Development Notes
- PWA-enabled with offline support
- Mobile-first responsive design
- No-cache headers in development
- Admin panel at `/admin` (dev only)
- Extensive logging in generator scripts

## Bash Commands
```bash
npm run build      # Build the project
npm run typecheck  # Run the typechecker
npm run lint       # Run ESLint checking
```

## Code Style
- Use ES modules (`import`/`export`) syntax, not CommonJS (`require`)
- Destructure imports when possible (e.g., `import { foo } from 'bar'`)

## Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
- **CRITICAL**: Always verify UI functionality with Playwright tests when implementing or fixing features
  - **MANDATORY**: Run Playwright tests after every code change that affects UI behavior
  - Create simple test files using Playwright to verify actual behavior
  - Test user interactions like button clicks, especially navigation (Next button behavior)
  - Verify that components remain in the correct state after interactions
  - Test audio functionality, quality switching, and voice selection
  - Monitor browser console for errors during test execution
  - Examples: 
    - `node test-part0-next.mjs` to test Part 0 Next button functionality
    - `node test-audio-quality-switch.js` to test audio quality switching functionality

## Linting Guidelines
- **IMPORTANT**: When removing functions, components, or props from code, always check and clean up ALL references to ensure the build passes
- **CRITICAL**: Always remove unused variables immediately after code changes to prevent build failures
- Common lint errors to watch for:
  - Unused variables/functions (remove them completely)
  - Unused props in components (remove from both definition and usage)
  - Unused interfaces/types (remove if no longer needed)
- **Unused Variable Prevention**:
  - When changing code logic, review ALL variables declared in the modified section
  - If a variable is no longer used after your changes, remove its declaration immediately
  - Pay special attention to variables that were used for calculations but no longer needed
  - Example: If you remove conditional logic that used `isCorrect`, also remove `const isCorrect = ...`
- Always run `npm run lint` after refactoring to catch these issues early
- **AVOID** running `npm run build` unless absolutely necessary - use `npm run lint` for validation instead

## TypeScript Common Errors
- **Promise Type Errors**: Always specify Promise type explicitly when using resolve()
  - ❌ Wrong: `new Promise(resolve => { resolve(); })`
  - ✅ Correct: `new Promise<void>(resolve => { resolve(); })`
  - Common in async operations like voice loading, API calls, timeout functions
- **useEffect Dependencies**: Copy ref values at start of useEffect to avoid cleanup warnings
  - ❌ Wrong: `useEffect(() => { return () => { audioRef.current?.pause(); }; }, [])`
  - ✅ Correct: `useEffect(() => { const audio = audioRef.current; return () => { audio?.pause(); }; }, [])`

## Guardrails for automation
- **DO NOT** invoke `npm run build` during development or automation tasks
- If a dev server is running (port 3001 in this project), do not invoke `npm run build`
- Always prefer `npm run lint` over `npm run build` for post-edit validation
- Use `npm run check:quick` if available for lightweight validation
- Only run `npm run build` if explicitly requested by the user or for production deployment

## Issue Tracking
- GitHub Issuesでバグ・改善点を管理。スマホから投稿、開発時に`gh issue list`で確認、対応後`gh issue close 番号`で閉じる。

## Git Workflow Notes
- Run git add . before executing git push

## Important Instructions
- **DO NOT** perform actions that were not explicitly requested by the user
- **DO NOT** undo or revert changes unless explicitly instructed
- **DO NOT** make assumptions about user intent - only do exactly what was asked
- If clarification is needed, ask the user instead of making assumptions