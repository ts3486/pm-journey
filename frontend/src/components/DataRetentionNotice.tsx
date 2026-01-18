export function DataRetentionNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <div className="font-semibold">Data retention</div>
      <p className="mt-1">
        Sessions are stored locally (localStorage/IndexedDB). Clear storage to remove transcripts and evaluations.
        If API mode is enabled, data will sync to the server over HTTPS.
      </p>
    </div>
  );
}
