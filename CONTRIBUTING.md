# Contributing to Mesopotamia SDK

Thank you for your interest in contributing to Mesopotamia SDK! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/mesopotamia-sdk/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, SDK version, etc.)

### Suggesting Features

1. Open a new issue with the "feature request" label
2. Describe the feature and its use case
3. Explain why it would benefit the project

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write or update tests
5. Ensure all tests pass
6. Submit a pull request

## Development Setup

### Prerequisites

- Rust 1.70+
- Go 1.21+
- Flutter 3.10+
- Node.js 16+

### Building

```bash
# Core library
cd core
cargo build

# Mock gateway
cd mock-gateway
go build

# Flutter package
cd flutter
flutter pub get

# Node.js package
cd nodejs
npm install
```

### Running Tests

```bash
# All tests
cargo test          # Rust
go test ./...       # Go
flutter test        # Flutter
npm test            # Node.js
```

## Code Style

### Rust
- Follow Rust standard formatting (`cargo fmt`)
- No Clippy warnings (`cargo clippy`)

### Go
- Follow `gofmt` standards
- Use `golint` for linting

### Dart
- Follow Dart style guide
- Use `dart format`

### TypeScript/JavaScript
- Use Prettier for formatting
- Follow ESLint rules

## Commit Messages

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(core): add HMAC-SHA256 signature generation

Implements secure signature generation for webhook verification.
Includes comprehensive unit tests.

Closes #123
```

## Documentation

- Update documentation for any API changes
- Add JSDoc/rustdoc comments for public APIs
- Include examples where appropriate

## Security

- Never commit secrets or credentials
- Report security vulnerabilities privately to security@mesopotamia.dev
- Follow secure coding practices

## Questions?

Open a discussion on GitHub or reach out to the maintainers.

Thank you for contributing! 🙏
