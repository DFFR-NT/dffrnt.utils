/// <reference path="../../app-root-path/lib/app-root-path.js" />
/// <reference types="immutable" />

import * as ImmutableJS from 'immutable';
import { Color } from 'colors';

declare global {
    /**
     * The type of colors that can be use in the logging functions
     */
    export type LogColors = keyof Color;
    /**
     * A callback that acquires a `Getter` Property.
     * @returns
     */
    export type PropGet = ()=>any;
    /**
     * A callback that assign a `Setter` Property.
     * @param val The value to `set`
     */
    export type PropSet = (val: any)=>void;
    /**
     * A `Property Descriptor`.
     */
    export interface PropDesc {
        /**
         * `true` if and only if the type of this property descriptor may be **changed** or **deleted** from the corresponding `object`.
         */
        configurable?: boolean;
        /**
         * `true` if and only if this property shows up during **enumeration** of the properties on the corresponding `object`.
         */
        enumerable?: boolean;
        /**
         * `true` if and only if the value associated with the property may be changed with an `assignment operator`.
         */
        writable?: boolean;
        /**
         * The value associated with the property. Can be any valid JavaScript value (number, `object`, `function`, etc).
         */
        value?: any;
        /**
         * An _optional_ `callback` that acquires a **Getter** Property.
         */
        get?: PropGet;
        /**
         * An _optional_ `callback` that assign a **Setter** Property
         */
        set?: PropSet;
    };
    /**
     * A `Property Descriptor` that will hide a specified Property.
     */
    export interface HPropDesc {
        /**
         * This property descriptor _may not_ be **changed** or **deleted** from the corresponding `object`.
         */
        configurable: false;
        /**
         * This property _will not_ shows up during **enumeration** of the properties on the corresponding `object`.
         */
        enumerable: false;
        /**
         * The value associated with the property _may not_ be **changed** with an `assignment operator`.
         */
        writable: false;
        /**
         * The value associated with the property. Can be any valid JavaScript value (number, `object`, `function`, etc).
         */
        value?: any;
        /**
         * An _optional_ `callback` that acquires a **Getter** Property.
         */
        get?: PropGet;
        /**
         * An _optional_ `callback` that assign a **Setter** Property
         */
        set?: PropSet;
    };
    /**
     * A collection of `Property Descriptors`. The `key` indicates the property **name**, and the `value` is the `PropertyDescription`.
     */
    export type PropDescrs = { [propName: string]: PropDesc; };
    
    /**
     * Creates an instance of EPROXY.
     */
    export interface EHANDLERS<T extends object> {
        construct(target: T, argumentsList: any[], newTarget: any): T;
        apply(target: T, thisArg: object, argumentsList: any[]): any;
        ownKeys(target: T): any[];
        has(target: T, property: PropertyKey): boolean;
        get(target: T, property: PropertyKey, receiver: ProxyConstructor): any;
        set(target: T, property: PropertyKey, value: any, receiver: ProxyConstructor): boolean;
        deleteProperty(target: T, property: PropertyKey): boolean;
    };
    
    /**
     * Valid types for a `DCT` key.
     */
    declare type DCTKey = PropertyKey|RegExp;


    export interface Array<T> {
        /**
         * Determines the maximum value of an `Array` given specified criteria.
         * @param by A callback that yields the property/value of the items to compare during the sort.
         */
        max(by: (item: T) => T): T;
        /**
         * Determines the minimum value of an `Array` given specified criteria.
         * @param by A callback that yields the property/value of the items to compare during the sort.
         */
        min(by: (item: T) => T): T;
        /**
         * Determines if this Array contains the specified value.
         * @param val The value to search
         */
        has(val: T): boolean;
        /**
         * Converts this Array into one that matches the length specified by the argument, `match`. If this Array has items, they are repeated 
         * until the specified length is reached; otherwise, `undefined` is used to fill out the extra space.
         * @param match If `match` is an `Array`, then the length of `match` is used; otherwise, the numeric value of `match` is used.
         * @param strict If `true`, the final length of the Array is truncated to the value specified in `match`; otherwise, the greater of `match` and the length of this Array is used.
         */
        repeat(match: number|T[], strict?: boolean): Array<T>;
        /**
         * Set/Gets the last item in this Array.
         */
        public last: T;
    };

    
    declare type PadDir = '-'|''|'+';
    export interface String {
        /**
         * Like `String.match`, retrieves the result of matching a string against a regular expression, but receieves a "_backup_" `Array` to return if there is no match.
         * @param regexp A regular expression object. If a non-RegExp object obj is passed, it is implicitly converted to a `RegExp` by using `new RegExp(obj)`.
         * @param backup A "_backup_" `Array` of `String(s)` that will return in the event of no-match.
         * @returns An `Array` whose contents depend on the presence or absence of the global (`g`) flag; or the "_backup_" `Array`, if no matches are found.
         */
        coalesceMatch(regexp: RegExp, backup?: string[]): string[];
        /**
         * De-duplicates repeated phrases as specified by the arguments.
         * @param vals A list of phrases to de-duplicate
         */
        distinct(...vals: string[]): string;
        /**
         * Colors phreases within the string.
         * @param opts 
         */
        colored(opts): string;
        /**
         * ???
         * @param lft ???
         * @param rgt ???
         */
        inColor(lft: string, rgt: string): string;
        /**
         * Counts the appearance of a phrase in this string.
         * @param char The phrase to count.
         */
        appears(char: string): number;
        /**
         * The real-character length of the string.
         */
        public readonly len: number;
        /**
         * The hidden-character length of the string.
         */
        public readonly hideCnt: number;
        /**
         * Determines if the string has a phrase.
         * @param text The phrase to look for.
         */
        has(text: string): boolean;
        /**
         * Duplicates the string by the specified amount.
         * @param amount The amount of times to duplicate the string.
         */
        dup(amount: number): string;
        /**
         * Indents each line within the string.
         * @param count The amount of indents.
         * @param chr The indent character.
         * @param from An optional line number to start from.
         */
        indent(count: number, chr: string, from?: number): string;
        /**
         * Adds padding to the string.
         * @param pad The padding character.
         * @param amount The amount of padding.
         * @param direct The direction of the padding.
         * @param log If `true`; prints out debugging logs.
         */
        pad(pad: string, amount: number, direct?: PadDir, log?: boolean): string;
        /**
         * Converts the string to sentence-case.
         */
        toSentenceCase(): string;
        /**
         * Converts the string to title-case.
         */
        toTitleCase(): string;
        /**
         * Formats the string using `DCT` options.
         */
        format(): string;
        /**
         * Aligns the string by **left** (`"-"`), **right** (`"+"`), or **centered** (`""`).
         * @param delim The delimiter used to separate the values.
         * @param direction The direction to align towards.
         */
        align(delim: string, direction: PadDir): string;
        /**
         * Converts the lines of this string to a list of lines.
         */
        toLines() : string[];
        /**
         * The amount of lines in this string.
         */
        public readonly lines: number;
        /**
         * Formats a delimited string into an aligned table.
         * @param options `CLMS` options.
         */
        toColumns(options: {}): string;
    };
    
};

/**
 * A collection of useful API Utilities & PolyFills
 */
export module 'dffrnt.utils' {

    /**
     * Built-in locales for use in 
     */
    declare type DateLocale = 'de_DE' | 'en_CA' | 'en_US' | 'es_MX' | 'fr_FR' | 'it_IT' | 'nl_NL' | 'pt_BR' | 'ru_RU' | 'tr_TR' | 'zh_CN';

    /**
     * 
     * _**See**: [sindresorhus/object-assign](https://github.com/sindresorhus/object-assign/blob/master/readme.md)_
     */
    export const Assign: typeof import('object-assign') = <T, U>(target: T, source: U) => T & U;
    export const Assign: typeof import('object-assign') = <T, U, V>(target: T, source1: U, source2: V) => T & U & V;
    export const Assign: typeof import('object-assign') = <T, U, V, W>(target: T, source1: U, source2: V, source3: W) => T & U & V & W;
    export const Assign: typeof import('object-assign') = (target: object, ...sources: any[]) => any;
    /**
     * _**See**: [Marak/colors.js](https://github.com/Marak/colors.js/blob/master/README.md)_
     */
    export const colors:  typeof import('colors');
    /**
     * _**See**: [Facebook/ImmutableJS](https://immutable-js.github.io/immutable-js/docs/#/)_
     */
    export const Imm:     typeof import('immutable');
    /**
     * _**See**: [samsonjs/strftime](https://github.com/samsonjs/strftime/blob/master/Readme.md)_
     * 
	 * | Modifier | Description |
	 * | :------: | ------------------ |
	 * | `A` | Full weekday name. |
	 * | `a` | Abbreviated weekday name. |
	 * | `B` | Full month name. |
	 * | `b` | Abbreviated month name. |
	 * | `C` | AD century (_year/100_), padded to 2-digits. |
	 * | `c` | Equivalent to `%a %b %d %X %Y %Z` in `en_US` (_based on locale_). |
	 * | `D` | Equivalent to `%m/%d/%y` in `en_US` (_based on locale_). |
	 * | `d` | Day of the month, padded to 2-digits (`01`-`31`). |
	 * | `e` | Day of the month, padded with a leading space for single digit values (`1`-`31`). |
	 * | `F` | Equivalent to `%Y-%m-%d` in `en_US` (_based on locale_). |
	 * | `H` | The hour (_24-hour clock_), padded to 2-digits (`00`-`23`). |
	 * | `h` | The same as `%b` (_abbreviated month name_). |
	 * | `I` | The hour (_12-hour clock_), padded to 2-digits (`01`-`12`). |
	 * | `j` | Day of the year, padded to 3-digits (`001`-`366`). |
	 * | `k` | The hour (_24-hour clock_), padded with a leading space for single digit values (`0`-`23`). |
	 * | `L` | The milliseconds, padded to 3-digits (_Ruby extension_)`. |
	 * | `l` | The hour (_12-hour clock_), padded with a leading space for single digit values (`1`-`12`). |
	 * | `M` | The minute, padded to 2-digits (`00`-`59`). |
	 * | `m` | The month, padded to 2-digits (`01`-`12`). |
	 * | `n` | Newline character. |
	 * | `o` | Day of the month as an ordinal (_without padding_), e.g. 1st, 2nd, 3rd, 4th, .... |
	 * | `P` | `am` or `pm` in lowercase (_Ruby extension, based on locale_). |
	 * | `p` | `AM` or `PM` (_based on locale_). |
	 * | `R` | Equivalent to `%H:%M` in `en_US` (_based on locale_). |
	 * | `r` | Equivalent to `%I:%M:%S %p` in `en_US` (_based on locale_). |
	 * | `S` | The second, padded to 2-digits (`00`-`60`). |
	 * | `s` | The number of seconds since the Epoch, `UTC`. |
	 * | `T` | Equivalent to `%H:%M:%S` in `en_US` (_based on locale_). |
	 * | `t` | Tab character. |
	 * | `U` | Week number of the year, Sunday as the first day of the week, padded to 2-digits (`00`-`53`). |
	 * | `u` | The weekday, Monday as the first day of the week (`1`-`7`). |
	 * | `v` | Equivalent to `%e-%b-%Y` in `en_US` (_based on locale_). |
	 * | `W` | Week number of the year, Monday as the first day of the week, padded to 2-digits (`00`-`53`). |
	 * | `w` | The weekday, Sunday as the first day of the week (`0`-`6`). |
	 * | `X` | Equivalent to `%D` in `en_US` (_based on locale_). |
	 * | `x` | Equivalent to `%T` in `en_US` (_based on locale_). |
	 * | `Y` | The year with the century. |
	 * | `y` | The year without the century (`00`-`99`). |
	 * | `Z` | The time zone name, replaced with an empty string if it is not found. |
	 * | `z` | The time zone offset from `UTC`, with a leading plus sign for `UTC` and zones east of `UTC` and a minus sign for those west of `UTC`, hours and minutes follow each padded to 2-digits and with no delimiter between them. |
     */
    export function  StrTime(fmt: string, d: Date, locale: DateLocale): string;
    export class     StrTime {
        static strftime(fmt: string, d: Date, locale: DateLocale): string;
        static localize(locale: DateLocale): (fmt: string, d: Date) => string;
        static timezone(timezone: string|number): (fmt: string, d: Date) => string;
        static utc(): (fmt: string, d: Date) => string;
    };
    /**
     * _**See**: [tzdata](https://www.npmjs.com/package/tzdata)_
     */
    export const TZ:      typeof import('tzdata');
    /**
     * _**See**: [inxilpro/node-app-root-path](https://github.com/inxilpro/node-app-root-path/blob/master/README.md)_
     */
    export const ROOTD:   typeof import('app-root-path');
    /**
     * _**See**: [Node.js/path](https://nodejs.org/api/path.html)_
     */
    export const path:    typeof import('path');
    /**
     * _**See**: [Node.js/os](https://nodejs.org/api/os.html)_
     */
    export const os:      typeof import('os');
    /**
     * _**See**: [Node.js/fs](https://nodejs.org/api/fs.html)_
     */
    export const fs:      typeof import('fs');
    /**
     * The platform this application exists on.
     */
    export const Platform: "nix" | "win";


    /**
     * Converts a function's `Arguments` into an `Array`.
     * @param args
     * @param from An optional starting index to slice the list.
     * @returns
     */
    export function ARGS(args: {[index:number]:any}, from?: number): any[];
    /**
     * Retrieves the `constructor` name of an `Object`.
     * @param obj Any `Object`.
     * @param deep If `true`; attempts to retrieve the `instance` name of the `Object`.
     * @returns
     */
    export function CNAME(obj: any, deep?: boolean): string;
    /**
     * Determines if an `Object` is of a specified type.
     * @param obj Any `Object`.
     * @param typ An `Object` to compare.
     * @returns
     */
    export function TYPE(obj: any, typ: any): boolean;
    /**
     * Retrieves the specific type of `Object` the argument is.
     * @param val Any `Object`.
     * @returns
     */
    export function OF(val: any): string;
    /**
     * A factory that creates a Proxied Class.
     * @param sup The parent class.
     * @param base The class to extend.
     * @param handlers The proxy handler functions.
     * @returns The new proxied class.
     */
    export function EXTEND<T>(sup: any, base: T, handlers: EHANDLERS<T>): T;
    /**
     * Creates a `PropertyDescriptor` that will hide the specified Property.
     * @param value The value associated with the property. Can be any valid JavaScript value (number, object, function, etc).
     * @param isGetSet `true` if the properties utilizes **Getters** or **Setters**.
     */
    export function HIDDEN(value: any, isGetSet?: boolean): HPropDesc;
    /**
     * A short-named, wrapper for the `Object.defineProperties` method.
     * @param proto Any _extendable_ `Object`.
     * @param properties A collection `Property Descriptor`
     */
    export function DEFINE(proto: any, properties: PropDescrs): void;
    /**
     * Determines if a value is `null` or `undefined`.
     * @param val Any value.
     * @returns
     */
    export function NIL(val: any): boolean;
    /**
     * Determines if a value is `null` or `undefined`, and optionally coalesces a default-value.
     * @param val Any value.
     * @param def An optional default value.
     * @returns A `boolean`, if `def` isn't defined; otherwise, the default-value.
     */
    export function UoN(val: any, def?: any): any;
    /**
     * Determines if a value is truly not a number.
     * @param val
     * @returns
     */
    export function IaN(val: any): boolean;
    /**
     * Determines the type of a value:.
     * @param arg Any value.
     * @returns
     */
    export function ISS(arg: any): 'null' | 'date' | 'email' | 'socket' | 'image' | 'boolean' | 'string' | 'raw' | 'number' | 'numeric' | 'function' | 'symbol' | 'array' | 'object';
    /**
     * Determines the generalized type of a value, as well as those that it is not.
     * @param arg Any value.
     * @returns
     */
    export function IS(arg: any): {
        bln: boolean;
        dte: boolean;
        txt: boolean;
        raw: boolean;
        num: boolean;
        arr: boolean;
        obj: boolean;
    };
    /**
     * `DEPRECATED` A wrapper function that allows for default arguments.
     * @param func The callback to wrap.
     * @param defs An plain-object representing the arguments and their defaults.
     * @returns The result of the function; if any.
     */
    export function preARGS(func: (...args) => any, defs: {[argName:string]:any}): any;
    /**
     * Determines the "top"/"bottom" value of an `Array` given specified criteria.
     * @param arr An `Array` of a specific type.
     * @param by A callback that yields the property/value of the items to compare during the sort.
     * @param dsc If `true`; finds the "bottom" value.
     */
    export function TOP<T>(arr: T[], by: (item: T) => any, dsc?: boolean): any;
    /**
     * Converts a JS `iterable` into an ordered, **ImmutableJS** object (or just the value, if not an `iterable`).
     * @param js Any JS object
     */
    export function FromJS<T>(js: T): (
        T extends {[prop:string]:any} ? Imm.OrderedMap<K,V> : (
            T extends any[] ? Imm.List<V> : T
    )   );
    
    
    /**
     * An extendable Proxy-Class factory.
     */
    export class EPROXY {
        /**
         * Creates an instance of EPROXY.
         * @param configs The `Proxy` handlers
         * @returns The proxied class.
         */
        constructor<T>(configs?: EHANDLERS<T>): Proxy;
    
        /**
         * Makes an `Object` "callable"
         * @param obj The `Object` to make "callable"
         * @param handles The `Proxy` handlers
         * @returns A new, `Proxied` `Object`
         */
        static CALLABLE<T>(obj: any, handles: EHANDLERS<T>): Proxy;
    
    }
    /**
     * An class that represents and manages the **public-folder** of a project.
     */
    export class FOLDER {
        /**
         * Instantiates a new `FOLDER` instance.
         * @param location The path of the folder.
         * @param age The `cookie-age` of the files within the folder.
         */
        constructor(location: string, age: number);
    
        /**
         * The path of the folder.
         */
        private location: string;
        /**
         * The `cookie-age` of the files within the folder.
         */
        private age: number;
    
        /**
         * Gets the relative root-path of this folder.
         */
        readonly get root(): string;
        /**
         * Get the full-path of this folder.
         */
        readonly get fullDir(): string;
        /**
         * Get an `Array` comprised of the `project-root` and the relative-path of this folder.
         */
        readonly get dir(): any;
        /**
         * Gets the relative-path of the index file in this folder.
         */
        readonly get index(): string;
    
        /**
         * `TODO` Generates the path of a the specified file with a specified extension.
         * @param ext The extension to add.
         * @param file The name of the file in this folder.
         * @returns
         */
        ext(ext: string, file: string): string;
        /**
         * Joins the arguments into a path-string.
         * @param parts The pieces of the path.
         * @returns
         */
        join(...parts: string): string;
        /**
         * Joins the arguments into a full-path string in this folder.
         * @param parts The pieces of the path.
         * @returns
         */
        path(...parts: string): string;
    
        /**
         * Retrieves the relative-path of a file within the `html` folder of this folder.
         * @param file The name of the file in said folder.
         * @returns
         */
        html(file: string): string;
        /**
         * Retrieves the relative-path of a file within the `js` folder of this folder.
         * @param file The name of the file in said folder.
         * @returns
         */
        js(file: string): string;
        /**
         * Retrieves the relative-path of a file within the `css` folder of this folder.
         * @param file The name of the file in said folder.
         * @returns
         */
        css(file: string): string;
        /**
         * Retrieves the relative-path of a file within the `comps` folder of this folder.
         * @param file The name of the file in said folder.
         * @returns
         */
        comps(file: string): string;
        /**
         * Retrieves the relative-path of a file within the `images` folder of this folder.
         * @param file The name of the file in said folder.
         * @returns
         */
        images(file: string): string;
        /**
         * Retrieves the relative-path of a file within the `fonts` folder of this folder.
         * @param file The name of the file in said folder.
         * @returns
         */
        fonts(file: string): string;
    
    }
    /**
     * A class representing an item within a `DCT` instance.
     */
    export class ITM {
        /**
         * Instantiates a new `ITM` instance.
         * @param key The key or key/value pair of the item.
         * @param value The (optional) value of the item.
         * @param parent The parent this item belongs to.
         */
        constructor(key: DCTKey | Object, value?: any, parent: DCT);
    
        /**
         * The parent of this `ITM`.
         */
        readonly par: DCT | Object;
    
        /**
         * The key of the item.
         */
        readonly key: DCTKey;
    
        /**
         * The value of the item.
         */
        readonly val: any;
    
        /**
         * The parent of this `ITM`.
         */
        readonly parent: DCT;
    
        /**
         * The index of this `ITM`.
         */
        readonly idx: number;
    
        /**
         * The position of this `ITM` as it pertains to other `ITM`s within it's `DCT` parent who share the same key.
         */
        readonly pos: number;
    
        /**
         * A `String` representation of this `ITM`.
         * @returns
         */
        toString(): string;
    
        /**
         * An `Array` representation of this `ITM`.
         * @returns
         */
        toArray(): any;
    
        /**
         * A `plain-object` representation of this `ITM`.
         */
        toObject(): Object;
    
        /**
         * A `JSON-String` representation of this `ITM`.
         * @returns
         */
        toJSON(): string;
    
    }
    /**
     * A dictionary class that allows for duplicate keys to be inserted (_**LOL** - trust me, it works_).
     */
    export class DCT extends EPROXY {
        /**
         * Instantiates a new `DCT` instance.
         * @param KVs The object of key/value pairs
         */
        constructor(KVs: {[key:string]:any});
    
        /**
         * The amount of `ITM`s in this `DCT`.
         */
        readonly get size(): number;
        /**
         * An alias for `size`.
         */
        readonly get length(): number;
    
        /**
         * Gets/Sets the first `ITM` in this `DCT`.
         * @param value A value that will be converted into the first `ITM`.
         */
        get first(): ITM;
        set first(value: any): void;
        /**
         * Gets/Sets the last `ITM` in this `DCT`.
         * @param value A value that will be converted into the last `ITM`.
         */
        get last(): ITM;
        set last(value: any): void;
    
        /**
         * Retrieves the keys within this `DCT`.
         * @returns
         */
        keys(): DCTKey[];
        /**
         * Retrieves the value within this `DCT`.
         * @returns
         */
        vals(): any;
    
        /**
         * Parses a `<key>$<position>` string into a digestible search object.
         * @param name A valid `<key>$<position>` string (`/^\w+([$]\d*)?$/`).
         * @returns
         */
        parse(name: string): {
            key: string;
            idx: number;
            pos: number;
        };
    
        /**
         * Retrieves an `ITM` at the specified `<key>$<position>` string.
         * @param name A valid `<key>$<position>` string (`/^\w+([$]\d*)?$/`).
         */
        find(name: string): ITM;
        /**
         * Determines if an `ITM` exists at the specified key & postion.
         * @param key The `ITM` key.
         * @param pos The position of the key.
         * @returns
         */
        has(key: string, pos: number): boolean;
        /**
         * Determines if an `ITM` with the specified value exists.
         * @param value Any value to look for.
         * @returns
         */
        contains(value: any): boolean;
    
        /**
         * Pushes a new `ITM` into the `DCT`
         * @param key The `ITM` key.
         * @param value The `ITM` value.
         * @returns
         */
        push(key: DCTKey, value: any): DCT;
        /**
         * Removes an `ITM` at
         * @param key The `ITM` key.
         * @param pos The postion of the `ITM` to retrieve.
         */
        pull(key: string, pos: number): DCT;
    
        /**
         * Performs a callback function over each `ITM` within this `DCT` as if it was an `Array`.
         * @param callback A handler callback.
         * @returns
         */
        forEach(callback: any): any[];
        /**
         * Performs a callback function over each `ITM` within this `DCT`, creating a new List-style `DCT` in the process.
         * @param callback A handler callback.
         * @returns
         */
        loop(callback: any): DCT;
        /**
         * Performs a callback function over each `ITM` within this `DCT`, creating a new Map-style `DCT` in the process.
         * @param callback A handler callback.
         * @returns
         */
        map(callback: any): DCT;
        /**
         * Filters out `ITM`s within this `DCT` using the specified callback function.
         * @param callback A handler callback.
         * @returns
         */
        filter(callback: any): DCT;
    
        /**
         * A `String` representation of this `DCT`.
         * @returns
         */
        toString(): string;
        /**
         * An `Array` representation of this `DCT`.
         * @returns
         */
        toArray(): any[];
        /**
         * A `plain-object` representation of this `DCT`.
         */
        toObject(): any;
        /**
         * A `JSON-String` representation of this `DCT`.
         * @returns
         */
        toJSON(): string;
    
        /**
         * Converts a value into an `ITM` and inserts it into the specifed `DCT` under the specified `key`.
         * @param target The `DCT` instance to add the new `ITM` to.
         * @param name The key to add the new `ITM` under.
         * @param value The value of this new `ITM`.
         * @param _item `NOT USED`
         * @returns
         */
        static set(target: DCT, name: DCTKey, value: any, _item: ProxyConstructor): boolean;
    
    }
    /**
     * It's "Regex" for Regex (_LOL_). It's callable too.
     */
    export interface RGX {
        /**
         * Instantiates a new instance of `RGX`.
         * @param variables
         */
        (variables: {}): RGX;
    }
    export class RGX {
        /**
         * Instantiates a new instance of `RGX`.
         * @param variables
         */
        constructor(variables: {});
    
        /**
         * Placeholder
         */
        readonly get PLCHLD(): RegExp;
        /**
         * Placeholder
         */
        readonly get SLASH(): RegExp;
    
        /**
         * Multiplies a pattern.
         * @param pattern A string `RegExp` pattern.
         * @param amount The amount of times to repeat the pattern.
         * @returns
         */
        Repeat(pattern: string, amount: number): string;
    
        /**
         * Formats a string-pattern a `RGX` pattern.
         * @param pattern A string `RegExp` pattern.
         * @returns
         */
        Format(pattern: string): string;
    
        /**
         * Parses a `RegExp` pattern into it's relavant parts.
         * @param pattern A string `RegExp` pattern.
         * @returns
         */
        Parse(pattern: RegExp): Object;
    
        /**
         * Grooms a string pattern into an `RGX` pattern.
         * @param pattern A string `RegExp` pattern.
         * @returns
         */
        __(pattern: string): string;
    
        /**
         * Generates a `RegExp` pattern.
         * @param pattern A string `RegExp` pattern.
         * @returns
         */
        _(pattern: string): RegExp;
    
    }
    
    
    /**
     * A format style for an expected value type
     * (`txt`|`dte`|`num`|`num`|`bln`|`arr`|`obj`|`raw`).
     */
    declare type FMType = string;
    
    /**
     * An `Object` literal that tracks and indexes the amount of 
     * the template values by `type`.
     */
    declare interface FMCounts {
        /** 
         * The current index of `String` values
         */
        str: number;
        /** 
         * The current index of `Array` values
         */
        lst: number;
        /** 
         * The current index of `Object` values
         */
        obj: number;
    };
    /**
     * An `Object` literal of `Arrays` that holds each value by `type`.
     */
    declare interface FMGroups {
        /** 
         * All of the `String` values
         */
        str: string[];
        /** 
         * All of the `Array` values
         */
        lst: Array[];
        /** 
         * All of the `Object` values
         */
        obj: { [propName: string]: string; }[];
    };
    /**
     * An `Object` literal that matches the **key** variables to their values.
     */
    declare interface FMKeyVal {
        /**
         * Emphasis --
         */
        emp?: boolean[];
        /**
         * Key -- The list of named variables marker for this template
         */
        key?: string[];
        /**
         * Value -- The list of values given for said template variables
         */
        val?: any[];
        /**
         * Count --
         */
        cnt?: number;
    };
    
    /**
     * A `String` template for the `FRMT` class. (see: [`printf (C++)`](http://www.cplusplus.com/reference/cstdio/printf/))
     * 
     * ### Formatters:
     * | ... | Name | Output |
     * | :-------- | :--: | :----- |
     * | `%(t)` | `Stringy` | _Any value, formatted as (`t`)._ |
     * | `%[%s](t)` | `Array` | _The `Array`, formatted as specified._ |
     * | `%{%(kÂ¦v)s}(t)` | `Object` | _The `Object`, formatted as specified._ |
     * | `%(named)(t)` | `Named` | _The property matching the named variable._ |
     * 
     * ### Types:
     * | ... | Name | Output | Example |
     * | ---: | :--: | :----- | :------ |
     * | `s` | `String` | _String of characters._ | hello, world |
     * | `d` | `Date` | _A date string or object._ | May 4 05:00PM |
     * | `i` | `Integer` | _Signed decimal integer._ | 392 |
     * | `f` | `Float` | _Decimal floating point, lowercase._ | 392.65 |
     * | `b` | `Boolean` | _A truthy or falsy statement._ | true |
     * | `a` | `Array` | _An array or items_ | [1,2,3,4,5] |
     * | `o` | `Object` | _An object of items._ | {hello:"world"} |
     * | `r` | `Raw` | _Anything. Evalutes and auto formats._ | 1 or "hello" |
     * | `%%` | `String` | _A literal percent sign._ | % |
     * 
     * ### Flags:
     * | ... | Name | Output |
     * | :--: | :--: | :----- |
     * | `!` | `Strict` | _Blank, if the value does not match the type._ |
     * | `-` | `Left` | _**Left**-justify within the given field width; **Right** justification is the default._ |
     * | `(number)` | `Width` | _Minimum number of characters to be printed._ |
     * | `.(number)` | `Width` | _The minimum number of digits or decimal places to be printed._ |
     * 
     * ### Modifiers:
     * | Context | Name | Description | Example |
     * | :-- | :--: | :----- | :------ |
     * | `%`&#124;`-/Mr. `&#124;`s` | `Prefix` | _Prepend the template value with `Mr. `_ | Smith => Mr. Smith |
     * | `%`&#124;`+/ Sr.`&#124;`s` | `Suffix` | _Append the template value with ` Sr.`_ | Jacob => Jacob Sr. |
     * | `%[%s`&#124;`;/ or ]s` | `Delimiter` | _Delimit the template value by `or`_ | [1,2] => 1 or 2 |
     * | `%[ %s`&#124;`&/ and]s` | `Last` | _Prepend the **last** `Array` item with ` and `_ | [1,2,3] => 1 2 and 3 |
     * | `%`&#124;`^/U`&#124;`s` | `Case` | _Format the case as `U`&#124;`L`&#124;`T`_ | hello => HELLO |
     * | `%`&#124;`@/grey`&#124;`s` | `Color` | _Color the template value_ | ... |
     * | `%`&#124;`=/ll/77`&#124;`s` | `Replace` | _Replace occurences of characters with another_ | hello => he77o |
     * | `%`&#124;`#/Name:`&#124;`s` | `Index` | _Comming soon..._ | ... |
     * | `%`&#124;`?/Name:`&#124;`s` | `Column` | _Coming soon..._ | ... |
     */
    declare type FMTemplate = string;
    
    declare interface FRMTMods {
        CLR: '@';
        IDX: '#';
        COL: '?';
        PFX: '-';
        SFX: '+';
        DLM: ';';
        ELM: '&';
        CSE: '^';
        REP: '=';
    };
    declare interface FRMTColor {
        C: string;
        B: string;
        S: string;
        F: string;
    };
    declare interface FRMTColumn {
        C: string;
        W: string;
        R: string;
    };
    declare interface FRMTIndex {
        P:   string;
        '<': string;
        '>': string;
    };
    declare interface FRMTStruct {
        '-': string;
        '+': string;
        ';': string;
        '&': string;
        '@': FRMTColor;
        '^': string;
        '=': string;
        '?': FRMTColumn;
        '#': FRMTIndex;
    };
    declare interface FRMTOpts {
        Modify: string;
        Params: string;
        Struct: FRMTStruct;
    };
    declare interface FRMTFonts {
        color: string;
        backg: string;
        style: string;
        fonts: string;
    };
    declare interface FRMTTypes {
        /**
         * string
         */
        s: 'txt';
        /**
         * date
         */
        d: 'dte';
        /**
         * number
         */
        i: 'num';
        /**
         * float
         */
        f: 'num';
        /**
         * boolean
         */
        b: 'bln';
        /**
         * array
         */
        a: 'arr';
        /**
         * object
         */
        o: 'obj';
        /**
         * raw
         */
        r: 'raw';
    };
    
    /**
     * ...
     */
    declare const FRMT_MODS: FRMTMods;
    /**
     * ...
     */
    declare const FRMT_OPTS: FRMTOpts;
    /**
     * ...
     */
    declare const FRMT_TYPS: FRMTTypes;
    /**
     * ...
     */
    declare const FRMT_FNTS: FRMTFonts;
    
     
    /**
     * A robust, _`printf`-style_ `String` formatter. (_**see:** [printf](http://www.cplusplus.com/reference/cstdio/printf/)_)
     */
    export interface FRMT {
        /**
         * Creates an instance of FRMT.
         * @param nests A collection of inner templates that the primary template will reference
         * @param debug If `true`, output debug information to the console
         */
        (nests: FMTemplate[], debug: boolean): FRMT;
    }
    export class FRMT {
        /**
         * Creates an instance of FRMT.
         * @param nests A collection of inner templates that the primary template will reference
         * @param debug If `true`, output debug information to the console
         * @returns
         */
        constructor(nests: FMTemplate[], debug: boolean);
    
        /**
         * The format modifiers.
         */
        private readonly get MODS(): FRMTMods;
        /**
         * The format Options
         */
        private readonly get OPTNS(): FRMTOpts;
        /**
         * The format Font-styling.
         */
        private readonly get FNTS(): FRMTFonts;
        /**
         * The format Types
         */
        private readonly get TYPS(): FRMTTypes;
    
        /**
         * The `RGX` strategy.
         */
        private readonly get REG(): RGX;
    
        /**
         * ...
         */
        private readonly get Nstr(): RegExp;
        /**
         * ...
         */
        private readonly get Idxr(): RegExp;
        /**
         * ...
         */
        private readonly get Each(): RegExp;
        /**
         * ...
         */
        private readonly get Pair(): RegExp;
        /**
         * ...
         */
        private readonly get List(): RegExp;
        /**
         * ...
         */
        private readonly get Norm(): RegExp;
        /**
         * ...
         */
        private readonly get Keys(): RegExp;
        /**
         * ...
         */
        private readonly get PItr(): RegExp;
        /**
         * ...
         */
        private readonly get Opts(): RegExp;
        /**
         * ...
         */
        private readonly get OptO(): RegExp;
        /**
         * ...
         */
        private readonly get Pads(): RegExp;
        /**
         * ...
         */
        private readonly get Typs(): RegExp;
    
        /**
         * ...
         */
        LOGS(): void;
    
        /**
         * ...
         */
        private readonly get IDX(): any;
        /**
         * ...
         */
        private readonly get PADS(): any;
        /**
         * ...
         */
        private readonly get FLTR(): any;
    
        /**
         * ...
         */
        readonly get Find(): {
            /**
             * Finds the next `Object` literal to insert into the template
             * @param cnts The `FMCounts` object
             * @param grps The `FMGroups` object
             * @param strict The `FMStrict` flag
             * @param _typ The `FMtype` flag
             * @returns The next `Object` literal
             */
            Obj(cnts: FMCounts, grps: FMGroups, strict: boolean, _typ: FMType): DCT | Imm.Map;
            /**
             * Finds the next `Array` list to insert into the template
             * @param cnts The `FMCounts` object
             * @param grps The `FMGroups` object
             * @param strict The `FMStrict` flag
             * @param _typ The `FMtype` flag
             * @returns The next `Array` list
             */
            Lst(cnts: FMCounts, grps: FMGroups, strict: boolean, _typ: FMType): any;
            /**
             * Finds & formats the next `String|Number` to insert into the
             * template. This is the end of all template variables.
             * @param mch A value to replace or format; if applicable
             * @param cnts The `FMCounts` object
             * @param grps The `FMGroups` object
             * @param strict The `FMStrict` flag
             * @param typ The `FMtype` flag
             * @returns The formatted `String`
             */
            Nrm(mch: string | number, cnts: FMCounts, grps: FMGroups, strict: boolean, typ: FMType): string;
            /**
             * Finds the next set of named variable to insert into the template
             * @param txt The name variable `String`
             * @param mch The full name template variable
             * @param grps The `FMGroups` object for named variables
             * @param strict The `FMStrict` flag
             * @param _typ The `FMtype` flag
             * @returns The formatted `String`
             */
            Key(txt: string, mch: string | number, grps: FMGroups, strict: boolean, _typ: FMType): FMKeyVal;
        };
    
        /**
         * Registers valid format options.
         * @param opts The format options.
         */
        private Options(opts: FRMTStruct): FRMTStruct;
    
        /**
         * 
         * @param typs
         */
        private Types(typs: any): string;
        /**
         * 
         * @param pads
         */
        private Paddings(pads: any): string;
        /**
         * 
         * @param text
         * @param opt
         */
        private Replace(text: any, opt: any): string;
        /**
         * 
         * @param val
         */
        private Empty(val: any): string;
        /**
         * 
         * @param text
         * @param cases
         */
        private Case(text: any, cases: any): string;
        /**
         * 
         * @param text
         * @param font
         */
        private Font(text: any, font: any): string;
        /**
         * 
         * @param text
         * @param pfx
         * @param sfx
         * @param key
         */
        private Close(text: any, pfx: any, sfx: any, key: any): string;
        /**
         * 
         * @param ArgS
         */
        private KVs(ArgS: any): string;
        /**
         * 
         * @param key
         */
        private Nest(key: any): string;
        /**
         * 
         * @param res
         * @param opts
         * @param pads
         */
        private Delimit(res: any, opts: any, pads: any): string;
        /**
         * 
         * @param text
         * @param opts
         * @param pad
         * @param key
         */
        private Finalize(text: any, opts: any, pad: any, key: any): string;
    
        /**
         * Formats a `String` with a _`printf`-style_ template and given arguments.
         * @param template A _`printf`-style_ template ()
         * @param VARS The values to inster into the template. The last argument can be an `Object.<string,any>` for named variable.
         * @returns The formatted `String`
         */
        _(template: FMTemplate, ...VARS: any[]): string;
    
        /**
         * Prints an example.
         */
        ie(): void;
    
    }
    /**
     * Creates a column-string out of aa list of strings.
     */
    export class CLM {
        /**
         * Instantiate a new `CLM` instance.
         * @param lst A list of column values
         * @param _num ???
         * @param _title ???
         */
        constructor(lst: string[], _num: any, _title: any);
    
        private _: any;
    
        private lines: any;
    
    }
    /**
     * Creates and manages a string table.
     */
    export class CLMNS {
        /**
         * Instantiates a new `CLMS` object.
         * @param txt The text representing this table.
         * @param delim A delimeter used to constitute a column (_like `,` or `|`_).
         * @param suffix ???
         * @param log If `true`; prints out debuggin logs.
         */
        constructor(txt: string, delim: string, suffix: string, log: boolean);
    
        /**
         * The header column.
         */
        readonly get "0"(): string;
    
        /**
         * The amount of columns in this "table".
         */
        readonly get count(): number;
        /**
         * The amount of rouws in this "table".
         */
        readonly get lines(): number;
        /**
         * A blank column bucket.
         */
        readonly get shell(): string[];
        /**
         * 
         * @param
         */
        readonly get directs(): any;
    
        /**
         * 
         * @param val
         */
        fresh(val: any): void;
        /**
         * 
         * @param val
         * @param def
         * @param slash
         */
        clean(val: any, def: any, slash: any): void;
        /**
         * 
         * @param val
         */
        limit(val: any): void;
        /**
         * 
         * @param idx
         */
        regex(idx: any): void;
        /**
         * ...
         */
        group(): void;
        /**
         * ...
         */
        shlls(): void;
    
        /**
         * 
         * @param cb
         */
        map(cb: any): void;
    
        /**
         * 
         * @param delim
         */
        getDirects(delim: any): void;
        /**
         * 
         * @param align
         * @param border
         * @param callback
         */
        distribute(align: any, border: any, callback: any): void;
    
    }


    ///////////////////////////////////////////////////////////////////////////////////////

    
    /**
     * Template options for the `JSN`.`MapPrint()` function
     */
    interface JTemplates {
        /**
         * A template for both the key & val
         */
        all: Object;
        /**
         * A template for both the key only
         */
        key: Object;
        /**
         * A template for both the val only
         */
        val: Object;
    }

    /**
     * Delimiter options for the `JSN`.`MapPrint()` function
     */
    interface JDelimiter {
        /**
         * A delimiter between each key/value pair
         */
        all: string;
        /**
         * A delimiter between the key & value
         */
        pairs: string;
    }

    /**
     * Options for the `JSN`.`MapPrint()` function
     */
    interface JPatterns {
        /**
         * Delimiters for the key, values & pairs
         */
        delims: JDelimiter;
        /**
         * Templates for the key, values & pairs
         */
        patterns: JTemplates;
    }

    /**
     * A page `Number` for the `JSON` results
     */
    type JSNPage = number;

    /**
     * A limit `Number` for the `JSON` results
     */
    type JSNLimit = number;

    /**
     * A link to the **previous** page of `JSON` results
     */
    type JSNPrev = string;

    /**
     * A link to the **next** page of `JSON` results
     */
    type JSNNext = string;

    /**
     * A query parameter in a query `Object`
     */
    type JSNQParam = string|number;

    /**
     * The metadata in a `JSON` result object
     */
    interface JSNOptions {
        /**
         * The `POST` parameters
         */
        params: JSNPost;
        /**
         * The query parameters
         */
        query: JSNQuery;
    }

    /**
     * A `JSON` object for `HTTP` results
     */
    interface JSNResult {
        /**
         * A `0` for success or an `Error` code
         */
        status: number;
        /**
         * The result's metadata
         */
        options: JSNOptions;
        /**
         * The result's relavent links
         */
        links: JSNLinks;
        undefined: any;
    }

    /**
     * The payload object with a `JSON` results object
     */
    interface JSNPayload {
        /**
         * The `HTTP` status code
         */
        code: number;
        /**
         * The `JSON` results object
         */
        payload: JSNResult;
    }

    /**
     * Options for handling an `ELOGR` `Event`
     */
    interface LOptions {
        /**
         * The type of message
         */
        kind: string;
        /**
         * The message to print
         */
        msg: string;
        /**
         * A color to format the message
         */
        clr: string;
        /**
         * A handler to call on the `Event`
         */
        func: string;
    }

    /**
     * A collection of Handlers for each `ELOGR` `Event`
     */
    type LHandlers = { [optName: string]: LOptions; };

    
    /**
     * Handles and Logs the `Events` of an `Object`
     */
    export interface ELOGR {
        /**
         * Creates an instance of ELOGR.
         * @param cli An object to call & log methods
         * @param key An `Namspace` identifier
         * @param name The name of the `Namespace`
         * @param handlers A set of options & handlers for each `Event`
         */
        (cli: any, key: PropertyKey, name: PropertyKey, handlers: LHandlers): ELOGR;
    }
    export class ELOGR {
        /**
         * Creates an instance of ELOGR.
         * @param cli An object to call & log methods
         * @param key An `Namspace` identifier
         * @param name The name of the `Namespace`
         * @param handlers A set of options & handlers for each `Event`
         */
        constructor(cli: any, key: PropertyKey, name: PropertyKey, handlers: LHandlers);

        /**
         * Formats the `Event's` log message
         * @param err The log message, if an error occurs
         * @param msg The log message upon a successful `Event`
         * @returns The formatted message
         */
        format(err?: Error, msg?: any): string;

        /**
         * Returns a logging handler for the `Event`.
         * @param options The logging options.
         * @returns A logging handler for the `Event`.
         */
        log(options: {
            kind:  'err',
            msg?:  string,
            clr?:  string,
            name?: string,
            key?:  string,
            func?(...any): any
        }): (err, _res) => void;
        log(options: {
            kind:  'msg',
            msg?:  string,
            clr?:  string,
            name?: string,
            key?:  string,
            func?(...any): any
        }): () => void;
        log(options?: {
            kind:  '####',
            msg?:  string,
            clr?:  string,
            name?: string,
            key?:  string,
            func(...any): any
        }): (...any) => void;

    };

    /**
     * A `function` to time using the `LG`.`Timed` method
     */
    type CBtimed = ()=>void;

    /**
	 * Registers your custom App settings.
	 * @param settings Your custom settings, imported `./config/settings.cfg.js`.
	 */
	export function SetSettings(settings: CFG.Settings): void;

    /**
     * A collections of logging `functions`
     */
    export namespace LG {
        /**
         * Exactly like `console`, but only prints if the `Debug` option is
         * set to `true` in the `/config/settings.cfg.js` file
         * @param args Arguments to print to the `console`
         */
        function IF(...args: any): void;

        /**
         * Prints a formatted `Object` as **JSON** to the `console`
         * @param obj An `Object` to print to the `console`
         */
        function Object(obj: any): void;

        /**
         * Prints a Log with the date
         * @param template Arguments to print to the `console`
         * @param args Arguments to print to the `console`
         */
        function NOW(template?: string, ...args?: any): void;

        /**
         * Prints a formatted `Server` message to the `console`
         * @param id A message identifier
         * @param prefix A string to prepend to the message
         * @param suffix A string to append to the message
         * @param color A display color for the message
         */
        function Server(id: string | number, prefix: string, suffix: string, color: string): void;

        /**
         * Prints a formatted `Server` message to the `console`
         * @param func The `function` to be timed
         * @param id A message identifier
         * @param prefix A string to prepend to the message
         * @param suffix A string to append to the message
         * @param color A display color for the message
         */
        function Timed(func: CBtimed, id: string | number, prefix: string, suffix: string, color: string): void;

        /**
         * Prints a formatted `Error` message to the `console`
         * @param id A message identifier
         * @param prefix A string to prepend to the message
         * @param suffix A string to append to the message
         */
        function Error(id: string | number, prefix: string, suffix: string): void;

    }

    /**
     * A collection formatting `functions`
     */
    export namespace TLS {
        /**
         * Pulls `Array` of `Function` arguments
         * @param args The `Function` arguments object
         * @param from A `Number` to start the `Array` at
         * @returns An `Array` of `Function` arguments
         */
        function Args(args: arguments, from?: number): any[];

        /**
         * Gets the number of properties in an `Object`
         * @param items An `Object` to count
         * @returns The number of properties in the `Object`
         */
        function Cnt(items: any): number;

        /**
         * Formats the current `Date` to a `String`
         * @returns The `String`-formatted `Date`
         */
        function DT(): string;

        /**
		 * Gets the `UTC` date instead of local.
		 * @param {Date} [date] The date to convert. If `undefined`, uses the current date.
		 * @returns A `Number`, representing the number of `milliseconds` between the specified date-time and midnight, `01/01/1970`.
		 */
        function UTC(date?: Date): number;
        /**
		 * Gets the `UTC` date instead of local.
		 * @param {string} [date] The date to convert. If `undefined`, uses the current date.
		 * @returns A `Number`, representing the number of `milliseconds` between the specified date-time and midnight, `01/01/1970`.
		 */
        function UTC(date?: string): number;
        /**
		 * Gets the `UTC` date instead of local.
		 * @returns A `Number`, representing the number of `milliseconds` between the specified date-time and midnight, `01/01/1970`.
		 */
		function UTC(year:number, mnth?:number, day?:number, hrs?:number, mins?:number, secs:?number, milli?:number): number;

        /**
         * Insert a String value if said value is truthy
         * @param options
         * @returns
         */
        function Insert(options: Object): string;

        /**
         * I'll get back to you on this one.....
         * @param args
         * @returns The formatted `String`?
         */
        function Hug(...args: args): string;

        /**
         * Performs a deep-merge on two `Objects` (_great for default options_)
         * @param val An intial `Object`
         * @param def An `Object` of default values or mixins
         * @returns The fully merged `Object`
         */
        function Fill(val: { [key: string]: any }, def: { [key: string]: any }): { [key: string]: any };

        /**
         * Performs a `sprintf`-style `String` formattng given a template and input items
         * @param template The string template
         * @param items The items to places in the template
         * @returns A `sprintf`-formatted `String`
         */
        function Format(template: string, ...items: any): string;

        /**
         * Strips a character or set of characters from a given `String`
         * @param str The `String` toe strip
         * @param what The character(s) to strip
         * @returns The `String`, minus the character(s) given
         */
        function Strip(str: string, what: string): string;

        /**
         * Truncates a `String`
         * @param str The `String` to truncate
         * @param len The maxium lenth of the `String`
         * @returns The truncated `String`
         */
        function Trunc(str: string, len: number): string;

        /**
         * Creates a tree `Object` out of a multi-dimensional `Array`
         * @param list A multi-dimensional `Array`
         * @param others A property name for single-items
         * @returns The tree `Object`
         */
        function Tree(list: any[], others: string): any;

        /**
         * Formats a URI Path with Query parameters
         * @param paths An `Array` of Path
         * @param query An `Object` literal of Query parameters
         * @returns The formatted URI
         */
        function Path(paths: string[], query: any): string;

        /**
         * Tests if the value is an IP `Long Number`
         * @param long The (_hopefully_) IP `Long Number`
         * @returns
         */
        function IsIPLng(long: string | number): boolean;

        /**
         * Tests if the value is a validly formatted **IP Address**
         * @param ip The (_hopefully_) **IP Address** (`#`.`#`.`#`.`#`)
         * @returns
         */
        function IsIPStr(ip: string): boolean;

        /**
         * Converts a IP `Long Number` into an **IP Address**. If the IP
         * `Long Number` is not a `String`, it returns the same value
         * @param value The IP `Long Number`
         * @returns An **IP Address** (`#`.`#`.`#`.`#`)
         */
        function Lng2IP(value: string | number): string;

        /**
         * Converts an **IP Address** to an IP `Long Number`
         * @param value An **IP Address** (`#`.`#`.`#`.`#`)
         * @returns The IP `Long Number`
         */
        function IP2Lng(value: string): number;

        /**
         * Converts a MAC `Decimal String` into a **MAC Address**
         * @param dec The MAC `Decimal String`
         * @returns A **MAC Address** (`4F`:`12`:`CC`:`5D`:`D8`:`90`)
         */
        function Dec2Mac(dec: string): string;

        /**
         * Converts an **MAC Address** to a MAC `Decimal String`
         * @param mac A **MAC Address** (`4F`:`12`:`CC`:`5D`:`D8`:`90`)
         * @returns The MAC `Decimal String`
         */
        function Mac2Dec(mac: string): number;

        /**
         * Evaluates the arguments in order and returns the current value of the
         * first expression that initially does not evaluate to `falsy`.
         * @param val The value to coalesce
         * @param none The string to use if the value is `null`
         * @param add A string to append to the value
         * @param insert A `sprintf` template that the value will be placed into
         * @returns The first `truthy` expression
         */
        function Coalesce(val: string | number, none?: string, add?: string, insert?: string): string | number;

        /**
         * Concantenates a set of `String|Number` arguments (_with **NO** delimiter_)
         * @param args A set of arguments to concatenate
         * @returns The concatenate `String`
         */
        function Concat(...args: string | number): string;

        /**
         * Concantenates a set of delimited `String|Number` arguments
         * @param delim A set of characters to delimit the `Strings|Numbers` by
         * @param strings An `Array` of `Strings|Numbers` to concatenate
         * @returns The concatenate `String`
         */
        function ConcatD(delim: string, strings: (string | number)[]): string;

        /**
         * "Cleans" a `String` given a set of Patterns & Replacements
         * @param val The `String` to "clean"
         * @param conds An `Array` of _Find_ & _Replace_ values to "clean" the `String` with
         * @returns The "clean" `String`
         */
        function Clean(val: string, conds: any[]): string;

        /**
         * Ensures a `Number` value is always _**above**_ a given limit
         * @param val The `Number` value
         * @param limit The limit that this `Number` must _**exceed**_
         * @returns The original `Number` value, or the `limit+1`
         */
        function Positive(val: number, limit: number): number;

        /**
         * Ensures a `Number` value is always _**below**_ a given limit
         * @param val The `Number` value
         * @param limit The limit that this `Number` must _**subceed**_
         * @returns The original `Number` value, or the `limit-1`
         */
        function Negative(val: number, limit: number): number;

        /**
         * Removes all `falsy` elements from an `Array`
         * @param list A set of items to be compacted
         * @returns The compacted `Array`
         */
        function Compact(list: any[]): any[];

        /**
         * Creates a `RegExp` object for templating
         * @param pattern The template `String`
         * @param fillIn The key or set of keys for the template
         * @param options A `String` of `RegExp` modifiers
         * @returns The template `RegExp` object
         */
        function RGX(pattern: string, fillIn: string | number | (string | number)[], options: string): RegExp;

    }

    /**
     * A collection of `JSON` handling `functions`
     */
    export namespace JSN {
        /**
         * Returns a beautified, string-representation of an Object based on it's enumerable properties.
         * @param obj
         * @returns
         */
        function Normal(obj: object): string;

        /**
         * Formats and `Object` into a 4-space tabbed `JSON String`
         * @param obj The `Object` to format
         * @returns The formatted `JSON String`
         */
        function Pretty(obj: any): string;

        /**
         * A safe, compact version of `Object`.`hasOwnProperty(prop)`
         * @param obj The object to search
         * @param prop The property name to search for
         * @returns `true`, if found
         */
        function Has(obj: any, prop: string | number): boolean;

        /**
         * Like `Array`.`map()`, but for `Object` literals
         * @param obj An `Object` literal to Map
         * @param handler The handler for each property
         * @returns The newly mapped `Object` literal
         */
        function Map(obj: { [key: string]: any }, handler: Function): { [key: string]: any };

        /**
         * Like `JSN`.`map()`, except this maps to a specific property within
         * each property's own `Object` literal
         * @param obj An `Object` literal to Map
         * @param prop The sub-property to map to
         * @returns The newly mapped `Object` literal
         */
        function MapWith(obj: { [key: string]: any }, prop: PropertyKey): { [key: string]: any };

        /**
         * Edits the properties in an `Object` literal if the properties match a specified pattern
         * @param obj An `Object` literal to Map
         * @param handler The handler for each property
         * @param opts A `String` of `RegExp` modifiers
         * @returns The newly edited `Object` literal
         */
        function MapEdit(obj: { [key: string]: any }, handler: Function, opts: string): { [key: string]: any };

        /**
         * Formats an `Object` literal's keys & values into `String` given a specified template
         * @param obj An `Object` literal to format
         * @param patterns Patterns to format the keys/value pairs by
         * @param reverse Reverses the key order, if `true`
         * @returns The formatted `JSON String`
         */
        function MapPrint(obj: { [key: string]: string }, patterns: JPatterns, reverse: boolean): string;

        /**
         * Gets the length of an `Object` literal
         * @param obj The `Object` literal
         * @returns The length of the `Object` literal
         */
        function Len(obj: { [key: string]: string }): number;

        /**
         * Splits an `Object` literal into separate key and value `Arrays`
         * @param obj The `Object` literal
         * @returns An `Object` with the key and value `Arrays`
         */
        function KV(obj: { [key: string]: string }): Object;

        /**
         * Converts an `Array` of `Object` literals into a `JSON String` object for `HTTP`
         * requests. It does this by grabbing the specified **key** from each item, and adds
         * said item into an `Object` literal property as `key: item`. This is useful when
         * dealing with `MySQL.RowData`.
         * @param list An `Array` of `Row` results
         * @param key The property
         * @param cols An `Object` lieteral denoting the propety **path** to set each `Row` in.
         * @param qry A query object used for further customization
         * @returns A `JSON` formatted `String`
         */
        function Objectify(list: any, key: string | number, cols: any, qry: JSNQuery): string;

        /**
         * Creates an `Object` literal of options & links
         * @param pgn The page & limit `Numbers`
         * @param items The actual results themselves
         * @param prefix A preceding path for this `Endpoint`
         * @param params The `POST` parameters
         * @param links Any Related links
         * @returns An `Object` literal of options & links
         */
        function Optify(pgn: Object, items: any, prefix: string, params: JSNPost, links?: JSNLinks): Object;

        /**
         * Creates a `JSON` object for `HTTP` results
         * @param status A `0` for success or an `Error` code
         * @param value The actual results themselves
         * @param options The result's metadata
         * @param links The result's relavent links
         * @returns A `JSON` object for `HTTP` results
         */
        function Result(status: number, value: any, options?: JSNOptions, links?: JSNLinks): JSNResult;

        /**
         * Creates a payload object of `HTTP` results
         * @param itms The actual results themselves
         * @param options The result's metadata
         * @param links The result's relavent links
         * @param code The `HTTP` status code
         * @returns The payload object
         */
        function Valid(itms: any, options: JSNOptions, links: JSNLinks, code: number): JSNPayload;

        /**
         * Creates a payload object of `HTTP` documentation
         * @param url The `Endpoint` being documented
         * @param message A decsriptive message
         * @param usage The actual documentation
         * @param code code The `HTTP` status code
         * @returns The payload object
         */
        function Help(url: string, message: string, usage: any, code: number): JSNPayload;

        /**
         * Displays a specified message or the first line of the `Error.stack` if the message if `null`
         * @param message A message to display for the `Error`
         * @param err The `Error` object, which will be used if the message is `null`
         * @returns The `Error` message
         */
        function Error(message: string, err: Error): string;

    }

}

