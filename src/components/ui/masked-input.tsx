import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  formatCPFOrCNPJ, 
  formatPhone, 
  formatCEP,
  isValidCPFOrCNPJ,
  isValidEmail,
  isValidCEP
} from "@/lib/masks";

export type MaskType = 'cpf_cnpj' | 'phone' | 'cep' | 'email';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  showValidation?: boolean;
}

const formatters: Record<MaskType, (value: string) => string> = {
  cpf_cnpj: formatCPFOrCNPJ,
  phone: formatPhone,
  cep: formatCEP,
  email: (v) => v, // No formatting for email
};

const validators: Record<MaskType, (value: string) => boolean> = {
  cpf_cnpj: (v) => !v || isValidCPFOrCNPJ(v),
  phone: (v) => !v || v.replace(/\D/g, '').length >= 10,
  cep: (v) => !v || isValidCEP(v),
  email: (v) => !v || isValidEmail(v),
};

const placeholders: Record<MaskType, string> = {
  cpf_cnpj: '000.000.000-00',
  phone: '(00) 00000-0000',
  cep: '00000-000',
  email: 'email@exemplo.com',
};

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, showValidation = true, className, ...props }, ref) => {
    const [isTouched, setIsTouched] = React.useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formattedValue = formatters[mask](rawValue);
      const isValid = validators[mask](formattedValue);
      onChange(formattedValue, isValid);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsTouched(true);
      props.onBlur?.(e);
    };

    const isValid = validators[mask](value);
    const showError = showValidation && isTouched && value && !isValid;

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={props.placeholder || placeholders[mask]}
        className={cn(
          showError && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";
