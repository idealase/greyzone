import { useState, useMemo } from "react";
import { GLOSSARY_ENTRIES, GlossaryEntry } from "../../data/glossary";

const CATEGORY_LABELS: Record<GlossaryEntry["category"], string> = {
  metric: "📊 Metrics",
  mechanic: "⚙️ Mechanics",
  domain: "🌐 Domains",
  phase: "📈 Phases",
  action: "⚔️ Actions",
};

const CATEGORY_ORDER: GlossaryEntry["category"][] = [
  "metric", "mechanic", "domain", "phase", "action",
];

interface GlossaryProps {
  initialFilter?: string;
}

export default function Glossary({ initialFilter = "" }: GlossaryProps) {
  const [search, setSearch] = useState(initialFilter);
  const [activeCategory, setActiveCategory] = useState<GlossaryEntry["category"] | "all">("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return GLOSSARY_ENTRIES.filter((entry) => {
      if (activeCategory !== "all" && entry.category !== activeCategory) return false;
      if (!q) return true;
      return (
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const groups: Partial<Record<GlossaryEntry["category"], GlossaryEntry[]>> = {};
    for (const entry of filtered) {
      (groups[entry.category] ??= []).push(entry);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="glossary">
      <div className="glossary__search">
        <input
          type="text"
          className="form-input"
          placeholder="Search terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="glossary__categories">
        <button
          className={`glossary__cat-btn${activeCategory === "all" ? " glossary__cat-btn--active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          All
        </button>
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            className={`glossary__cat-btn${activeCategory === cat ? " glossary__cat-btn--active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="glossary__content">
        {filtered.length === 0 ? (
          <div className="glossary__empty">No matching terms found.</div>
        ) : (
          CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
            <div key={cat} className="glossary__group">
              <div className="glossary__group-title">{CATEGORY_LABELS[cat]}</div>
              {grouped[cat]!.map((entry) => (
                <div key={entry.term} className="glossary__entry">
                  <div className="glossary__term">{entry.term}</div>
                  <div className="glossary__def">{entry.definition}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
