import { regexes } from './regexes';
import { getValue } from '../utils';


export interface IMountable {
    inputs: { [key: string]: IValidatable };
}

export interface IValidatable {
    value: any;
    form?: IMountable | undefined;
}

export interface IValidator {
    message: string |  undefined;
    validate(editor: IValidatable): boolean;
}


export abstract class AbstractValidator {
    message: string | undefined;
    constructor(msg?: string) {
        if (msg) this.message = msg;
    }
}

export class RequiredValidator extends AbstractValidator implements IValidator {
    message: string | undefined;
    constructor(msg: string = "{{label}} skal udfyldes") {
        super(msg);
    }

    validate(editor: IValidatable): boolean {
        let v = editor.value;
        if (typeof v === 'number') return true;
        else if (v) return true;
        return false;
    }
}


export class RegexValidator extends AbstractValidator implements IValidator {
    readonly regex: RegExp;
    constructor(regex: RegExp, msg: string = "{{label}} er invalid") {
        super(msg);
        this.regex = regex;
    }
    validate(editor: IValidatable): boolean {
        return this.regex.test(String(editor.value));
    }
}

export class EmailValidator extends RegexValidator {

    constructor(msg: string = "{{label}} er ikke en valid email") {
        super(regexes.email, msg);
    }

}

export class MinLengthValidator extends AbstractValidator implements IValidator {
    len: number;

    constructor(n: number, msg?: string) {
        super(msg);
        this.len = n;
    }

    validate(editor: IValidatable): boolean {
        const value = editor.value;
        if (typeof value === 'string') {
            return value.length >= this.len;
        } else if (typeof value === 'number') {
            return value >= this.len;
        }
        return false;
    }
}


export class MaxLengthValidator extends AbstractValidator implements IValidator {
    len: number;

    constructor(n: number, msg?: string) {
        super(msg);
        this.len = n;
    }

    validate(editor: IValidatable): boolean {
        const value = editor.value;
        if (typeof value === 'string') {
            return value.length <= this.len;
        } else if (typeof value === 'number') {
            return value <= this.len;
        }
        return false;
    }
}


export class MatchValidator extends AbstractValidator implements IValidator {

    constructor(private selector: string | HTMLElement | IValidatable, msg?: string) {
        super(msg);
    }

    // TODO: Use equaljs to the comparison
    validate(editor: IValidatable): boolean {
        const value = this._get_matching_value(editor);
        return value == editor.value;
    }

    private _get_matching_value(editor: IValidatable) {
        if (typeof this.selector === 'string' && editor.form) {
            let v = editor.form.inputs[this.selector];
            if (!v) return;
            return v.value;
        } else if (this.selector instanceof Element) {
            return getValue(this.selector);
        } else if (typeof this.selector !== 'string') {
            return this.selector.value;
        }
    }

}

export namespace validations {

    export function email(msg?: string) {
        return new EmailValidator(msg);
    }

    export function min(n: number, msg?: string) {
        return new MinLengthValidator(n, msg);
    }

    export function max(n: number, msg?: string) {
        return new MaxLengthValidator(n, msg);
    }

    export function match(to: string | HTMLElement | IValidatable, msg?: string) {
        return new MatchValidator(to, msg);
    }

    export function regex(pattern: RegExp, msg?: string) {
        return new RegexValidator(pattern, msg);
    }

}

