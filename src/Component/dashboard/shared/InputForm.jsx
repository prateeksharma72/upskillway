import React from 'react';
import './InputForm.scss'; // Changed to .scss

const InputForm = ({ fields, onSubmit, buttonText = "Fetch Data", isLoading }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = {};
    fields.forEach(field => {
      formData[field.name] = event.target[field.name].value;
    });
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="input-form">
      {fields.map(field => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name}>{field.label}:</label>
          <input
            type={field.type || "text"}
            id={field.name}
            name={field.name}
            defaultValue={field.defaultValue || ''} // Ensure controlled/uncontrolled consistency
            placeholder={field.placeholder || field.label}
            required={field.required !== false}
          />
        </div>
      ))}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Fetching...' : buttonText}
      </button>
    </form>
  );
};

export default InputForm;