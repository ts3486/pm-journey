# Backend Implementation Guide: Scenario CRUD API

This guide walks you through implementing the backend API for custom scenario creation, update, and deletion. It's designed for developers learning Rust and Axum.

Architecture note: keep layers separated — HTTP handlers stay thin, services own business logic, and repositories handle SQL.

---

## Table of Contents

1. [Prerequisites & Concepts](#1-prerequisites--concepts)
2. [Project Structure Overview](#2-project-structure-overview)
3. [Step 1: Database Migration](#step-1-database-migration)
4. [Step 2: Update Models](#step-2-update-models)
5. [Step 3: Create Repository Layer](#step-3-create-repository-layer)
6. [Step 4: Create Service Layer](#step-4-create-service-layer)
7. [Step 5: Implement API Handlers](#step-5-implement-api-handlers)
8. [Step 6: Register Routes](#step-6-register-routes)
9. [Step 7: Update OpenAPI Documentation](#step-7-update-openapi-documentation)
10. [Testing Your Implementation](#testing-your-implementation)
11. [Frontend Integration](#frontend-integration)

---

## 1. Prerequisites & Concepts

### Rust Fundamentals You'll Use

#### Ownership & Borrowing
```rust
// Ownership: Each value has one owner
let scenario = Scenario { id: "test".to_string(), ... };

// Borrowing: References allow temporary access without ownership transfer
fn process(scenario: &Scenario) { ... }  // Immutable borrow
fn update(scenario: &mut Scenario) { ... }  // Mutable borrow

// Clone: Create a deep copy when you need ownership
let copy = scenario.clone();
```

#### Result Type for Error Handling
```rust
// Result<T, E> represents success (Ok) or failure (Err)
async fn get_scenario(id: &str) -> Result<Scenario, AppError> {
    // On success:
    Ok(scenario)
    // On failure:
    Err(AppError::new(StatusCode::NOT_FOUND, anyhow::anyhow!("not found")))
}

// The ? operator propagates errors automatically
let scenario = repo.get(id).await?;  // Returns early if Err
```

#### Option Type for Nullable Values
```rust
// Option<T> represents Some(value) or None
pub passing_score: Option<f32>,  // May or may not have a value

// Handle with match or methods
match scenario.passing_score {
    Some(score) => println!("Score: {}", score),
    None => println!("No score set"),
}

// Or use unwrap_or for defaults
let score = scenario.passing_score.unwrap_or(70.0);
```

### Axum Framework Concepts

#### Extractors
Extractors parse incoming request data:

```rust
use axum::extract::{Path, State, Json};

// Path: Extract URL parameters
// Route: "/scenarios/:id"
async fn get_scenario(Path(id): Path<String>) -> ... { }

// State: Access shared application state (like database pool)
async fn list_scenarios(State(state): State<SharedState>) -> ... { }

// Json: Parse JSON request body
async fn create_scenario(Json(body): Json<CreateScenarioRequest>) -> ... { }

// Combine multiple extractors
async fn update_scenario(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateScenarioRequest>,
) -> Result<Json<Scenario>, AppError> { }
```

#### Response Types
```rust
// Return JSON
async fn list() -> Json<Vec<Scenario>> {
    Json(scenarios)
}

// Return Result for error handling
async fn get(id: String) -> Result<Json<Scenario>, AppError> {
    let scenario = find_scenario(id)?;
    Ok(Json(scenario))
}
```

#### Router
```rust
use axum::{routing::{get, post, put, delete}, Router};

let app = Router::new()
    .route("/scenarios", get(list_scenarios).post(create_scenario))
    .route("/scenarios/:id", get(get_scenario).put(update_scenario).delete(delete_scenario))
    .with_state(state);
```

### SQLx Concepts

#### Query Macros
```rust
// sqlx::query! - Compile-time checked queries
sqlx::query!(
    "INSERT INTO scenarios (id, title) VALUES ($1, $2)",
    scenario.id,
    scenario.title
)
.execute(&pool)
.await?;

// sqlx::query_as! - Map to struct
let scenario = sqlx::query_as!(
    Scenario,
    "SELECT * FROM scenarios WHERE id = $1",
    id
)
.fetch_optional(&pool)
.await?;
```

#### Transactions
```rust
// Start transaction
let mut tx = pool.begin().await?;

// Execute queries within transaction
sqlx::query!("INSERT INTO ...").execute(&mut *tx).await?;
sqlx::query!("UPDATE ...").execute(&mut *tx).await?;

// Commit (or it auto-rollbacks on drop)
tx.commit().await?;
```

### Serde for Serialization

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  // Convert to camelCase for JSON
pub struct Scenario {
    pub id: String,
    pub passing_score: Option<f32>,  // Becomes "passingScore" in JSON

    #[serde(alias = "kickoff_prompt")]  // Accept both formats
    pub kickoff_prompt: String,
}
```

---

## 2. Project Structure Overview

```
backend/
├── src/
│   ├── main.rs           # Application entry, server setup
│   ├── lib.rs            # Module declarations
│   ├── error.rs          # Custom error types
│   ├── api/
│   │   └── mod.rs        # HTTP handlers & routing (thin)
│   ├── services/
│   │   └── scenarios.rs  # NEW: Scenario service
│   ├── db/
│   │   ├── mod.rs        # Repository exports
│   │   ├── sessions.rs   # Session repository (reference)
│   │   └── scenarios.rs  # NEW: Scenario repository
│   └── models/
│       └── mod.rs        # Data structures
├── migrations/
│   └── *.sql             # Database migrations
└── Cargo.toml            # Dependencies
```

---

## Step 1: Database Migration

Create a new migration file for the scenarios table.

### 1.1 Create Migration File

```bash
# Create file: migrations/20260127000001_scenarios.sql
```

### 1.2 Write the Migration

```sql
-- migrations/20260127000001_scenarios.sql

-- Custom scenarios table (built-in scenarios remain in code)
CREATE TABLE IF NOT EXISTS custom_scenarios (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    discipline TEXT NOT NULL CHECK (discipline IN ('BASIC', 'CHALLENGE')),
    mode TEXT NOT NULL,
    kickoff_prompt TEXT NOT NULL,
    passing_score REAL,
    supplemental_info TEXT,

    -- Complex nested data stored as JSONB
    behavior JSONB,
    product JSONB NOT NULL,
    evaluation_criteria JSONB NOT NULL,
    missions JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_discipline
    ON custom_scenarios(discipline);
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_created_at
    ON custom_scenarios(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_custom_scenarios_updated_at
    BEFORE UPDATE ON custom_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Why JSONB for nested structures?

- **Flexibility**: Complex nested objects (product, criteria) map naturally to JSON
- **Query-ability**: PostgreSQL can query inside JSONB fields
- **Simplicity**: Avoids many join tables for one-to-many relationships
- **Type safety**: Serde handles serialization/deserialization in Rust

### 1.3 Run the Migration

```bash
cd backend
cargo run  # Migrations run automatically on startup
```

---

## Step 2: Update Models

### 2.1 Scenario Model Updates

The `Scenario` struct already exists in `src/models/mod.rs`. You may need to add supporting types:

```rust
// src/models/mod.rs

// Add if not present: ScenarioBehavior struct
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScenarioBehavior {
    pub user_led: Option<bool>,
    pub allow_proactive: Option<bool>,
    pub max_questions: Option<u32>,
    pub response_style: Option<String>,
    pub phase: Option<String>,
}

// Add ScoringGuidelines for evaluation criteria
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScoringGuidelines {
    pub excellent: String,
    pub good: String,
    pub needs_improvement: String,
    pub poor: String,
}

// Add RatingCriterion (full version with guidelines)
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RatingCriterion {
    pub id: String,
    pub name: String,
    pub weight: f32,
    pub description: String,
    pub scoring_guidelines: ScoringGuidelines,
}
```

### 2.2 Understanding Derive Macros

```rust
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
//       ^^^^^  ^^^^^^^^^  ^^^^^^^^^^^  ^^^^^^^^  ^^^^^
//       |      |          |            |         |
//       |      |          |            |         Create copies with .clone()
//       |      |          |            Generate OpenAPI schema
//       |      |          Convert from JSON
//       |      Convert to JSON
//       Enable {:?} debug printing
```

---

## Step 3: Create Repository Layer

The repository pattern separates database logic from API handlers.

### 3.1 Create the Repository File

```rust
// src/db/scenarios.rs

use sqlx::{PgPool, Postgres, Transaction};
use crate::models::{Scenario, ScenarioDiscipline, ProductInfo, RatingCriterion, Mission, ScenarioBehavior};
use anyhow::{Result, Context};

/// Repository for custom scenarios CRUD operations
#[derive(Clone)]
pub struct ScenarioRepository {
    pool: PgPool,
}

impl ScenarioRepository {
    /// Create a new repository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new custom scenario
    pub async fn create(&self, scenario: &Scenario) -> Result<Scenario> {
        let discipline = match scenario.discipline {
            ScenarioDiscipline::Basic => "BASIC",
            ScenarioDiscipline::Challenge => "CHALLENGE",
        };

        // Convert nested structs to JSONB
        let behavior = serde_json::to_value(&scenario.behavior)?;
        let product = serde_json::to_value(&scenario.product)?;
        let evaluation_criteria = serde_json::to_value(&scenario.evaluation_criteria)?;
        let missions = serde_json::to_value(&scenario.missions)?;

        sqlx::query!(
            r#"
            INSERT INTO custom_scenarios (
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
            scenario.id,
            scenario.title,
            scenario.description,
            discipline,
            scenario.mode,
            scenario.kickoff_prompt,
            scenario.passing_score,
            scenario.supplemental_info,
            behavior,
            product,
            evaluation_criteria,
            missions,
        )
        .execute(&self.pool)
        .await
        .context("Failed to insert scenario")?;

        // Return the created scenario
        self.get(&scenario.id).await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created scenario"))
    }

    /// Get a scenario by ID
    pub async fn get(&self, id: &str) -> Result<Option<Scenario>> {
        let row = sqlx::query!(
            r#"
            SELECT
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions
            FROM custom_scenarios
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch scenario")?;

        Ok(row.map(|r| {
            // Convert discipline string to enum
            let discipline = match r.discipline.as_str() {
                "CHALLENGE" => ScenarioDiscipline::Challenge,
                _ => ScenarioDiscipline::Basic,
            };

            // Parse JSONB back to structs
            let behavior: Option<ScenarioBehavior> = r.behavior
                .and_then(|v| serde_json::from_value(v).ok());
            let product: ProductInfo = serde_json::from_value(r.product)
                .expect("Invalid product JSON in database");
            let evaluation_criteria: Vec<RatingCriterion> =
                serde_json::from_value(r.evaluation_criteria)
                    .unwrap_or_default();
            let missions: Option<Vec<Mission>> = r.missions
                .and_then(|v| serde_json::from_value(v).ok());

            Scenario {
                id: r.id,
                title: r.title,
                description: r.description,
                discipline,
                behavior,
                product,
                mode: r.mode,
                kickoff_prompt: r.kickoff_prompt,
                evaluation_criteria: evaluation_criteria.into_iter()
                    .map(|c| crate::models::EvaluationCategory {
                        name: c.name,
                        weight: c.weight,
                        score: None,
                        feedback: None,
                    })
                    .collect(),
                passing_score: r.passing_score,
                missions,
                supplemental_info: r.supplemental_info,
            }
        }))
    }

    /// List all custom scenarios
    pub async fn list(&self) -> Result<Vec<Scenario>> {
        let rows = sqlx::query!(
            r#"
            SELECT
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions
            FROM custom_scenarios
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to list scenarios")?;

        Ok(rows.into_iter().map(|r| {
            let discipline = match r.discipline.as_str() {
                "CHALLENGE" => ScenarioDiscipline::Challenge,
                _ => ScenarioDiscipline::Basic,
            };

            let behavior: Option<ScenarioBehavior> = r.behavior
                .and_then(|v| serde_json::from_value(v).ok());
            let product: ProductInfo = serde_json::from_value(r.product)
                .expect("Invalid product JSON");
            let evaluation_criteria: Vec<RatingCriterion> =
                serde_json::from_value(r.evaluation_criteria)
                    .unwrap_or_default();
            let missions: Option<Vec<Mission>> = r.missions
                .and_then(|v| serde_json::from_value(v).ok());

            Scenario {
                id: r.id,
                title: r.title,
                description: r.description,
                discipline,
                behavior,
                product,
                mode: r.mode,
                kickoff_prompt: r.kickoff_prompt,
                evaluation_criteria: evaluation_criteria.into_iter()
                    .map(|c| crate::models::EvaluationCategory {
                        name: c.name,
                        weight: c.weight,
                        score: None,
                        feedback: None,
                    })
                    .collect(),
                passing_score: r.passing_score,
                missions,
                supplemental_info: r.supplemental_info,
            }
        }).collect())
    }

    /// Update an existing scenario
    pub async fn update(&self, scenario: &Scenario) -> Result<Scenario> {
        let discipline = match scenario.discipline {
            ScenarioDiscipline::Basic => "BASIC",
            ScenarioDiscipline::Challenge => "CHALLENGE",
        };

        let behavior = serde_json::to_value(&scenario.behavior)?;
        let product = serde_json::to_value(&scenario.product)?;
        let evaluation_criteria = serde_json::to_value(&scenario.evaluation_criteria)?;
        let missions = serde_json::to_value(&scenario.missions)?;

        let result = sqlx::query!(
            r#"
            UPDATE custom_scenarios
            SET title = $2,
                description = $3,
                discipline = $4,
                mode = $5,
                kickoff_prompt = $6,
                passing_score = $7,
                supplemental_info = $8,
                behavior = $9,
                product = $10,
                evaluation_criteria = $11,
                missions = $12
            WHERE id = $1
            "#,
            scenario.id,
            scenario.title,
            scenario.description,
            discipline,
            scenario.mode,
            scenario.kickoff_prompt,
            scenario.passing_score,
            scenario.supplemental_info,
            behavior,
            product,
            evaluation_criteria,
            missions,
        )
        .execute(&self.pool)
        .await
        .context("Failed to update scenario")?;

        if result.rows_affected() == 0 {
            anyhow::bail!("Scenario not found");
        }

        self.get(&scenario.id).await?
            .ok_or_else(|| anyhow::anyhow!("Scenario not found after update"))
    }

    /// Delete a scenario by ID
    pub async fn delete(&self, id: &str) -> Result<()> {
        let result = sqlx::query!("DELETE FROM custom_scenarios WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .context("Failed to delete scenario")?;

        if result.rows_affected() == 0 {
            anyhow::bail!("Scenario not found");
        }

        Ok(())
    }

    /// Check if a scenario ID exists
    pub async fn exists(&self, id: &str) -> Result<bool> {
        let result = sqlx::query!(
            "SELECT EXISTS(SELECT 1 FROM custom_scenarios WHERE id = $1) as exists",
            id
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to check scenario existence")?;

        Ok(result.exists.unwrap_or(false))
    }
}
```

### 3.2 Register in db/mod.rs

```rust
// src/db/mod.rs
pub mod sessions;
pub mod messages;
pub mod evaluations;
pub mod comments;
pub mod scenarios;  // ADD THIS

pub use sessions::SessionRepository;
pub use messages::MessageRepository;
pub use evaluations::EvaluationRepository;
pub use comments::CommentRepository;
pub use scenarios::ScenarioRepository;  // ADD THIS
```

---

## Step 4: Create Service Layer

Services sit between handlers and repositories. They keep business logic out of HTTP handlers and make reuse/testing easier.

Create a service module that wraps the repository and exposes domain-focused methods:

```rust
// src/services/scenarios.rs

use sqlx::PgPool;
use crate::db::ScenarioRepository;
use crate::error::{anyhow_error, AppError};
use crate::models::Scenario;

#[derive(Clone)]
pub struct ScenarioService {
    repo: ScenarioRepository,
}

impl ScenarioService {
    pub fn new(pool: PgPool) -> Self {
        Self {
            repo: ScenarioRepository::new(pool),
        }
    }

    pub async fn create(&self, scenario: &Scenario) -> Result<Scenario, AppError> {
        self.repo
            .create(scenario)
            .await
            .map_err(|e| anyhow_error(format!("Failed to create scenario: {}", e)))
    }

    pub async fn get(&self, id: &str) -> Result<Scenario, AppError> {
        self.repo
            .get(id)
            .await
            .map_err(|e| anyhow_error(format!("Failed to get scenario: {}", e)))?
            .ok_or_else(|| anyhow_error("scenario not found"))
    }
}
```

Then expose the service from app state (for example via a `Services` struct), so handlers can call `state.services().scenarios()`.

---

## Step 5: Implement API Handlers

### 5.1 Request/Response Types

Add these to `src/api/mod.rs`:

```rust
// Request types for scenario CRUD
#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct CreateScenarioRequest {
    id: String,
    title: String,
    description: String,
    discipline: String,  // "BASIC" or "CHALLENGE"
    mode: String,
    kickoff_prompt: String,
    passing_score: Option<f32>,
    supplemental_info: Option<String>,
    behavior: Option<ScenarioBehaviorInput>,
    product: ProductInfoInput,
    evaluation_criteria: Vec<RatingCriterionInput>,
    missions: Option<Vec<MissionInput>>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ScenarioBehaviorInput {
    user_led: Option<bool>,
    allow_proactive: Option<bool>,
    max_questions: Option<u32>,
    response_style: Option<String>,
    phase: Option<String>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ProductInfoInput {
    name: String,
    summary: String,
    audience: String,
    problems: Vec<String>,
    goals: Vec<String>,
    differentiators: Vec<String>,
    scope: Vec<String>,
    constraints: Vec<String>,
    timeline: String,
    success_criteria: Vec<String>,
    unique_edge: Option<String>,
    tech_stack: Option<Vec<String>>,
    core_features: Option<Vec<String>>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct RatingCriterionInput {
    id: String,
    name: String,
    weight: f32,
    description: String,
    scoring_guidelines: ScoringGuidelinesInput,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct ScoringGuidelinesInput {
    excellent: String,
    good: String,
    needs_improvement: String,
    poor: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct MissionInput {
    id: String,
    title: String,
    description: Option<String>,
    order: i32,
}

// For update, same as create but id comes from path
type UpdateScenarioRequest = CreateScenarioRequest;
```

### 5.2 Handler Functions

```rust
// Import at top of api/mod.rs
use crate::db::ScenarioRepository;

// List all scenarios (built-in + custom)
#[utoipa::path(
    get,
    path = "/scenarios",
    responses((status = 200, body = [Scenario]))
)]
async fn list_scenarios(
    State(state): State<SharedState>,
) -> Result<Json<Vec<Scenario>>, AppError> {
    // Get built-in scenarios
    let mut scenarios = default_scenarios();

    // Add custom scenarios from database
    let repo = ScenarioRepository::new(state.pool.clone());
    let custom = repo.list().await
        .map_err(|e| anyhow_error(&format!("Failed to list custom scenarios: {}", e)))?;

    scenarios.extend(custom);

    Ok(Json(scenarios))
}

// Get scenario by ID (check both built-in and custom)
#[utoipa::path(
    get,
    path = "/scenarios/{id}",
    responses((status = 200, body = Scenario))
)]
async fn get_scenario(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<Scenario>, AppError> {
    // First check built-in scenarios
    if let Some(scenario) = default_scenarios().into_iter().find(|s| s.id == id) {
        return Ok(Json(scenario));
    }

    // Then check custom scenarios
    let repo = ScenarioRepository::new(state.pool.clone());
    let scenario = repo.get(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to get scenario: {}", e)))?
        .ok_or_else(|| anyhow_error("Scenario not found"))?;

    Ok(Json(scenario))
}

// Create a new custom scenario
#[utoipa::path(
    post,
    path = "/scenarios",
    request_body = CreateScenarioRequest,
    responses((status = 201, body = Scenario))
)]
async fn create_scenario(
    State(state): State<SharedState>,
    Json(body): Json<CreateScenarioRequest>,
) -> Result<Json<Scenario>, AppError> {
    // Validate: ID must not conflict with built-in scenarios
    let built_in_ids: Vec<_> = default_scenarios().iter().map(|s| s.id.clone()).collect();
    if built_in_ids.contains(&body.id) {
        return Err(client_error("このIDは組み込みシナリオで使用されています"));
    }

    // Validate: ID format (lowercase alphanumeric and hyphens)
    if !body.id.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
        return Err(client_error("IDは小文字英数字とハイフンのみ使用可能です"));
    }

    // Validate: Weights must sum to 100
    let total_weight: f32 = body.evaluation_criteria.iter().map(|c| c.weight).sum();
    if (total_weight - 100.0).abs() > 0.01 {
        return Err(client_error("評価基準の重みの合計は100%である必要があります"));
    }

    // Convert input to Scenario model
    let discipline = match body.discipline.as_str() {
        "CHALLENGE" => ScenarioDiscipline::Challenge,
        _ => ScenarioDiscipline::Basic,
    };

    let scenario = Scenario {
        id: body.id,
        title: body.title,
        description: body.description,
        discipline,
        behavior: body.behavior.map(|b| ScenarioBehavior {
            user_led: b.user_led,
            allow_proactive: b.allow_proactive,
            max_questions: b.max_questions,
            response_style: b.response_style,
            phase: b.phase,
        }),
        product: ProductInfo {
            name: body.product.name,
            summary: body.product.summary,
            audience: body.product.audience,
            problems: body.product.problems,
            goals: body.product.goals,
            differentiators: body.product.differentiators,
            scope: body.product.scope,
            constraints: body.product.constraints,
            timeline: body.product.timeline,
            success_criteria: body.product.success_criteria,
            unique_edge: body.product.unique_edge,
            tech_stack: body.product.tech_stack,
            core_features: body.product.core_features,
        },
        mode: body.mode,
        kickoff_prompt: body.kickoff_prompt,
        evaluation_criteria: body.evaluation_criteria.iter().map(|c| {
            EvaluationCategory {
                name: c.name.clone(),
                weight: c.weight,
                score: None,
                feedback: None,
            }
        }).collect(),
        passing_score: body.passing_score,
        missions: body.missions.map(|missions| {
            missions.into_iter().map(|m| Mission {
                id: m.id,
                title: m.title,
                description: m.description,
                order: m.order,
            }).collect()
        }),
        supplemental_info: body.supplemental_info,
    };

    let repo = ScenarioRepository::new(state.pool.clone());
    let created = repo.create(&scenario).await
        .map_err(|e| anyhow_error(&format!("Failed to create scenario: {}", e)))?;

    Ok(Json(created))
}

// Update an existing custom scenario
#[utoipa::path(
    put,
    path = "/scenarios/{id}",
    request_body = UpdateScenarioRequest,
    responses((status = 200, body = Scenario))
)]
async fn update_scenario(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateScenarioRequest>,
) -> Result<Json<Scenario>, AppError> {
    // Cannot update built-in scenarios
    let built_in_ids: Vec<_> = default_scenarios().iter().map(|s| s.id.clone()).collect();
    if built_in_ids.contains(&id) {
        return Err(client_error("組み込みシナリオは編集できません"));
    }

    // Validate weights
    let total_weight: f32 = body.evaluation_criteria.iter().map(|c| c.weight).sum();
    if (total_weight - 100.0).abs() > 0.01 {
        return Err(client_error("評価基準の重みの合計は100%である必要があります"));
    }

    let discipline = match body.discipline.as_str() {
        "CHALLENGE" => ScenarioDiscipline::Challenge,
        _ => ScenarioDiscipline::Basic,
    };

    let scenario = Scenario {
        id: id.clone(),  // Use path ID, not body ID
        title: body.title,
        description: body.description,
        discipline,
        behavior: body.behavior.map(|b| ScenarioBehavior {
            user_led: b.user_led,
            allow_proactive: b.allow_proactive,
            max_questions: b.max_questions,
            response_style: b.response_style,
            phase: b.phase,
        }),
        product: ProductInfo {
            name: body.product.name,
            summary: body.product.summary,
            audience: body.product.audience,
            problems: body.product.problems,
            goals: body.product.goals,
            differentiators: body.product.differentiators,
            scope: body.product.scope,
            constraints: body.product.constraints,
            timeline: body.product.timeline,
            success_criteria: body.product.success_criteria,
            unique_edge: body.product.unique_edge,
            tech_stack: body.product.tech_stack,
            core_features: body.product.core_features,
        },
        mode: body.mode,
        kickoff_prompt: body.kickoff_prompt,
        evaluation_criteria: body.evaluation_criteria.iter().map(|c| {
            EvaluationCategory {
                name: c.name.clone(),
                weight: c.weight,
                score: None,
                feedback: None,
            }
        }).collect(),
        passing_score: body.passing_score,
        missions: body.missions.map(|missions| {
            missions.into_iter().map(|m| Mission {
                id: m.id,
                title: m.title,
                description: m.description,
                order: m.order,
            }).collect()
        }),
        supplemental_info: body.supplemental_info,
    };

    let repo = ScenarioRepository::new(state.pool.clone());
    let updated = repo.update(&scenario).await
        .map_err(|e| anyhow_error(&format!("Failed to update scenario: {}", e)))?;

    Ok(Json(updated))
}

// Delete a custom scenario
#[utoipa::path(
    delete,
    path = "/scenarios/{id}",
    responses((status = 204, description = "Deleted"))
)]
async fn delete_scenario(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<&'static str>, AppError> {
    // Cannot delete built-in scenarios
    let built_in_ids: Vec<_> = default_scenarios().iter().map(|s| s.id.clone()).collect();
    if built_in_ids.contains(&id) {
        return Err(client_error("組み込みシナリオは削除できません"));
    }

    let repo = ScenarioRepository::new(state.pool.clone());
    repo.delete(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to delete scenario: {}", e)))?;

    Ok(Json("deleted"))
}
```

---

## Step 6: Register Routes

Update the `router_with_state` function in `src/api/mod.rs`:

```rust
pub fn router_with_state(state: SharedState) -> Router {
    Router::new()
        .route("/health", get(health))
        // Scenario routes - UPDATED
        .route("/scenarios", get(list_scenarios).post(create_scenario))
        .route("/scenarios/:id",
            get(get_scenario)
            .put(update_scenario)
            .delete(delete_scenario)
        )
        // Existing routes...
        .route("/sessions", post(create_session).get(list_sessions))
        .route("/sessions/:id", get(get_session).delete(delete_session))
        .route("/sessions/:id/messages", get(list_messages).post(post_message))
        .route("/sessions/:id/evaluate", post(evaluate_session))
        .route("/sessions/:id/comments", get(list_comments).post(create_comment))
        .route("/import", post(import_sessions))
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .with_state(state)
}
```

---

## Step 7: Update OpenAPI Documentation

Update the `ApiDoc` struct to include new endpoints:

```rust
#[derive(OpenApi)]
#[openapi(
    paths(
        list_scenarios,
        get_scenario,
        create_scenario,      // ADD
        update_scenario,      // ADD
        delete_scenario,      // ADD
        health,
        create_session,
        // ... rest of existing paths
    ),
    components(schemas(
        Scenario,
        // ... existing schemas
        CreateScenarioRequest,    // ADD
        ScenarioBehaviorInput,    // ADD
        ProductInfoInput,         // ADD
        RatingCriterionInput,     // ADD
        ScoringGuidelinesInput,   // ADD
        MissionInput,             // ADD
    ))
)]
struct ApiDoc;
```

---

## Testing Your Implementation

### Manual Testing with curl

```bash
# List all scenarios (built-in + custom)
curl http://localhost:3001/scenarios | jq

# Get a specific scenario
curl http://localhost:3001/scenarios/basic-intro-alignment | jq

# Create a custom scenario
curl -X POST http://localhost:3001/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-custom-scenario",
    "title": "カスタムシナリオ",
    "description": "テスト用のシナリオ",
    "discipline": "BASIC",
    "mode": "guided",
    "kickoffPrompt": "こんにちは！",
    "passingScore": 70,
    "product": {
      "name": "テスト製品",
      "summary": "テスト用",
      "audience": "開発者",
      "problems": ["課題1"],
      "goals": ["目標1"],
      "differentiators": ["差別化1"],
      "scope": ["スコープ1"],
      "constraints": ["制約1"],
      "timeline": "今月",
      "successCriteria": ["成功基準1"]
    },
    "evaluationCriteria": [
      {
        "id": "criterion-1",
        "name": "基準1",
        "weight": 100,
        "description": "説明",
        "scoringGuidelines": {
          "excellent": "優秀",
          "good": "良好",
          "needsImprovement": "改善必要",
          "poor": "不十分"
        }
      }
    ]
  }' | jq

# Update the scenario
curl -X PUT http://localhost:3001/scenarios/my-custom-scenario \
  -H "Content-Type: application/json" \
  -d '{ ... updated data ... }' | jq

# Delete the scenario
curl -X DELETE http://localhost:3001/scenarios/my-custom-scenario
```

### Check Swagger UI

Visit http://localhost:3001/docs to see the auto-generated API documentation.

---

## Frontend Integration

Once the backend is ready, update the frontend service to use the API:

```typescript
// frontend/src/services/scenarioService.ts

// Change from localStorage to API calls
export const scenarioService = {
  async createScenario(input: ScenarioInput): Promise<Result<Scenario>> {
    try {
      const response = await fetch(`${env.apiBase}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to create scenario' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (e) {
      return { success: false, error: 'Network error' };
    }
  },

  // Similar updates for other methods...
};
```

---

## Summary Checklist

- [ ] Create database migration for `custom_scenarios` table
- [ ] Add/verify model structs in `src/models/mod.rs`
- [ ] Create `src/db/scenarios.rs` with `ScenarioRepository`
- [ ] Export repository in `src/db/mod.rs`
- [ ] Create `src/services/scenarios.rs` and keep handlers thin
- [ ] Add request types in `src/api/mod.rs`
- [ ] Implement handler functions (create, update, delete)
- [ ] Update `router_with_state` to include new routes
- [ ] Update OpenAPI documentation
- [ ] Test with curl or Swagger UI
- [ ] Update frontend service to use API

---

## Common Pitfalls & Solutions

### 1. "Column not found" errors
Run migrations: `cargo run` (migrations run on startup)

### 2. Serde case mismatch
Ensure `#[serde(rename_all = "camelCase")]` matches frontend expectations

### 3. JSONB parsing fails
Use `.unwrap_or_default()` or proper error handling for optional JSONB fields

### 4. Borrow checker issues
```rust
// Wrong: Moving value in loop
for s in scenarios {
    process(s);  // s is moved
}

// Right: Borrow instead
for s in &scenarios {
    process(s);  // s is borrowed
}
```

### 5. Transaction not committed
Always call `tx.commit().await?` - without it, changes are rolled back.
