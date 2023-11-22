import "./RadioButton.css";

const RadioButton = ({ options, selectedOption, onChange }) => {
  return (
    <div className="radio-button-container">
      {options.map((option) => (
        <label key={option.value} className="radio-label">
          <input
            type="radio"
            value={option.value}
            checked={selectedOption === option.value}
            onChange={onChange}
          />
          <span className="radio-custom"></span>
          {option.label}
        </label>
      ))}
    </div>
  );
};

export default RadioButton;
