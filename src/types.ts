
export interface IEditor {
    /**
     * Name of the editor
     * 
     * @type {string}
     * @memberof IEditor
     */
    readonly name: string;
    /**
     * Value of the editor
     * 
     * @type {(any | undefined)}
     * @memberof IEditor
     */
    value: any | undefined;
    /**
     * Validate the editor
     * 
     * @memberof IEditor
     */
    validate(): void;
}

export namespace WidgetTypes {
    export const Editor = Symbol("EditorWidget");
    export const Field = Symbol("FieldWidget");
    export const Form = Symbol("FormWidget");
    export const Submit = Symbol("SubmitWidget");
}