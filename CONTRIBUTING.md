# Contributing to mcp-server-wrike

Thank you for your interest in contributing to the mcp-server-wrike project! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Any relevant logs or screenshots
- Your environment (OS, Node.js version, etc.)

### Suggesting Enhancements

If you have an idea for an enhancement, please create an issue with:
- A clear, descriptive title
- A detailed description of the enhancement
- Any relevant examples or mockups
- Why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Submit a pull request

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/katoiek/mcp-server-wrike.git
cd mcp-server-wrike
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Test your changes:
```bash
npm run test
```

## Code Style

- Follow the existing code style in the project
- Use TypeScript for all new code
- Add appropriate comments and documentation
- Write clear commit messages

## Performance Considerations

When contributing to this project, please keep the following performance considerations in mind:

1. **Memory Usage**
   - Avoid memory leaks by properly cleaning up resources
   - Be mindful of large object allocations
   - Use streams for processing large amounts of data

2. **Logging**
   - Use appropriate log levels (error, warn, info, debug, trace)
   - Avoid excessive logging in production environments
   - Don't log sensitive information

3. **API Calls**
   - Minimize the number of API calls to Wrike
   - Implement caching where appropriate
   - Handle rate limiting gracefully

4. **Error Handling**
   - Implement proper error handling for all API calls
   - Provide meaningful error messages
   - Don't expose sensitive information in error messages

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.
