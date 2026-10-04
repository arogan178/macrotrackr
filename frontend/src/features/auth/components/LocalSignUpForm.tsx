import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";
import { queryKeys } from "@/lib/queryKeys";
import { useStore } from "@/store/store";

interface LocalSignUpFormProps {
  onSwitchToSignIn: () => void;
  redirectTo?: string;
}

export function LocalSignUpForm({
  onSwitchToSignIn,
  redirectTo,
}: LocalSignUpFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showNotification } = useStore();

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authApi.register({
          email: value.email.trim().toLowerCase(),
          password: value.password,
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.auth.session(),
        });
        showNotification("Account created successfully!", "success");

        const destination = normalizeAuthRedirect(redirectTo);
        if (destination === "/home") {
          navigate({
            to: "/home",
            search: { limit: 20, offset: 0 },
            replace: true,
          });
        } else {
          navigate({
            to: destination as any,
            replace: true,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to create account. Please try again.";
        showNotification(message, "error");
      }
    },
  });
  const isSubmitting = useFormStore(form.store, (state) => state.isSubmitting);

  return (
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form.Field name="firstName">
            {(field) => (
              <TextField
                label="First Name"
                value={field.state.value}
                onChange={field.handleChange}
                required
                placeholder="John"
                textOnly
                name="firstName"
                autoComplete="given-name"
              />
            )}
          </form.Field>
          <form.Field name="lastName">
            {(field) => (
              <TextField
                label="Last Name"
                value={field.state.value}
                onChange={field.handleChange}
                required
                placeholder="Doe"
                textOnly
                name="lastName"
                autoComplete="family-name"
              />
            )}
          </form.Field>
        </div>

        <form.Field name="email">
          {(field) => (
            <TextField
              label="Email"
              value={field.state.value}
              onChange={field.handleChange}
              type="email"
              required
              placeholder="your@email.com"
              name="email"
              autoComplete="email"
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <TextField
              label="Password"
              value={field.state.value}
              onChange={field.handleChange}
              type="password"
              required
              placeholder="••••••••"
              name="password"
              autoComplete="new-password"
            />
          )}
        </form.Field>

        <form.Field
          name="confirmPassword"
          validators={{
            onSubmit: ({ value, fieldApi }) =>
              value === fieldApi.form.getFieldValue("password")
                ? undefined
                : "Passwords do not match.",
          }}
        >
          {(field) => (
            <TextField
              label="Confirm Password"
              value={field.state.value}
              onChange={field.handleChange}
              type="password"
              required
              placeholder="••••••••"
              name="confirmPassword"
              autoComplete="new-password"
              error={field.state.meta.errors[0]}
            />
          )}
        </form.Field>

        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Creating account..."
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <span className="text-muted">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="inline-flex min-h-11 items-center rounded-control px-3 py-2 font-medium text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
