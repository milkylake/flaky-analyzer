## Table of Contents

- [Playwright Testing Challenges](#playwright-testing-challenges)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Challenges Overview](#challenges-overview)
- [Tests](#tests)
  - [Test Descriptions](#test-descriptions)
  - [Running Tests](#running-tests)

## Playwright Testing Challenges

This repository contains a series of testing challenges using Playwright to practice handling different UI testing scenarios. Each challenge focuses on specific aspects of web testing and requires fixing existing tests to make them more robust and reliable.

## Prerequisites

Node.js (v18 or higher)

## Setup

```bash
git clone https://github.com/vasu31dev/playwright-challenges.git
cd playwright-challenges
```

Install dependencies

```bash
npm install
```

## Challenges Overview

### Challenge 1: Multiple Login Tests (@c1)

- Test multiple successful login attempts
- Verify success messages and user data
- Handle dynamic content
- Practice proper assertions

### Challenge 2: Animated Form (@c2)

- Test login with animated form elements
- Handle delayed loading states
- Test logout functionality
- Work with menu interactions

### Challenge 3: Forgot Password Flow (@c3)

- Test forgot password functionality
- Handle modal dialogs
- Verify success states
- Practice proper assertions

### Challenge 4: Application State (@c4)

- Test login considering application ready state
- Handle global variables
- Test profile interactions
- Verify logout functionality

## Tests

This project includes several tests to ensure the functionality of the animated form. The tests are written using Playwright and can be found in the `flaky.spec.ts` file.

### Test Descriptions

- **Login multiple times successfully**: This test logs in three times with different credentials and verifies successful login messages.
- **Login and logout successfully with animated form and delayed loading**: This test logs in and logs out, handling animated forms and delayed loading.
- **Forgot password**: This test verifies the forgot password functionality and checks for success messages.
- **Login and logout**: This test logs in and logs out, ensuring the app is in a ready state before proceeding.

### Running Tests

To run the tests, use the following command:

```bash
npx playwright test
```
