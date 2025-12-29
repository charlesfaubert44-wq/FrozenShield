# Contributing to FrozenShield

Thank you for your interest in contributing to FrozenShield! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Bug Reports](#bug-reports)
8. [Feature Requests](#feature-requests)
9. [Documentation](#documentation)
10. [Testing](#testing)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes**:
- Harassment, trolling, or derogatory comments
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas account)
- Git
- Text editor/IDE (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/frozenshield.git
   cd frozenshield/FrozenShield
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/frozenshield.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Create first admin**:
   ```bash
   npm run create-admin
   ```

7. **Start development server**:
   ```bash
   npm run dev
   ```

---

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b docs/your-documentation-update
```

**Branch naming conventions**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, maintainable code
- Follow the [Coding Standards](#coding-standards)
- Test your changes thoroughly
- Update documentation as needed

### 3. Keep Your Fork Updated

Regularly sync with upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### 4. Commit Your Changes

Follow the [Commit Guidelines](#commit-guidelines):

```bash
git add .
git commit -m "feat: add project search functionality"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Follow the [Pull Request Process](#pull-request-process)

---

## Coding Standards

### JavaScript Style Guide

**General Principles**:
- Use ES6+ features (const/let, arrow functions, template literals)
- Prefer async/await over callbacks
- Use meaningful variable and function names
- Keep functions small and focused (single responsibility)
- Avoid global variables

**Code Formatting**:
- Indentation: 4 spaces (not tabs)
- Semicolons: Required
- Quotes: Single quotes for strings
- Line length: 100 characters max (recommended)

**Example**:
```javascript
// Good
const getUserProjects = async (userId) => {
    const projects = await Project.find({ userId }).lean();
    return projects;
};

// Avoid
function getProjects(id) {
    return Project.find({userId:id}).then(p=>p)
}
```

---

### File Organization

**Backend structure**:
```
server/
├── config/         # Configuration files
├── models/         # Mongoose models
├── routes/         # Express routes
├── middleware/     # Custom middleware
├── scripts/        # Utility scripts
└── server.js       # App entry point
```

**Frontend structure**:
```
public/
├── index.html      # Main page
├── styles.css      # Global styles
├── script.js       # Main JS
└── admin/          # Admin panel
```

---

### Naming Conventions

**Files**:
- Use camelCase: `projectController.js`
- Models: PascalCase: `Project.js`

**Variables and Functions**:
- Variables: camelCase: `projectList`
- Functions: camelCase: `getProjects()`
- Constants: UPPER_SNAKE_CASE: `MAX_RETRIES`

**Classes and Models**:
- PascalCase: `class ProjectService`

**Routes**:
- Lowercase with hyphens: `/api/project-categories`

---

### Error Handling

**Always handle errors properly**:

```javascript
// Good
try {
    const result = await someAsyncOperation();
    return result;
} catch (error) {
    logger.error('Operation failed', { error: error.message });
    throw error; // or handle gracefully
}

// Avoid
const result = await someAsyncOperation(); // Unhandled errors
```

**API error responses**:
```javascript
res.status(400).json({
    success: false,
    message: 'Clear, user-friendly error message',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
});
```

---

### Security Best Practices

1. **Never commit secrets**:
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Validate all input**:
   ```javascript
   if (!name || !email || !message) {
       return res.status(400).json({
           success: false,
           message: 'Missing required fields'
       });
   }
   ```

3. **Sanitize user input**:
   - Mongoose handles NoSQL injection prevention
   - Validate email formats
   - Escape HTML if rendering user content

4. **Use parameterized queries**:
   ```javascript
   // Good (Mongoose)
   Project.findById(id)

   // Avoid raw queries
   db.collection.find({ _id: id })
   ```

---

### Documentation

**JSDoc for functions**:
```javascript
/**
 * Create a new project in the database
 * @param {Object} projectData - Project information
 * @param {string} projectData.title - Project title
 * @param {string} projectData.description - Project description
 * @param {boolean} [projectData.featured=false] - Featured flag
 * @returns {Promise<Object>} Created project document
 * @throws {ValidationError} If required fields are missing
 */
const createProject = async (projectData) => {
    const project = new Project(projectData);
    return await project.save();
};
```

**Inline comments**:
- Use for complex logic
- Explain "why", not "what"
- Keep comments up-to-date

---

## Commit Guidelines

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no code change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(projects): add search functionality

feat: add project search with filters
fix: resolve contact form validation bug
docs: update API documentation
refactor: simplify database connection logic
test: add unit tests for auth middleware
chore: update dependencies
```

---

### Writing Good Commits

**Good commits**:
- Are atomic (one logical change per commit)
- Have clear, descriptive messages
- Reference issue numbers when applicable

**Examples**:
```bash
# Good
git commit -m "feat: add featured projects endpoint"
git commit -m "fix: resolve rate limiting issue (#42)"
git commit -m "docs: add troubleshooting section"

# Avoid
git commit -m "updates"
git commit -m "fixed stuff"
git commit -m "WIP"
```

---

## Pull Request Process

### Before Submitting

1. **Test your changes thoroughly**:
   - Run development server
   - Test all affected features
   - Verify no breaking changes

2. **Update documentation**:
   - Update README.md if needed
   - Add/update API documentation
   - Update relevant docs in `/docs`

3. **Check code quality**:
   ```bash
   # Check for security issues
   npm audit

   # Ensure dependencies are up-to-date
   npm outdated
   ```

4. **Ensure your branch is up-to-date**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

---

### PR Title and Description

**Title format**:
```
<type>: <clear, descriptive title>
```

**Description template**:
```markdown
## Description
Brief description of changes

## Changes Made
- List of specific changes
- Another change
- One more change

## Related Issues
Closes #123
Related to #456

## Testing
- [ ] Tested locally
- [ ] All features work as expected
- [ ] No breaking changes
- [ ] Documentation updated

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

---

### Review Process

1. **Automated checks** must pass:
   - No merge conflicts
   - Code builds successfully

2. **Code review** by maintainer:
   - Code quality and style
   - Security considerations
   - Performance implications
   - Documentation completeness

3. **Feedback and revisions**:
   - Address all comments
   - Push updates to same branch
   - Re-request review when ready

4. **Approval and merge**:
   - Maintainer approves PR
   - PR is merged to main branch
   - Branch can be deleted

---

### After Your PR is Merged

- Delete your feature branch (GitHub will prompt)
- Update your local repository:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

---

## Bug Reports

### Before Submitting a Bug Report

1. **Check existing issues** - Bug may already be reported
2. **Verify it's a bug** - Not a configuration issue
3. **Test with latest version** - Bug may be fixed
4. **Reproduce the bug** - Ensure it's consistent

---

### Submitting a Bug Report

**Use this template**:

```markdown
## Bug Description
Clear, concise description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Enter '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 10, macOS 12.1]
- Node.js version: [e.g., v16.13.0]
- MongoDB version: [e.g., 5.0.5]
- Browser (if frontend): [e.g., Chrome 96]

## Screenshots
[If applicable]

## Additional Context
Any other relevant information

## Possible Solution (optional)
Your ideas for fixing the bug
```

---

## Feature Requests

### Submitting a Feature Request

**Use this template**:

```markdown
## Feature Description
Clear description of the proposed feature

## Problem It Solves
What problem does this feature address?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Any other relevant information

## Mockups/Examples (optional)
Visual examples or wireframes
```

---

## Documentation

### What Needs Documentation

- New features
- API changes
- Configuration options
- Setup procedures
- Troubleshooting steps

### Documentation Files

- `README.md` - Project overview, quick start
- `docs/architecture.md` - System architecture
- `docs/api-reference.md` - Complete API documentation
- `docs/troubleshooting.md` - Common issues and solutions
- `docs/maintenance.md` - Maintenance and operations
- `CONTRIBUTING.md` - This file

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide step-by-step instructions
- Keep documentation up-to-date
- Use proper markdown formatting

---

## Testing

### Manual Testing

**Required tests before submitting PR**:

1. **Public Site**:
   - Homepage loads correctly
   - Projects display properly
   - Contact form works
   - Navigation functions
   - Responsive design works

2. **Admin Panel**:
   - Login/logout works
   - Project CRUD operations
   - Contact management
   - All admin features work

3. **API Endpoints**:
   - All endpoints return expected responses
   - Error handling works
   - Authentication works
   - Rate limiting functions

---

### Automated Testing (Future)

We plan to add automated tests. When implemented:

```bash
npm test
```

**Test coverage should include**:
- Unit tests for models
- Integration tests for API endpoints
- End-to-end tests for critical flows

---

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues
3. Open a new issue with your question
4. Email: hello@frozenshield.ca

---

## Recognition

Contributors will be:
- Listed in project credits
- Mentioned in release notes
- Credited in commit history

Thank you for contributing to FrozenShield!

---

Last Updated: 2025-12-27
