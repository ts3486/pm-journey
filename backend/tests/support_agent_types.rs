use backend::models::{AssistanceMode, DeliverableFormat, TaskDefinition, TaskTemplate};

#[test]
fn deliverable_format_serializes_to_kebab_case() {
    let json = serde_json::to_string(&DeliverableFormat::FreeText).unwrap();
    assert_eq!(json, "\"free-text\"");

    let json = serde_json::to_string(&DeliverableFormat::Structured).unwrap();
    assert_eq!(json, "\"structured\"");

    let json = serde_json::to_string(&DeliverableFormat::Checklist).unwrap();
    assert_eq!(json, "\"checklist\"");

    let json = serde_json::to_string(&DeliverableFormat::Table).unwrap();
    assert_eq!(json, "\"table\"");
}

#[test]
fn deliverable_format_deserializes_from_kebab_case() {
    let val: DeliverableFormat = serde_json::from_str("\"free-text\"").unwrap();
    assert_eq!(val, DeliverableFormat::FreeText);

    let val: DeliverableFormat = serde_json::from_str("\"structured\"").unwrap();
    assert_eq!(val, DeliverableFormat::Structured);
}

#[test]
fn assistance_mode_serializes_to_kebab_case() {
    let json = serde_json::to_string(&AssistanceMode::HandsOff).unwrap();
    assert_eq!(json, "\"hands-off\"");

    let json = serde_json::to_string(&AssistanceMode::OnRequest).unwrap();
    assert_eq!(json, "\"on-request\"");

    let json = serde_json::to_string(&AssistanceMode::Guided).unwrap();
    assert_eq!(json, "\"guided\"");

    let json = serde_json::to_string(&AssistanceMode::Review).unwrap();
    assert_eq!(json, "\"review\"");
}

#[test]
fn assistance_mode_deserializes_from_kebab_case() {
    let val: AssistanceMode = serde_json::from_str("\"hands-off\"").unwrap();
    assert_eq!(val, AssistanceMode::HandsOff);

    let val: AssistanceMode = serde_json::from_str("\"on-request\"").unwrap();
    assert_eq!(val, AssistanceMode::OnRequest);
}

#[test]
fn task_definition_full_roundtrip() {
    let task = TaskDefinition {
        instruction: "チケットの目的と受入条件を整理してください。".to_string(),
        deliverable_format: DeliverableFormat::Structured,
        template: Some(TaskTemplate {
            format: DeliverableFormat::Structured,
            sections: Some(vec![
                "目的".to_string(),
                "受入条件".to_string(),
            ]),
            example: Some("## 目的\nサンプル".to_string()),
            checklist: None,
        }),
        reference_info: Some("背景情報".to_string()),
        hints: Some(vec!["ヒント1".to_string()]),
    };

    let json = serde_json::to_string(&task).unwrap();
    let parsed: TaskDefinition = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed.instruction, task.instruction);
    assert_eq!(parsed.deliverable_format, DeliverableFormat::Structured);
    assert!(parsed.template.is_some());
    let tmpl = parsed.template.unwrap();
    assert_eq!(tmpl.sections.unwrap().len(), 2);
    assert_eq!(parsed.reference_info.unwrap(), "背景情報");
    assert_eq!(parsed.hints.unwrap().len(), 1);
}

#[test]
fn task_definition_minimal_deserializes() {
    let json = r#"{"instruction":"やること","deliverableFormat":"free-text"}"#;
    let task: TaskDefinition = serde_json::from_str(json).unwrap();
    assert_eq!(task.instruction, "やること");
    assert_eq!(task.deliverable_format, DeliverableFormat::FreeText);
    assert!(task.template.is_none());
    assert!(task.reference_info.is_none());
    assert!(task.hints.is_none());
}

#[test]
fn task_definition_camel_case_fields() {
    let json = r#"{
        "instruction": "テスト",
        "deliverableFormat": "checklist",
        "referenceInfo": "参考情報",
        "hints": ["h1", "h2"]
    }"#;
    let task: TaskDefinition = serde_json::from_str(json).unwrap();
    assert_eq!(task.deliverable_format, DeliverableFormat::Checklist);
    assert_eq!(task.reference_info.unwrap(), "参考情報");
    assert_eq!(task.hints.unwrap().len(), 2);
}
