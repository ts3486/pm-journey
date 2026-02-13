use super::models::{Organization, OrganizationInvitation, OrganizationMember};
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use sqlx::{postgres::PgRow, PgPool, Postgres, Row, Transaction};

#[derive(Clone)]
pub struct OrganizationRepository {
    pool: PgPool,
}

impl OrganizationRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_member(
        &self,
        org_id: &str,
        user_id: &str,
    ) -> Result<Option<OrganizationMember>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                organization_id,
                user_id,
                role,
                status,
                invited_by_user_id,
                to_char(joined_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as joined_at,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
            FROM organization_members
            WHERE organization_id = $1 AND user_id = $2 AND status = 'active'
            "#,
        )
        .bind(org_id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch organization member")?;

        Ok(row.map(Self::map_member_row))
    }

    pub async fn list_active_orgs_for_user(
        &self,
        user_id: &str,
    ) -> Result<Vec<OrganizationMember>> {
        let rows = sqlx::query(
            r#"
            SELECT
                id,
                organization_id,
                user_id,
                role,
                status,
                invited_by_user_id,
                to_char(joined_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as joined_at,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
            FROM organization_members
            WHERE user_id = $1 AND status = 'active'
            ORDER BY created_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .context("Failed to list active organizations for user")?;

        Ok(rows.into_iter().map(Self::map_member_row).collect())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Organization>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                name,
                created_by_user_id,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
            FROM organizations
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch organization")?;

        Ok(row.map(Self::map_org_row))
    }

    pub async fn create(&self, org: &Organization, creator_user_id: &str) -> Result<Organization> {
        let mut tx = self.pool.begin().await?;
        self.create_in_tx(&mut tx, org, creator_user_id).await?;
        tx.commit().await?;

        self.get_by_id(&org.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created organization"))
    }

    pub async fn create_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        org: &Organization,
        creator_user_id: &str,
    ) -> Result<()> {
        let created_at: DateTime<Utc> = org
            .created_at
            .parse()
            .context("Failed to parse created_at timestamp")?;

        let updated_at: DateTime<Utc> = org
            .updated_at
            .parse()
            .context("Failed to parse updated_at timestamp")?;

        sqlx::query(
            r#"
            INSERT INTO organizations (
                id, name, created_by_user_id, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(&org.id)
        .bind(&org.name)
        .bind(&org.created_by_user_id)
        .bind(created_at)
        .bind(updated_at)
        .execute(&mut **tx)
        .await
        .context("Failed to insert organization")?;

        let member_id = format!("org_member_{}", uuid::Uuid::new_v4());
        sqlx::query(
            r#"
            INSERT INTO organization_members (
                id, organization_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, 'owner', 'active', NULL, $4, $5, $6)
            "#,
        )
        .bind(member_id)
        .bind(&org.id)
        .bind(creator_user_id)
        .bind(created_at)
        .bind(created_at)
        .bind(updated_at)
        .execute(&mut **tx)
        .await
        .context("Failed to insert organization member")?;

        Ok(())
    }

    pub async fn update_name(&self, org_id: &str, name: &str) -> Result<Option<Organization>> {
        sqlx::query(
            r#"
            UPDATE organizations
            SET name = $2, updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(org_id)
        .bind(name)
        .execute(&self.pool)
        .await
        .context("Failed to update organization")?;

        self.get_by_id(org_id).await
    }

    pub async fn list_members(&self, org_id: &str) -> Result<Vec<OrganizationMember>> {
        let rows = sqlx::query(
            r#"
            SELECT
                id,
                organization_id,
                user_id,
                role,
                status,
                invited_by_user_id,
                to_char(joined_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as joined_at,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
            FROM organization_members
            WHERE organization_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(org_id)
        .fetch_all(&self.pool)
        .await
        .context("Failed to list organization members")?;

        Ok(rows.into_iter().map(Self::map_member_row).collect())
    }

    pub async fn find_member_by_id(
        &self,
        org_id: &str,
        member_id: &str,
    ) -> Result<Option<OrganizationMember>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                organization_id,
                user_id,
                role,
                status,
                invited_by_user_id,
                to_char(joined_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as joined_at,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
            FROM organization_members
            WHERE organization_id = $1 AND id = $2
            "#,
        )
        .bind(org_id)
        .bind(member_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch organization member by id")?;

        Ok(row.map(Self::map_member_row))
    }

    pub async fn update_member(
        &self,
        org_id: &str,
        member_id: &str,
        role: Option<&str>,
        status: Option<&str>,
    ) -> Result<Option<OrganizationMember>> {
        sqlx::query(
            r#"
            UPDATE organization_members
            SET
                role = COALESCE($3, role),
                status = COALESCE($4, status),
                joined_at = CASE
                    WHEN COALESCE($4, status) = 'active' AND joined_at IS NULL THEN NOW()
                    ELSE joined_at
                END,
                updated_at = NOW()
            WHERE organization_id = $1 AND id = $2
            "#,
        )
        .bind(org_id)
        .bind(member_id)
        .bind(role)
        .bind(status)
        .execute(&self.pool)
        .await
        .context("Failed to update organization member")?;

        self.find_member_by_id(org_id, member_id).await
    }

    pub async fn delete_member(&self, org_id: &str, member_id: &str) -> Result<bool> {
        let result = sqlx::query(
            r#"
            DELETE FROM organization_members
            WHERE organization_id = $1 AND id = $2
            "#,
        )
        .bind(org_id)
        .bind(member_id)
        .execute(&self.pool)
        .await
        .context("Failed to delete organization member")?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn count_active_members(&self, org_id: &str) -> Result<i64> {
        let row = sqlx::query(
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM organization_members
            WHERE organization_id = $1 AND status = 'active'
            "#,
        )
        .bind(org_id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to count active members")?;

        Ok(row.try_get::<i64, _>("count").unwrap_or(0))
    }

    pub async fn count_pending_invitations(&self, org_id: &str) -> Result<i64> {
        let row = sqlx::query(
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM organization_invitations
            WHERE organization_id = $1 AND status = 'pending' AND expires_at > NOW()
            "#,
        )
        .bind(org_id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to count pending invitations")?;

        Ok(row.try_get::<i64, _>("count").unwrap_or(0))
    }

    pub async fn get_active_seat_limit(&self, org_id: &str) -> Result<Option<i32>> {
        let row = sqlx::query(
            r#"
            SELECT seat_quantity
            FROM subscriptions
            WHERE organization_id = $1
              AND plan_code = 'TEAM'
              AND status IN ('active', 'trialing')
            ORDER BY updated_at DESC
            LIMIT 1
            "#,
        )
        .bind(org_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch active seat limit")?;

        Ok(row.and_then(|r| r.try_get::<Option<i32>, _>("seat_quantity").ok().flatten()))
    }

    pub async fn create_invitation(
        &self,
        invitation: &OrganizationInvitation,
    ) -> Result<OrganizationInvitation> {
        let expires_at: DateTime<Utc> = invitation
            .expires_at
            .parse()
            .context("Failed to parse invitation expires_at timestamp")?;
        let created_at: DateTime<Utc> = invitation
            .created_at
            .parse()
            .context("Failed to parse invitation created_at timestamp")?;

        sqlx::query(
            r#"
            INSERT INTO organization_invitations (
                id, organization_id, email, role, invite_token_hash, expires_at, status, created_by_user_id, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
        )
        .bind(&invitation.id)
        .bind(&invitation.organization_id)
        .bind(&invitation.email)
        .bind(&invitation.role)
        .bind(&invitation.invite_token_hash)
        .bind(expires_at)
        .bind(&invitation.status)
        .bind(&invitation.created_by_user_id)
        .bind(created_at)
        .execute(&self.pool)
        .await
        .context("Failed to create organization invitation")?;

        self.get_invitation_by_id(&invitation.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to fetch created invitation"))
    }

    pub async fn find_pending_invitation_by_email(
        &self,
        org_id: &str,
        email: &str,
    ) -> Result<Option<OrganizationInvitation>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                organization_id,
                email,
                role,
                invite_token_hash,
                to_char(expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as expires_at,
                status,
                created_by_user_id,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM organization_invitations
            WHERE organization_id = $1
              AND LOWER(email) = LOWER($2)
              AND status = 'pending'
              AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind(org_id)
        .bind(email)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch pending invitation by email")?;

        Ok(row.map(Self::map_invitation_row))
    }

    pub async fn find_invitation_by_token(
        &self,
        invite_token_hash: &str,
    ) -> Result<Option<OrganizationInvitation>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                organization_id,
                email,
                role,
                invite_token_hash,
                to_char(expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as expires_at,
                status,
                created_by_user_id,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM organization_invitations
            WHERE invite_token_hash = $1
            LIMIT 1
            "#,
        )
        .bind(invite_token_hash)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch invitation by token hash")?;

        Ok(row.map(Self::map_invitation_row))
    }

    pub async fn get_invitation_by_id(
        &self,
        invitation_id: &str,
    ) -> Result<Option<OrganizationInvitation>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                organization_id,
                email,
                role,
                invite_token_hash,
                to_char(expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as expires_at,
                status,
                created_by_user_id,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM organization_invitations
            WHERE id = $1
            "#,
        )
        .bind(invitation_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch invitation by id")?;

        Ok(row.map(Self::map_invitation_row))
    }

    pub async fn update_invitation_status(
        &self,
        invitation_id: &str,
        status: &str,
    ) -> Result<Option<OrganizationInvitation>> {
        sqlx::query(
            r#"
            UPDATE organization_invitations
            SET status = $2
            WHERE id = $1
            "#,
        )
        .bind(invitation_id)
        .bind(status)
        .execute(&self.pool)
        .await
        .context("Failed to update invitation status")?;

        self.get_invitation_by_id(invitation_id).await
    }

    pub async fn create_member(
        &self,
        org_id: &str,
        user_id: &str,
        role: &str,
        invited_by_user_id: &str,
    ) -> Result<OrganizationMember> {
        let member_id = format!("org_member_{}", uuid::Uuid::new_v4());
        sqlx::query(
            r#"
            INSERT INTO organization_members (
                id, organization_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, 'active', $5, NOW(), NOW(), NOW())
            ON CONFLICT (organization_id, user_id)
            DO UPDATE SET
                status = 'active',
                role = EXCLUDED.role,
                invited_by_user_id = EXCLUDED.invited_by_user_id,
                joined_at = NOW(),
                updated_at = NOW()
            "#,
        )
        .bind(member_id)
        .bind(org_id)
        .bind(user_id)
        .bind(role)
        .bind(invited_by_user_id)
        .execute(&self.pool)
        .await
        .context("Failed to upsert organization member")?;

        self.find_member(org_id, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to fetch created organization member"))
    }

    fn map_member_row(r: PgRow) -> OrganizationMember {
        OrganizationMember {
            id: r.get("id"),
            organization_id: r.get("organization_id"),
            user_id: r.get("user_id"),
            role: r.get("role"),
            status: r.get("status"),
            invited_by_user_id: r
                .try_get::<Option<String>, _>("invited_by_user_id")
                .unwrap_or(None),
            joined_at: r.try_get::<Option<String>, _>("joined_at").unwrap_or(None),
            created_at: r
                .try_get::<Option<String>, _>("created_at")
                .unwrap_or(None)
                .unwrap_or_default(),
            updated_at: r
                .try_get::<Option<String>, _>("updated_at")
                .unwrap_or(None)
                .unwrap_or_default(),
        }
    }

    fn map_org_row(r: PgRow) -> Organization {
        Organization {
            id: r.get("id"),
            name: r.get("name"),
            created_by_user_id: r.get("created_by_user_id"),
            created_at: r
                .try_get::<Option<String>, _>("created_at")
                .unwrap_or(None)
                .unwrap_or_default(),
            updated_at: r
                .try_get::<Option<String>, _>("updated_at")
                .unwrap_or(None)
                .unwrap_or_default(),
        }
    }

    fn map_invitation_row(r: PgRow) -> OrganizationInvitation {
        OrganizationInvitation {
            id: r.get("id"),
            organization_id: r.get("organization_id"),
            email: r.get("email"),
            role: r.get("role"),
            invite_token_hash: r.get("invite_token_hash"),
            expires_at: r
                .try_get::<Option<String>, _>("expires_at")
                .unwrap_or(None)
                .unwrap_or_default(),
            status: r.get("status"),
            created_by_user_id: r.get("created_by_user_id"),
            created_at: r
                .try_get::<Option<String>, _>("created_at")
                .unwrap_or(None)
                .unwrap_or_default(),
        }
    }
}
