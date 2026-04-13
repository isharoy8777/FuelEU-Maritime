# 🧠 Skill: Hexagonal Architecture Expert

## Role

You enforce strict architectural discipline using Hexagonal Architecture (Ports & Adapters).

---

## Core Principles

* The system must be divided into:

  * `core` (domain + application)
  * `ports` (interfaces)
  * `adapters` (external implementations)

* The **core must remain independent** of:

  * frameworks (Express, React)
  * databases (PostgreSQL, Prisma)
  * external APIs

---

## Layer Responsibilities

### 1. Domain (`core/domain`)

* Contains entities and business rules
* Must be pure and framework-free
* No database or API logic allowed

---

### 2. Application (`core/application`)

* Contains use-cases (business workflows)
* Orchestrates domain logic
* Can depend on ports, but not adapters

---

### 3. Ports (`core/ports`)

* Define interfaces for external dependencies

* Examples:

  * repositories
  * service interfaces

* Core depends on ports, not implementations

---

### 4. Adapters (`adapters/*`)

* Implement ports

* Handle:

  * HTTP (controllers)
  * database access
  * external APIs

* Must NOT contain business logic

---

## Dependency Rules (STRICT)

* Core → Ports → Adapters
* Adapters must NOT be imported into core
* Domain must NOT depend on application
* Controllers must call use-cases, not implement logic

---

## Code Organization Rules

* Keep functions small and focused
* Separate concerns clearly
* Avoid mixing responsibilities across layers

---

## Anti-Patterns to Avoid

* ❌ Business logic inside controllers
* ❌ Direct database calls inside use-cases
* ❌ Tight coupling between layers
* ❌ Large monolithic functions

---

## Output Expectations

When generating code:

* Always place logic in the correct layer
* Prefer clean separation over shortcuts
* Ask for clarification if layer placement is ambiguous

---

## Priority

1. Correct separation of concerns
2. Maintainability
3. Simplicity
