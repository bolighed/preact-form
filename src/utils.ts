const _slice = Array.prototype.slice,
    _has = Object.prototype.hasOwnProperty;

export function slice<T>(a: ArrayLike<T>, start: number = 0, len?: number): Array<T> {
    return _slice.call(a, start, len);
}

export function has(a: any, prop: string) {
    return _has.call(a, prop);
}

let idCounter = 0;

export function uniqueId(prefix: string = '') {
    return (++idCounter) + prefix
}

export function isObject(obj: any): obj is Object {
    return obj === Object(obj);
}

export function isFunction(a: any): a is Function {
    return typeof a === 'function';
}

export function isString(a: any): a is string {
    return typeof a === 'string';
}

export function omit<T extends object>(o: T, args: string[]) {
    let out: any = {};
    for (let key in o) {
        if (!~args.indexOf(key)) out[key] = o[key];
    }
    return out;
}


/**
 * Get value from HTML Elemement
 * 
 * @export
 * @param {HTMLElement} el 
 * @param {boolean} [coerce=false] 
 * @returns 
 */
export function getValue(el: HTMLElement, coerce: boolean = false) {
    const tagName = el.tagName.toLocaleLowerCase(),
        type = (<any>el).type,
        isInput = tagName, isCheckbox = /checkbox/.test(type),
        isSelect = /select/.test(el.nodeName);

    if (isCheckbox) {
        return Boolean((el as HTMLInputElement).checked);
    } else if (isSelect) {
        if (!coerce) return (el as HTMLInputElement).value || '';
        let option = (el as HTMLSelectElement).options[(el as HTMLSelectElement).selectedIndex];
        return { value: option.value, text: option.innerText };
    } else if (isInput) {
        let input = (el as HTMLInputElement);
        let type = input.type;
        switch (type) {
            case "number":
                return coerce ? 'valueAsNumber' in input ? input.valueAsNumber : parseInt(input.value) : input.value;
            case "date":
                return coerce ? 'valueAsDate' in input ? input.valueAsDate : new Date(input.value) : input.value;
            default: return input.value;
        }
    }

    return el.textContent;

}

/**
 * Set value on an HTMLElmenet
 * 
 * @export
 * @param {HTMLElement} el 
 * @param {*} [value] 
 */
export function setValue(el: HTMLElement, value?: any) {
    const tagName = el.tagName.toLocaleLowerCase(),
        type = (<any>el).type,
        isInput = tagName, isCheckbox = /checkbox/.test(type),
        isRadio = /radio/.test(type),
        isRadioOrCheckbox = isRadio || isCheckbox,
        isSelect = /select/.test(el.nodeName);

    if (value == null) {
        value = "";
    }

    if (isRadioOrCheckbox) {
        if (isRadio) {
            if (String(value) === String((<any>el).value)) {
                (el as HTMLInputElement).checked = true;
            }
        } else {
            (el as HTMLInputElement).checked = value;
        }
    } else if (String(value) !== getValue(el)) {
        if (isInput || isSelect) {
            (el as HTMLInputElement).value = value;
        } else {
            el.innerHTML = value
        }
    }

}