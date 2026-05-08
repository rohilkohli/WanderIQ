# Contributing to VoyaIQ 🤝

We welcome contributions to VoyaIQ! To maintain a high standard of code quality and ensure the project remains stable and predictable, please adhere to the following guidelines.

## 🌿 Branch Naming Conventions
All branches should follow a clear, descriptive format:
- **Features:** `feature/<short-description>` (e.g., `feature/budget-optimization`)
- **Bug Fixes:** `fix/<short-description>` (e.g., `fix/dnd-reorder-bug`)
- **Documentation:** `docs/<short-description>`
- **Refactoring:** `refactor/<short-description>`

## 📝 Conventional Commits
We enforce strict conventional commits. Your commit message MUST follow this structure:
`<type>(<optional scope>): <description>`

Examples:
- `feat(planner): add map route visualization`
- `fix(auth): resolve google login persistence issue`
- `docs: update environment variable instructions`

Valid types include: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

## 📏 Code Quality & Structure
VoyaIQ is evaluated on rigorous code quality standards. Please observe the following before submitting a Pull Request:

1. **ESLint:** Your code must pass with **0 warnings and 0 errors**. Run `npm run lint` locally before committing.
2. **Component Size Constraint:** **No single component file may exceed 150 lines.** If your file grows beyond this limit, extract sub-components, business logic (into hooks), or constants into separate files. 
3. **JSDoc Requirements:** Every exported function, type, interface, and constant MUST be documented using standard JSDoc formatting (including `@param` and `@returns` where applicable).
4. **No Type Any:** The use of the `any` keyword is strictly prohibited. Always define strict TypeScript interfaces or types.

## 🧪 Testing
Ensure any new features include appropriate Vitest unit tests. If modifying existing features, ensure the core test suite continues to pass:
`npm run test`

Thank you for contributing to VoyaIQ and maintaining its production-ready standards!
