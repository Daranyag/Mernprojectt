import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layouts/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form client-side before dispatching
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Clear individual error as user types
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    const res = await register({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    setIsSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setServerError(res.message);
      if (res.errors) {
        setErrors(res.errors);
      }
    }
  };

  // Password requirement checklists
  const isLengthValid = formData.password.length >= 8;
  const isMatchValid = formData.password.length > 0 && formData.password === formData.confirmPassword;

  return (
    <AuthLayout
      title="Create your StudySense account"
      subtitle="Start organizing your subjects and tracking your study progress today."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {serverError && (
          <Alert
            type="error"
            message={serverError}
            onDismiss={() => setServerError('')}
            className="mb-2"
          />
        )}

        {/* Full Name */}
        <Input
          id="name"
          label="Full Name"
          type="text"
          placeholder="e.g. Alex Morgan"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon={User}
          required
          autoComplete="name"
        />

        {/* Email Address */}
        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="student@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={Mail}
          required
          autoComplete="email"
        />

        {/* Password */}
        <Input
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 8 characters"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={Lock}
          required
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {/* Confirm Password */}
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Re-enter password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={Lock}
          required
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
              aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {/* Password Guidance indicators */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-800 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1.5">
          <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
            Password Criteria:
          </span>
          <div className="flex items-center gap-2">
            {isLengthValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={isLengthValid ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
              Minimum 8 characters
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isMatchValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={isMatchValid ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
              Passwords match
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isSubmitting}
        >
          Create Account
        </Button>

        {/* Link to login */}
        <p className="text-center text-xs text-slate-600 dark:text-slate-400 pt-2">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Sign In here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
