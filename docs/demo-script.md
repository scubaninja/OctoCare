# Demo Script

## Narrative

> Titan Limited wants to reduce support load, improve customer experience, and bring AI into the software delivery process safely — using GitHub from idea to production.

## Act 1: The Customer Experience

1. Open the OctoCare customer portal
2. Show the knowledge base search — customer searches "damaged order"
3. AI assistant suggests relevant articles
4. Customer doesn't find a satisfactory answer → opens a support case
5. Customer fills in: "My order arrived damaged. Order #12345, delivered June 5th."
6. Case is submitted and customer sees a tracking page

## Act 2: AI-Powered Triage

1. Switch to the agent dashboard
2. New case appears in the queue
3. AI has already:
   - Summarized the issue
   - Classified priority as "High"
   - Categorized as "Shipping"
   - Suggested next action: "Request photos of damage and initiate replacement process"
4. Agent reviews and accepts the AI suggestion
5. Show the SLA timer and status

## Act 3: Building a New Feature with Copilot

1. Show GitHub Issue: "Customers need to upload photos when submitting damaged item claims"
2. Open Copilot and start implementing:
   - File upload component in the web app
   - API endpoint for file upload
   - Storage abstraction
   - Validation (file size, file type)
   - Tests
3. Show how Copilot helps write realistic, production-quality code

## Act 4: Code Review & Security

1. Open the PR created from the feature branch
2. Copilot Code Review catches:
   - Missing file size validation
   - Missing allowed file type check
   - Accessibility issue on the upload form
   - No auth check on case lookup endpoint
3. Show CodeQL results — flags unsafe input handling
4. Show dependency review — blocks a risky package
5. Show secret scanning — catches a test API key

## Act 5: Deploy & Verify

1. PR is approved and merged
2. GitHub Actions CI runs: build, test, security scan
3. Deployment workflow deploys to Azure
4. Return to the customer portal — photo upload is now available
5. Customer uploads damage photos to their case

## Key Messages

- **AI is governed**: Prompts are versioned, reviewed, and tested like code
- **Security is continuous**: GHAS catches issues before they reach production
- **Copilot accelerates**: From issue to deployed feature, faster and safer
- **GitHub is the platform**: One place from idea to production
