
import { h, Component, ComponentProps } from 'preact';
import { IEditor, WidgetTypes } from './types';
import { isString, omit, has } from './utils';
import { ValidationErrors, ValidationError, FormValidationError } from './validation';

export interface GenericFormEvent<T, V> {
    target: T
    value: V
    type?: string;
}

export interface ValidationEvent<F extends Form> {
    target: F;
    error?: FormValidationError;
}

export type FormSubmitEvent<V> = GenericFormEvent<Form<V>, V>

export enum ValidationTrigger {
    // start at 1 for easier null checks
    Change = 1, Input, Manuel
};

export interface FormProps<V> extends ComponentProps<Form<V>> {

    /**
     * Emitted on submit
     * 
     * @memberof FormProps
     */
    onSubmit?: (event: FormSubmitEvent<V>) => any;

    /**
     * Emitted on form change
     * 
     * @memberof FormProps
     */
    onChange?: <T extends IEditor = IEditor, B = any>(event: GenericFormEvent<T, B>) => any

    /**
     * Emitted on form input
     * 
     * @memberof FormProps
     */
    onInput?: <T extends IEditor = IEditor, B = any>(event: GenericFormEvent<T, B>) => any

    onValidate?: (event: ValidationEvent<Form<V>>) => any;

    /**
     * If this is true, the submit event will be triggered even if
     * the form is invalid
     * 
     * @type {boolean}
     * @memberof FormProps
     */
    submitOnInvalid?: boolean;

    /** @inheritdoc */
    className?: string;
    /** @inheritdoc */
    name?: string;
    /** @inheritdoc */
    style?: any;

    /**
     * Initial value of form
     * 
     * @type {V}
     * @memberof FormProps
     */
    value?: V;

    /**
     * 
     * 
     * @type {ValidationTrigger}
     * @memberof FormProps
     */
    validationTrigger?: ValidationTrigger;
}

export class Form<V = any> extends Component<FormProps<V>, {}> implements IEditor {
    name: string = '';
    /**
     * List of inputs
     * 
     * @type {{ [key: string]: IEditor }}
     * @memberof Form
     */
    inputs: { [key: string]: IEditor } = {};

    /**
     * Validate the form. Throws and a FormValidationError on invalid
     * 
     * @memberof Form
     */
    validate() {

        var errors: ValidationError[] = []
        for (let k in this.inputs) {
            try {
                this.inputs[k].validate();
            } catch (e) {
                errors.push(...e.errors);
            }
        }

        const e = errors.length ? new FormValidationError(this, errors) : void 0;

        if (this.props.onValidate) this.props.onValidate({ error: e, target: this });
        if (e) throw e;

    }

    /**
     * Returns true, if the form is valid
     * 
     * @readonly
     * @memberof Form
     */
    get valid() {
        try {
            this.validate();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get an object containng values of form input
     * 
     * @type {(V | undefined)}
     * @memberof Form
     */
    get value(): V | undefined {
        if (!Object.keys(this.inputs).length) return void 0;
        let value: any = {};
        for (let k in this.inputs) {
            value[this.inputs[k].name] = this.inputs[k].value;
        }
        return value;
    }


    set value(v: V | undefined) {
        if (!Object.keys(this.inputs).length) return;

        for (let k in this.inputs) {
            if (!v) this.inputs[k].value = void 0;
            else if (has(v, k)) {
                this.inputs[k].value = (v as any)[k];
            }

        }

    }


    //#region Life circle 
    componentDidMount() { }

    componentWillUnmount() { }

    render(props?: FormProps<V>) {
        props = props || {};

        this._find_editors(props.children || []);
        this._find_submit(props.children || []);

        const nprops = omit(props!, ['ref', 'onChange', 'onInput', 'onSubmit', 'value'])

        if (props.value) {
            this._set_value_from_props(props.children || [], props.value);
        }

        return <form {...nprops}>
            {...(props!.children || [])}
        </form>

    }

    getChildContext(): { form: Form<V>; } {
        return { form: this };
    }


    //#endregion


    //#region Privates

    private _get_widgets(children: JSX.Element[], widgetType: any = WidgetTypes.Editor): JSX.Element[] {
        const out: JSX.Element[][] = children.map<any>(m => {
            // text
            if (!m || typeof m === 'string') return null;
            // native
            if (typeof m.nodeName === 'string') return this._get_widgets(m.children || []);

            // This is a bit dodgy way of doing the check
            if ((m.nodeName as any).widgetType === widgetType) {
                return [m];
            } else if ((m.nodeName as any).widgetType !== WidgetTypes.Form)
                // unknown component
                return this._find_editors(m.children || [])
        }).filter(m => m != null);
        // flatten the output
        return out.reduce((p, c) => p.concat(c), []);
    }

    private _set_value_from_props(children: JSX.Element[], value: V) {
        this._get_widgets(children, WidgetTypes.Editor).forEach(m => {
            if (has(value, m.attributes.name)) {
                m.attributes.value = (value as any)[m.attributes.name];
            }
        });
    }

    /**
     * Validate an editors attributes hash
     * 
     * @private
     * @param {JSX.Element} el 
     * @param {string[]} found 
     * @memberof Form
     */
    private _validate_editor(el: JSX.Element, found: string[]) {
        const a = el.attributes;
        if (typeof a.name !== 'string' || !a.name)
            throw new TypeError(`editor ${(el.nodeName as any).name} must have a name property`);
        else if (~found.indexOf(a.name))
            throw new TypeError(`editor ${(el.nodeName as any).name} must have an unique name. ${a.name} already defined in form`);
        found.push(a.name);
    }

    /**
     * Find all (recursive) editors in the form, and hook up events
     * @private
     * @param {JSX.Element[]} children
     * @memberof Form
     */
    private _find_editors(children: JSX.Element[]) {
        var found: string[] = [];

        this._get_widgets(children, WidgetTypes.Editor)
            .forEach(m => {
                this._validate_editor(m, found);

                // Wrap ref
                const oref = m.attributes.ref;
                m.attributes.ref = ((id: string) => {
                    return (ref: IEditor) => {
                        if (!ref) delete this.inputs[id];
                        else
                            this.inputs[id] = ref;
                        if (oref) oref(ref);
                    }
                })(m.attributes.name);

                // Wrap change events
                const ooc = m.attributes.onChange;
                m.attributes.onChange = (e: any) => this._on_field_change('change', e, ooc);
                // Wrap input events
                const ooi = m.attributes.onInput;
                m.attributes.onInput = (e: any) => this._on_field_change('input', e, ooi);
            })

    }

    /**
     * Here we try to find a submit button in the form, and hook it up, if it exists.
     *
     * @private
     * @param {JSX.Element[]} children
     * @memberof Form
     */
    private _find_submit(children: JSX.Element[]) {
        children.filter(m => {
            if (!m || isString(m)) return false;
            if (isString(m.nodeName) && (m.nodeName === 'button' || m.nodeName === 'input')) {
                return m.attributes.type === 'submit';
            }
            return false;
        }).forEach(m => (m.attributes || (m.attributes = {})).onClick = (e: MouseEvent) => {
            e.preventDefault();
            if (!this.valid && !this.props.submitOnInvalid)
                return;
            if (this.props.onSubmit)
                this.props.onSubmit({ target: this, value: this.value! });
        });
    }


    /**
     * Called when a editor emits an event
     * 
     * @private
     * @param {('input' | 'change')} t 
     * @param {GenericFormEvent<IEditor, any>} e 
     * @param {(e: any) => any} [_] 
     * @returns 
     * @memberof Form
     */
    private _on_field_change(t: 'input' | 'change', e: GenericFormEvent<IEditor, any>, callback?: (e: any) => any) {

        if (callback) {
            callback(e);
        }

        const n: 'onInput' | 'onChange' = 'on' + t[0].toUpperCase() + t.substr(1) as any;

        if (this.props[n]) this.props[n]!(e);

        const trigger = this.props.validationTrigger || ValidationTrigger.Manuel;

        if ((t === 'input' && trigger !== ValidationTrigger.Input) ||
            (t === 'change' && trigger !== ValidationTrigger.Change) ||
            trigger === ValidationTrigger.Manuel)
            return;

        var error: FormValidationError | undefined;
        try {
            e.target.validate();
        } catch (err) {
            error = new FormValidationError(this, (err as ValidationErrors).errors);
        }

        if (this.props.onValidate) this.props.onValidate({ error: error, target: this });
    }

    //#endregion

}

export namespace Form {
    export const widgetType = WidgetTypes.Form;
}