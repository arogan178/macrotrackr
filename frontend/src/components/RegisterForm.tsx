import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivityLevelOptions } from '../utils/activityLevels';
import type { ActivityLevel } from '../utils/activityLevels';

type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  gender: 'male' | 'female' | '';
  activityLevel: ActivityLevel | '';
};

const STORAGE_KEY = 'registration_data';
const STEP_STORAGE_KEY = 'registration_step';
const MINIMUM_AGE = 16;

const isOldEnough = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= MINIMUM_AGE;
};

export default function RegisterForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      dateOfBirth: '',
      height: 0,
      weight: 0,
      gender: '',
      activityLevel: '',
    };
  });

  // Save form data and step to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    localStorage.setItem(STEP_STORAGE_KEY, step.toString());
  }, [formData, step]);

  const clearRegistrationData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_STORAGE_KEY);
  };

  const handleBack = (targetStep: number) => {
    setStep(targetStep);
  };

  const handleCancel = () => {
    clearRegistrationData();
    navigate('/login');
  };

  // Cleanup registration data when component unmounts
  useEffect(() => {
    return () => {
      clearRegistrationData();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStepOne = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Only validate email uniqueness
      const response = await fetch('http://localhost:3000/api/auth/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Email validation failed');
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStepTwo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isOldEnough(formData.dateOfBirth)) {
      setError(`You must be at least ${MINIMUM_AGE} years old to register.`);
      return;
    }

    setStep(3);
  };

  const handleStepThree = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Complete registration with all data at once
      const response = await fetch('http://localhost:3000/api/auth/register-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth,
          height: parseFloat(formData.height.toString()),
          weight: parseFloat(formData.weight.toString()),
          gender: formData.gender,
          activityLevel: formData.activityLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const { token } = await response.json();
      // Clear all registration data from localStorage after successful registration
      clearRegistrationData();
      localStorage.setItem('token', token);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStepOne = () => (
    <form onSubmit={handleStepOne} className="space-y-4">
      <div>
        <label className="block mb-2 text-gray-300">First Name</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
        />
      </div>
      <div>
        <label className="block mb-2 text-gray-300">Last Name</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
        />
      </div>
      <div>
        <label className="block mb-2 text-gray-300">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
        />
      </div>
      <div>
        <label className="block mb-2 text-gray-300">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
          minLength={6}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Next'}
      </button>
    </form>
  );

  const renderStepTwo = () => (
    <form onSubmit={handleStepTwo} className="space-y-4">
      <div>
        <label className="block mb-2 text-gray-300">Date of Birth</label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
        />
      </div>
      <div>
        <label className="block mb-2 text-gray-300">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div>
        <label className="block mb-2 text-gray-300">Height (cm)</label>
        <input
          type="number"
          name="height"
          value={formData.height || ''}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
          min="0"
          step="0.1"
        />
      </div>
      <div>
        <label className="block mb-2 text-gray-300">Weight (kg)</label>
        <input
          type="number"
          name="weight"
          value={formData.weight || ''}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
          min="0"
          step="0.1"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleBack(1)}
          className="w-1/2 bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-1/2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Next'}
        </button>
      </div>
    </form>
  );

  const renderStepThree = () => (
    <form onSubmit={handleStepThree} className="space-y-4">
      <div>
        <label className="block mb-2 text-gray-300">Activity Level</label>
        <select
          name="activityLevel"
          value={formData.activityLevel}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
          required
        >
          <option value="">Select activity level</option>
          {getActivityLevelOptions().map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleBack(2)}
          className="w-1/2 bg-gray-600 text-white p-2 rounded hover:bg-gray-700"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-1/2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Complete'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-1 space-x-1">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`h-2 flex-1 rounded ${
                  num <= step ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleCancel}
            className="ml-4 text-sm text-gray-400 hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-100">
          {step === 1 && 'Basic Information'}
          {step === 2 && 'User Details'}
          {step === 3 && 'Activity Level'}
        </h2>
      </div>
      {error && (
        <div className="mb-4 text-red-400 bg-red-900/50 p-3 rounded">{error}</div>
      )}
      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}
    </div>
  );
}