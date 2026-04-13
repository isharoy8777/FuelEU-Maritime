# Reflection

## Q1. What did you learn using AI agents?

Using AI agents in this project taught me that leaving all thinking to the agent is a bad choice. The agent is strong at execution when tasks are clearly defined, but weaker at ideation and product-level decision making on its own. I learned that prompt quality directly controls output quality: when prompts are specific and precise, results are useful; when prompts are vague, results are often mismatched.

## Q2. What were the efficiency gains compared to manual coding?

Compared to fully manual coding, AI significantly improved speed once the initial architecture was in place. In manual coding, debugging can sometimes feel easier because I know exactly why I wrote each block and can trace intent quickly. However, AI helped a lot with repetitive implementation work, cross-layer boilerplate, and common error fixes. It reduced time spent on mechanical coding and allowed more focus on validating behavior and business rules.

## Q3. What improvements would you make next time?

I would improve this project in three directions:

1. Add a proper authentication and authorization system, so access control is role-based and secure.
2. Build a CSV upload pipeline for ship and route data, so real datasets can be imported without manual entry.
3. Add an AI forecasting module to estimate future compliance balance (CB) per ship from historical trends and display predictions in the dashboard.

Overall, AI agents are best used as execution accelerators, not as replacements for engineering judgment. The best workflow is human-led planning with AI-assisted implementation, followed by strict validation.
