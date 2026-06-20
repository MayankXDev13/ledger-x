import { ErrorMessage } from "@hookform/error-message";

export function FormError({ name }: { name: string }) {
  return (
    <ErrorMessage
      name={name}
      render={({ message }) => (
        <p className="text-destructive text-xs mt-1">{message}</p>
      )}
    />
  );
}