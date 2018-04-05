
import { IValidator } from './validator';
import { ValidationError, ValidationErrors, createError } from './errors';
import { IValidatable, RequiredValidator } from './validator';

export class Validation {

    private _validators: IValidator[] = [];
    private _required?: RequiredValidator


    addValidator(v: IValidator) {
        this._validators.push(v);
        return this;
    }

    removeValidator(v: IValidator) {
        let i = this._validators.indexOf(v);
        if (~i) this._validators.splice(i, 1);
        return this;
    }


    clearValidators() {
        this._validators = [];
        return this;
    }


    validate(editor: IValidatable) {

        let errors: ValidationError[] = [];

        //if (this._required && !editor.value) throw new ValidationErrors("", [createError(editor, new RequiredValidator())]);

        // Editor value is required
        if (this._required && !this._required.validate(editor)) {
            errors.push(createError(editor, this._required));
        }

        // We wanna return without errors, if a value is not required, and does not have a value
        if (!editor.value && editor.value !== 0 && !errors.length) {
            return;
        }

        // Required validator already run
        if (!errors.length) {
            for (let i = 0, ii = this._validators.length; i < ii; i++) {
                if (!this._validators[i].validate(editor))
                    errors.push(createError(editor, this._validators[i]));
            }
        }



        if (errors.length)
            throw new ValidationErrors('', errors);

    }

    required(ok: boolean, message?: string) {
        this._required = ok ? new RequiredValidator(message) : void 0;
        return this;
    }

}