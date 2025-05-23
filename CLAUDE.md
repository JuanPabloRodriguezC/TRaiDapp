# TraidApp Development Guide

## Build Commands
- Start Angular app: `npm start` or `ng serve`
- Build: `ng build`
- Watch mode: `ng build --watch --configuration development`
- Tests: `ng test` (full test suite)
- Single test: `ng test --include=**/your-component.spec.ts`
- API server: `cd traidapi && npm run dev`
- Contracts tests: `cd contracts && snforge test`

## Code Style Guidelines
- TypeScript: Strict mode enabled with no implicit returns/overrides
- Use proper type annotations, avoid `any` when possible
- Components follow Angular naming conventions: name.component.ts
- Services follow name.service.ts pattern
- Interfaces in dedicated interface files with PascalCase names
- CSS uses kebab-case for class names
- Use Angular's dependency injection for services
- Utilize RxJS for async operations
- Import ordering: Angular core, third-party libs, local modules
- Cairo contracts follow Starknet conventions with proper imports

## Architecture
- Angular client in src/app/client
- API server in traidapi/
- Smart contracts in contracts/
- Follow component/service separation of concerns