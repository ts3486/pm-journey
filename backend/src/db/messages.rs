use sqlx::{PgPool, Postgres, Transaction};
use crate::models::{Message, MessageRole, MessageTag};
use anyhow::{Result, Context};
use chrono::{DateTime, Utc};

#[derive(Clone)]
pub struct MessageRepository {
    pool: PgPool,
}

impl MessageRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    #[allow(dead_code)]
    pub async fn create(&self, message: &Message) -> Result<Message> {
        let mut tx = self.pool.begin().await?;
        self.create_in_tx(&mut tx, message).await?;
        tx.commit().await?;

        self.get(&message.id).await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created message"))
    }

    pub async fn create_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        message: &Message,
    ) -> Result<()> {
        let role = match message.role {
            MessageRole::User => "user",
            MessageRole::Agent => "agent",
            MessageRole::System => "system",
        };

        let tags: Option<Vec<String>> = message.tags.as_ref().map(|tags| {
            tags.iter().map(|t| match t {
                MessageTag::Decision => "decision",
                MessageTag::Assumption => "assumption",
                MessageTag::Risk => "risk",
                MessageTag::NextAction => "next_action",
                MessageTag::Summary => "summary",
            }.to_string()).collect()
        });

        let created_at: DateTime<Utc> = message.created_at.parse()
            .context("Failed to parse created_at timestamp")?;

        sqlx::query!(
            r#"
            INSERT INTO messages (
                id, session_id, role, content, created_at, tags, queued_offline
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            message.id,
            message.session_id,
            role,
            message.content,
            created_at,
            tags.as_deref(),
            message.queued_offline,
        )
        .execute(&mut **tx)
        .await
        .context("Failed to insert message")?;

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn get(&self, id: &str) -> Result<Option<Message>> {
        let row = sqlx::query!(
            r#"
            SELECT
                id, session_id, role, content,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                tags, queued_offline
            FROM messages
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch message")?;

        Ok(row.map(|r| {
            let role = match r.role.as_str() {
                "user" => MessageRole::User,
                "agent" => MessageRole::Agent,
                "system" => MessageRole::System,
                _ => MessageRole::User,
            };

            let tags = r.tags.map(|tag_strs| {
                tag_strs.iter().filter_map(|t| match t.as_str() {
                    "decision" => Some(MessageTag::Decision),
                    "assumption" => Some(MessageTag::Assumption),
                    "risk" => Some(MessageTag::Risk),
                    "next_action" => Some(MessageTag::NextAction),
                    "summary" => Some(MessageTag::Summary),
                    _ => None,
                }).collect()
            });

            Message {
                id: r.id,
                session_id: r.session_id,
                role,
                content: r.content,
                created_at: r.created_at.unwrap_or_default(),
                tags,
                queued_offline: r.queued_offline,
            }
        }))
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<Message>> {
        let rows = sqlx::query!(
            r#"
            SELECT
                id, session_id, role, content,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                tags, queued_offline
            FROM messages
            WHERE session_id = $1
            ORDER BY created_at ASC
            "#,
            session_id
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to list messages")?;

        Ok(rows.into_iter().map(|r| {
            let role = match r.role.as_str() {
                "user" => MessageRole::User,
                "agent" => MessageRole::Agent,
                "system" => MessageRole::System,
                _ => MessageRole::User,
            };

            let tags = r.tags.map(|tag_strs| {
                tag_strs.iter().filter_map(|t| match t.as_str() {
                    "decision" => Some(MessageTag::Decision),
                    "assumption" => Some(MessageTag::Assumption),
                    "risk" => Some(MessageTag::Risk),
                    "next_action" => Some(MessageTag::NextAction),
                    "summary" => Some(MessageTag::Summary),
                    _ => None,
                }).collect()
            });

            Message {
                id: r.id,
                session_id: r.session_id,
                role,
                content: r.content,
                created_at: r.created_at.unwrap_or_default(),
                tags,
                queued_offline: r.queued_offline,
            }
        }).collect())
    }

    #[allow(dead_code)]
    pub async fn delete_by_session(&self, session_id: &str) -> Result<()> {
        sqlx::query!("DELETE FROM messages WHERE session_id = $1", session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete messages")?;

        Ok(())
    }
}
