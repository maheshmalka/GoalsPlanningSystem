import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { TextField, type TextFieldProps } from "@mui/material";

type Props<T extends FieldValues> = Omit<TextFieldProps, "name" | "value" | "onChange" | "onBlur" | "error"> & {
  name: Path<T>;
  // Loosened to `any` for the context/output generics: zod's coerce schemas give useForm an
  // output type that differs from the raw input type, and Controller only ever needs the input side.
  control: Control<T, any, any>;
  /** Empty input maps to null instead of "" — for optional numeric/enum fields. */
  nullable?: boolean;
};

export function FormTextField<T extends FieldValues>({ name, control, nullable, ...rest }: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          name={field.name}
          inputRef={field.ref}
          onBlur={field.onBlur}
          value={field.value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            field.onChange(nullable && v === "" ? null : v);
          }}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? rest.helperText}
          fullWidth
        />
      )}
    />
  );
}
