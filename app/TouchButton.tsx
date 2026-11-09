import type { ButtonHTMLAttributes } from "react";

type Props = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "onPointerDown"
> & { onPress: () => void };

// Pointer-down works while another finger is dragging the keeper. Keyboard and
// assistive-technology clicks still work, without firing the action twice.
export function TouchButton({ onPress, disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled}
      onPointerDown={(event) => {
        if (disabled || (event.pointerType === "mouse" && event.button !== 0))
          return;
        event.preventDefault();
        onPress();
      }}
      onClick={(event) => {
        if (!disabled && event.detail === 0) onPress();
      }}
    />
  );
}
