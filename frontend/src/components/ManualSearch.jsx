import { useMemo, useState } from "react";

export default function ManualSearch({ results, onSearch, onAdd }) {
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState(1);

  const normalizedQty = useMemo(() => Math.max(Number(qty) || 1, 0.1), [qty]);

  return (
    <div className="glass-card manual-card">
      <h2>Manual Food Search</h2>
      <div className="manual-controls">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods"
        />
        <button className="btn-primary" onClick={() => onSearch(query)}>Search</button>
      </div>
      <label className="qty-label">
        Quantity multiplier
        <input type="number" step="0.1" min="0.1" value={qty} onChange={(e) => setQty(e.target.value)} />
      </label>
      <div className="manual-list">
        {results.map((food) => (
          <div className="manual-item" key={food.id}>
            <div>
              <h4>{food.name}</h4>
              <p>{food.serving} • {Math.round(food.calories)} kcal</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() =>
                onAdd({
                  name: food.name,
                  calories: food.calories * normalizedQty,
                  protein: food.protein * normalizedQty,
                  carbs: food.carbs * normalizedQty,
                  fats: food.fats * normalizedQty,
                  quantity: normalizedQty,
                })
              }
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
