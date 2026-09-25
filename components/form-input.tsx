import React from 'react';
import { useFormContext } from 'react-hook-form';
import { claseCampo, claseEtiqueta, claseError } from './ui/campo';

type FormInputProps = {
    label: string;
    name: string;
    type?: string;
};

const FormInput: React.FC<FormInputProps> = ({
    label,
    name,
    type = 'text',
}) => {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    const mensajeError = errors[name]?.message as string | undefined;
    const idError = `${name}-error`;

    return (
        <div>
            <label htmlFor={name} className={claseEtiqueta}>
                {label}
            </label>
            <input
                // `id` conecta el <input> con el htmlFor del <label>: así un
                // clic en la etiqueta enfoca el campo y el lector de pantalla
                // lee el nombre. `register` no pone id, solo name.
                id={name}
                type={type}
                className={claseCampo}
                // aria-invalid pinta el borde rojo (ver claseCampo) y avisa
                // al lector de pantalla; aria-describedby le lee el error.
                aria-invalid={mensajeError ? true : undefined}
                aria-describedby={mensajeError ? idError : undefined}
                {...register(name)}
            />
            {mensajeError && (
                <span id={idError} className={claseError}>
                    {mensajeError}
                </span>
            )}
        </div>
    );
};

export default FormInput;
