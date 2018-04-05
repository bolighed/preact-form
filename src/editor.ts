import { Component } from 'preact';
import { Form, GenericFormEvent } from './form';
import { IEditor, WidgetTypes } from './types';
import { Validation, IValidator, IValidatable } from './validation';


export interface IEditorProps<V = any> {
    required?: boolean;
    /**
     * The name of the editor
     * 
     * @type {string}
     * @memberof IEditorProps
     */
    name: string;
    /**
     * Validations for the editor
     * 
     * @type {(IValidator | IValidator[])}
     * @memberof IEditorProps
     */
    validate?: IValidator | IValidator[];
    /**
     * This event is triggered, everytime the data changes
     * 
     * @memberof IEditorProps
     */
    onChange?: (event: GenericFormEvent<IEditor, V>) => any;
    /**
     * This event is triggered, everytime there's input
     * 
     * @memberof IEditorProps
     */
    onInput?: (event: GenericFormEvent<IEditor, V>) => any;
}

/**
 * Form input fields (aka editors) should implement this abstract class
 * and implement the defined abstract attributes and methods
 * @export
 * @abstract
 * @class Editor
 * @extends {Component<P, S>}
 * @implements {IEditor}
 * @template P 
 * @template S 
 */
export abstract class Editor<P extends IEditorProps, S = {}> extends Component<P, S> implements IEditor, IValidatable {

    protected _validation: Validation = new Validation();

    context: { form: Form }
    abstract readonly name: string;

    set value(v: any) {
        this.setValue(v);
    }

    get value(): any {
        return this.getValue();
    }


    /**
     * A reference to the form (if any), the editor is mounted on 
     * 
     * @readonly
     * @type {Form}
     * @memberof Editor
     */
    get form(): Form | undefined {
        return this.context.form;
    }

    /**
     * Set the value of the editor
     * 
     * @protected
     * @abstract
     * @param {*} v 
     * @memberof Editor
     */
    protected abstract setValue(v: any): any;

    /**
     * Get the current value of the editor
     * 
     * @protected
     * @abstract
     * @returns {*} 
     * @memberof Editor
     */
    protected abstract getValue(): any;


    /**
     * Clear the editor
     * 
     * @memberof Editor
     */
    clear() {
        this.setValue(void 0);
    }

    validate() {
        this._validation.validate(this);
    }

    //#region Preact lifecircle

    componentDidMount() {
        this._initialize_validation();
    }

    componentDidUpdate() {
        this._initialize_validation();
    }

    componentWillUnmount() {
        this._validation.clearValidators();
    }

    //#endregion

    private _initialize_validation() {

        const p = this.props;
        this._validation.clearValidators()
            .required(p.required!);

        if (!p.validate) return;

        const va = Array.isArray(p.validate) ? p.validate : [p.validate];

        for (let i = 0, ii = va.length; i < ii; i++) {
            this._validation.addValidator(va[i]);
        }

    }

}


export namespace Editor {
    export const widgetType = WidgetTypes.Editor;
}
