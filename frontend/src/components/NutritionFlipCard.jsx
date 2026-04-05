import { motion } from "framer-motion";

export default function NutritionFlipCard({ detection }) {
  if (!detection) return null;

  return (
    <motion.div
      className="nutrition-flip"
      initial={{ rotateY: -95, opacity: 0, scale: 0.9 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 110, damping: 13 }}
    >
      <h3>{detection.name}</h3>
      <p className="confidence">Confidence: {Math.round(detection.confidence * 100)}%</p>
      <div className="macro-grid">
        <div>
          <span>Calories</span>
          <strong>{Math.round(detection.calories)}</strong>
        </div>
        <div>
          <span>Protein</span>
          <strong>{detection.protein.toFixed(1)}g</strong>
        </div>
        <div>
          <span>Carbs</span>
          <strong>{detection.carbs.toFixed(1)}g</strong>
        </div>
        <div>
          <span>Fats</span>
          <strong>{detection.fats.toFixed(1)}g</strong>
        </div>
      </div>
    </motion.div>
  );
}
