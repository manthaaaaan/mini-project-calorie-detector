import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const emptyDraft = {
  name: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  quantity: 1,
};

export default function MealHistory({ meals, onDelete, onUpdate }) {
  const [editingMealId, setEditingMealId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);

  const startEdit = (meal) => {
    setEditingMealId(meal.id);
    setDraft({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      quantity: meal.quantity,
    });
  };

  const cancelEdit = () => {
    setEditingMealId(null);
    setDraft(emptyDraft);
  };

  const submitEdit = async (mealId) => {
    await onUpdate(mealId, {
      ...draft,
      calories: Number(draft.calories),
      protein: Number(draft.protein),
      carbs: Number(draft.carbs),
      fats: Number(draft.fats),
      quantity: Number(draft.quantity),
    });
    cancelEdit();
  };

  return (
    <div className="glass-card history-card">
      <h2>Meal History</h2>
      <div className="history-list">
        <AnimatePresence>
          {meals.map((meal) => {
            const isEditing = editingMealId === meal.id;
            return (
              <motion.div
                key={meal.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="history-item"
              >
                {isEditing ? (
                  <div className="history-edit-grid">
                    <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    <input type="number" value={draft.calories} onChange={(e) => setDraft({ ...draft, calories: e.target.value })} />
                    <input type="number" value={draft.protein} onChange={(e) => setDraft({ ...draft, protein: e.target.value })} />
                    <input type="number" value={draft.carbs} onChange={(e) => setDraft({ ...draft, carbs: e.target.value })} />
                    <input type="number" value={draft.fats} onChange={(e) => setDraft({ ...draft, fats: e.target.value })} />
                    <input type="number" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
                    <button className="btn-secondary" onClick={() => submitEdit(meal.id)}>Save</button>
                    <button className="btn-danger" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4>{meal.name}</h4>
                      <p>{Math.round(meal.calories)} kcal • P {meal.protein.toFixed(1)}g • C {meal.carbs.toFixed(1)}g • F {meal.fats.toFixed(1)}g</p>
                    </div>
                    <div className="history-actions">
                      <button className="btn-secondary" onClick={() => startEdit(meal)}>Edit</button>
                      <button className="btn-danger" onClick={() => onDelete(meal.id)}>Delete</button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
