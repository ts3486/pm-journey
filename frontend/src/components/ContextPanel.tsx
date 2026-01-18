type ContextPanelProps = {
  goals: string[];
  problems: string[];
  audience: string;
  constraints: string[];
  timeline: string;
  successCriteria: string[];
};

export function ContextPanel({
  goals,
  problems,
  audience,
  constraints,
  timeline,
  successCriteria,
}: ContextPanelProps) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
      <div>
        <div className="text-xs font-semibold text-gray-600">Audience</div>
        <p className="text-gray-800">{audience}</p>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">Goals</div>
        <ul className="list-disc pl-4 text-gray-800">
          {goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">Problems</div>
        <ul className="list-disc pl-4 text-gray-800">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">Constraints</div>
        <ul className="list-disc pl-4 text-gray-800">
          {constraints.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">Timeline</div>
        <p className="text-gray-800">{timeline}</p>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">Success Criteria</div>
        <ul className="list-disc pl-4 text-gray-800">
          {successCriteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
