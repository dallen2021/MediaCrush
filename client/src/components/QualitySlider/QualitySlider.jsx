import styles from './QualitySlider.module.css';

export default function QualitySlider({ value, onChange }) {
  return (
    <div className={styles.row}>
      <input type="range" className={styles.slider} min="1" max="100" value={value} onChange={e => onChange(Number(e.target.value))} />
      <span className={styles.value}>{value}</span>
    </div>
  );
}
