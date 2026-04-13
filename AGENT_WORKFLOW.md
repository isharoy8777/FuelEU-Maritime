# AI Agent Workflow Log

---

## 🧠 Agents Used

* **Antigravity (Google)** — primary development agent used for backend, frontend, and logic generation
* **Stitch** — used for generating and iterating frontend UI designs

---

## 💬 Prompts & Outputs

### Example 1 — Backend Structure

**Prompt (summary):**
"Set up backend using Node.js, TypeScript and hexagonal architecture with domain, application, ports and adapters."

**Output:**

* Generated folder structure
* Basic backend setup

**Refinement / Correction:**

* Ensured proper separation of layers
* Removed any business logic from controllers
* Aligned structure strictly with hexagonal architecture

---

### Example 2 — Core Logic (CB, Banking, Pooling)

**Prompt (summary):**
"Implement compliance balance, banking and pooling logic based on given formulas and constraints."

**Output:**

* Generated functions for CB, banking and pooling

**Refinement / Correction:**

* Fixed banking logic where CB was incorrectly increasing
* Ensured:

  * Banking reduces CB
  * Applying increases CB
* Corrected pooling edge cases:

  * total CB ≥ 0
  * surplus ships never become negative
  * deficit ships do not worsen

---

### Example 3 — Frontend Design (Stitch)

**Prompt (summary):**
"Generate multiple dashboard UI designs for FuelEU system with tables, charts and clean layout."

**Output:**

* Multiple UI variations

**Refinement / Correction:**

* Selected the most clean and usable design
* Improved layout consistency and component reuse

---

### Example 4 — Frontend Functionality

**Prompt (summary):**
"Implement Routes, Compare, Banking and Pooling pages with proper UI interactions."

**Output:**

* Generated UI components and state handling

**Refinement / Correction:**

* Ensured proper state flow between pages
* Fixed logical issues (baseline usage, CB updates)
* Improved UI clarity (before vs after values)

---

## 🔍 Validation / Corrections

* Manually verified all business logic:

  * Compliance Balance (CB)
  * Banking logic
  * Pooling redistribution

* Checked edge cases:

  * Negative CB
  * Zero CB
  * Over-application of banked credits
  * Invalid pool combinations

* Ensured:

  * No database logic inside core
  * No business logic inside controllers
  * Proper separation of concerns

---

## 📊 Observations

### Where Agent Saved Time

* Quickly generated project structure
* Helped build boilerplate code (APIs, components)
* Accelerated frontend UI development using Stitch
* Reduced manual effort in repetitive coding

---

### Where Agent Failed / Hallucinated

* Struggled when errors were not common
* Repeated common fixes instead of understanding actual issue
* Sometimes misunderstood prompt intent
* Did not always learn from existing code context

---

### Tool Usage Strategy

* Used **Antigravity** for core development and logic
* Used **Stitch** for UI design exploration
* Combined both to iterate faster and refine outputs

---

## ✅ Best Practices Followed

* Used **skills.md** to guide the agent with:

  * architecture rules
  * domain logic
  * coding standards

* Broke work into small, structured prompts

* Avoided generating the entire project at once

* Verified all critical logic manually

* Used AI as an assistant, not a replacement

---

## 🧠 Key Learnings

* AI significantly improves speed but needs validation
* Domain logic must be understood clearly before implementation
* Small and precise prompts give better results
* Agents may fail on non-standard errors and require manual debugging
* Proper guidance (via skills.md) improves output quality

---

## 🚀 Final Outcome

* Fully functional FuelEU Compliance system
* Backend with correct architecture and logic
* Frontend with clean UI and proper interactions
* Structured and maintainable codebase
