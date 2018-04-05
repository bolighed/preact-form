import { IValidator, IValidatable } from './validator';


export class ValidationError extends Error {

    public validator: IValidator | undefined;

    constructor(public editor: IValidatable, public message: string) {
        super(message);
        // Fix prototype chain issue
        Object.setPrototypeOf(this, ValidationError.prototype);

    }

}

export class ValidationErrors extends Error {

    constructor(public message: string, public errors: ValidationError[]) {
        super(message);
        // Fix prototype chain issue
        Object.setPrototypeOf(this, ValidationErrors.prototype);
    }

}

export class FormValidationError extends Error {

    constructor(public form: IValidatable, public errors: ValidationError[]) {
        super();
        // Fix prototype chain issue
        Object.setPrototypeOf(this, FormValidationError.prototype);

    }

}


export function createError(editor: IValidatable, validator: IValidator) {

    const err = new ValidationError(editor, validator.message || '');
    err.validator = validator;

    return err;
}