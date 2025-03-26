import Modal from "@/components/Modal";
import { NumberField } from "@/components/form/index";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: number;
  onChange: (value: number | undefined) => void;
  onSave: () => void;
  unit?: string;
  error?: string;
  maxDigits?: number;
}

export default function EditModal({
  isOpen,
  onClose,
  title,
  value,
  onChange,
  onSave,
  unit,
  error,
  maxDigits,
}: EditModalProps) {
  const handleChange = (newValue: number | undefined) => {
    // Only call onChange when we have a valid number
    if (typeof newValue === "number") {
      onChange(newValue);
    }
  };

  return (
    <Modal
      variant="form"
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSave={onSave}
      saveDisabled={!!error}
    >
      <div className="py-4">
        <NumberField
          label="Value"
          value={value}
          onChange={handleChange}
          error={error}
          unit={unit}
          required
          maxDigits={maxDigits}
        />
      </div>
    </Modal>
  );
}
