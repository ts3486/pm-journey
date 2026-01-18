use backend::models::{MessageRole, MessageTag};

#[test]
fn message_tags_enum_values() {
    assert_eq!(format!("{:?}", MessageRole::User), "User");
    assert_eq!(format!("{:?}", MessageTag::Decision), "Decision");
}
