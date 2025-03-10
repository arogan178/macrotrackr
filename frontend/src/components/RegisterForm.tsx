import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivityLevelOptions } from '../utils/activityLevels';
import type { ActivityLevel } from '../utils/activityLevels';
import FloatingNotification from "./FloatingNotification";

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

  const InputField = ({ 
    label, 
    name, 
    type, 
    value, 
    onChange, 
    required = true, 
    min, 
    step,
    icon,
    placeholder
  }: { 
    label: string;
    name: string;
    type: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    required?: boolean;
    min?: string;
    step?: string;
    icon?: React.ReactNode;
    placeholder?: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 bg-gray-700/70 border border-gray-600/70 rounded-lg text-gray-100 
                   focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                   transition-all duration-200 shadow-sm`}
          required={required}
          min={min}
          step={step}
          placeholder={placeholder}
        />
      </div>
    </div>
  );

  const SelectField = ({
    label,
    name,
    value,
    onChange,
    options,
    required = true
  }: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-gray-700/70 border border-gray-600/70 rounded-lg text-gray-100 
                 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                 transition-all duration-200 shadow-sm appearance-none"
        required={required}
      >
        <option value="">{`Select ${label.toLowerCase()}`}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderStepOne = () => (
    <form onSubmit={handleStepOne} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="First Name"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          placeholder="John"
        />
        <InputField
          label="Last Name"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          placeholder="Doe"
        />
      </div>
      <InputField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
        placeholder="your@email.com"
      />
      <InputField
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        placeholder="••••••••"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg font-medium text-white 
                 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                 shadow-lg shadow-indigo-500/30"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            Continue
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </span>
        )}
      </button>
    </form>
  );

  const renderStepTwo = () => (
    <form onSubmit={handleStepTwo} className="space-y-5">
      <InputField
        label="Date of Birth"
        name="dateOfBirth"
        type="date"
        value={formData.dateOfBirth}
        onChange={handleChange}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />

      <SelectField
        label="Gender"
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' }
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Height (cm)"
          name="height"
          type="number"
          value={formData.height || ''}
          onChange={handleChange}
          min="0"
          step="0.1"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
          placeholder="175"
        />

        <InputField
          label="Weight (kg)"
          name="weight"
          type="number"
          value={formData.weight || ''}
          onChange={handleChange}
          min="0"
          step="0.1"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          placeholder="70"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleBack(1)}
          className="w-1/3 py-3 px-4 rounded-lg border border-gray-600/50 text-gray-300 hover:bg-gray-700/50 transition-colors flex items-center justify-center"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
          </svg>
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-2/3 py-3 rounded-lg font-medium text-white 
                   bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                   disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                   shadow-lg shadow-indigo-500/30 flex items-center justify-center"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              Continue
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </span>
          )}
        </button>
      </div>
    </form>
  );

  const renderStepThree = () => (
    <form onSubmit={handleStepThree} className="space-y-5">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-200 mb-1">Almost there!</h3>
        <p className="text-sm text-gray-400">
          Please select your activity level to help us calculate your daily calorie needs.
        </p>
      </div>
      
      <SelectField
        label="Activity Level"
        name="activityLevel"
        value={formData.activityLevel}
        onChange={handleChange}
        options={getActivityLevelOptions()}
      />
      
      <div className="space-y-3 mt-6">
        <div className="flex items-center p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10">
          <svg className="w-5 h-5 text-indigo-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-indigo-300">
            Your activity level helps us calculate your daily energy requirements more accurately.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={() => handleBack(2)}
          className="w-1/3 py-3 px-4 rounded-lg border border-gray-600/50 text-gray-300 hover:bg-gray-700/50 transition-colors flex items-center justify-center"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
          </svg>
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-2/3 py-3 rounded-lg font-medium text-white 
                   bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                   disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                   shadow-lg shadow-indigo-500/30 flex items-center justify-center"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              Complete Registration
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
              </svg>
            </span>
          )}
        </button>
      </div>
    </form>
  );

  // Step indicators with titles for better visual feedback
  const stepInfo = [
    { title: 'Account Info', icon: '👤' },
    { title: 'Your Profile', icon: '📊' },
    { title: 'Activity Level', icon: '🏃' }
  ];

  return (
    <div className="max-w-md w-full p-8 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 flex space-x-2">
            {stepInfo.map((info, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full mb-1
                      ${idx + 1 === step 
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white border-2 border-white/20' 
                        : idx + 1 < step 
                          ? 'bg-indigo-500/50 text-white' 
                          : 'bg-gray-700 text-gray-400'}`}>
                  {idx + 1 < step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`text-xs ${idx + 1 === step ? 'text-white' : 'text-gray-400'}`}>
                  {info.title}
                </span>
                <div 
                  className={`${idx < 2 ? 'block' : 'hidden'} h-0.5 w-full absolute mt-4
                        ${idx + 1 < step ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleCancel}
            className="text-sm text-gray-400 hover:text-gray-300 flex items-center"
            type="button"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancel
          </button>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          {step === 1 && 'Create Your Account'}
          {step === 2 && 'Tell Us About Yourself'}
          {step === 3 && 'Almost Done!'}
        </h2>
        <p className="mt-1 text-gray-400 text-sm">
          {step === 1 && 'Enter your basic details to get started'}
          {step === 2 && 'This helps us customize your experience'}
          {step === 3 && 'Just one more step to complete your profile'}
        </p>
      </div>
      
      <FloatingNotification error={error} />
      
      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}

    </div>
  );
}