import { ErrorMessage } from "@hookform/error-message";

/**
 * Renders a field's validation error next to the field.
 *
 * The message is given an id so the input can point at it with
 * `aria-describedby`, and it is announced with `role="alert"`.
 */
export function FormError({
  name,
  id,
}: {
  name: string;
  /** Id of the message element. Defaults to `<name>-error`. */
  id?: string;
}) {
  const messageId = id ?? `${name}-error`;
  return (
    <ErrorMessage
      name={name}
      render={({ message }) => (
        <p id={messageId} role="alert" className="text-destructive text-xs mt-1">
          {message}
        </p>
      )}
    />
  );
}
