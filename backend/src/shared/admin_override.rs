/// Returns true when `user_id` is included in `ADMIN_OVERRIDE_USER_IDS`.
///
/// `ADMIN_OVERRIDE_USER_IDS` format: comma-separated user ids, e.g.
/// `auth0|abc123,auth0|def456`.
pub fn is_admin_override_user(user_id: &str) -> bool {
    std::env::var("ADMIN_OVERRIDE_USER_IDS")
        .ok()
        .map(|raw| {
            raw.split(',')
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .any(|value| value == user_id)
        })
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::is_admin_override_user;
    use std::sync::{Mutex, OnceLock};

    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    #[test]
    fn matches_user_from_comma_separated_list() {
        let _guard = env_lock().lock().expect("admin override env lock");
        let original = std::env::var("ADMIN_OVERRIDE_USER_IDS").ok();
        unsafe {
            std::env::set_var(
                "ADMIN_OVERRIDE_USER_IDS",
                "auth0|admin-1, auth0|admin-2,auth0|admin-3",
            );
        }
        assert!(is_admin_override_user("auth0|admin-2"));
        assert!(!is_admin_override_user("auth0|other"));

        unsafe {
            if let Some(value) = original {
                std::env::set_var("ADMIN_OVERRIDE_USER_IDS", value);
            } else {
                std::env::remove_var("ADMIN_OVERRIDE_USER_IDS");
            }
        }
    }

    #[test]
    fn handles_empty_or_missing_env() {
        let _guard = env_lock().lock().expect("admin override env lock");
        let original = std::env::var("ADMIN_OVERRIDE_USER_IDS").ok();
        unsafe {
            std::env::remove_var("ADMIN_OVERRIDE_USER_IDS");
        }
        assert!(!is_admin_override_user("auth0|admin"));

        unsafe {
            std::env::set_var("ADMIN_OVERRIDE_USER_IDS", " ,  , ");
        }
        assert!(!is_admin_override_user("auth0|admin"));

        unsafe {
            if let Some(value) = original {
                std::env::set_var("ADMIN_OVERRIDE_USER_IDS", value);
            } else {
                std::env::remove_var("ADMIN_OVERRIDE_USER_IDS");
            }
        }
    }
}
