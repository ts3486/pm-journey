fn main() {
    // Re-run build when the OpenAPI contract changes.
    println!("cargo:rerun-if-changed=../specs/001-pm-simulation-web/contracts/openapi.yaml");
}
