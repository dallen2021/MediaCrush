import styles from './SegmentedControl.module.css';

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className={styles.control}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.btn} ${value === opt.value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
