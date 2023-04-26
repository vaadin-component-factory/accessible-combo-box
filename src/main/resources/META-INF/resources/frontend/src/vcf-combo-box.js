/**
 * @license
 * Copyright (c) 2015 - 2022 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import '@vaadin/input-container/src/vaadin-input-container.js';
import './vcf-combo-box-item.js';
import './vcf-combo-box-overlay.js';
import './vcf-combo-box-scroller.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { ElementMixin } from '@vaadin/vaadin-element-mixin';
import { InputControlMixin } from '@vaadin/field-base/src/input-control-mixin.js';
import { InputController } from '@vaadin/field-base/src/input-controller.js';
import { LabelledInputController } from '@vaadin/field-base/src/labelled-input-controller.js';
import { PatternMixin } from '@vaadin/field-base/src/pattern-mixin.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin';
import { ComboBoxDataProviderMixin } from './vcf-combo-box-data-provider-mixin.js';
import { ComboBoxMixin } from './vcf-combo-box-mixin.js';

/**
 * `<vaadin-combo-box>` is a web component for choosing a value from a filterable list of options
 * presented in a dropdown overlay. The options can be provided as a list of strings or objects
 * by setting [`items`](#/elements/vaadin-combo-box#property-items) property on the element.
 *
 * ```html
 * <vaadin-combo-box id="combo-box"></vaadin-combo-box>
 * ```
 *
 * ```js
 * document.querySelector('#combo-box').items = ['apple', 'orange', 'banana'];
 * ```
 *
 * When the selected `value` is changed, a `value-changed` event is triggered.
 *
 * ### Item rendering
 *
 * To customize the content of the `<vaadin-combo-box-item>` elements placed in the dropdown, use
 * [`renderer`](#/elements/vaadin-combo-box#property-renderer) property which accepts a function.
 * The renderer function is called with `root`, `comboBox`, and `model` as arguments.
 *
 * Generate DOM content by using `model` object properties if needed, and append it to the `root`
 * element. The `comboBox` reference is provided to access the combo-box element state. Do not
 * set combo-box properties in a `renderer` function.
 *
 * ```js
 * const comboBox = document.querySelector('#combo-box');
 * comboBox.items = [{'label': 'Hydrogen', 'value': 'H'}];
 * comboBox.renderer = (root, comboBox, model) => {
 *   const item = model.item;
 *   root.innerHTML = `${model.index}: ${item.label} <b>${item.value}</b>`;
 * };
 * ```
 *
 * Renderer is called on the opening of the combo-box and each time the related model is updated.
 * Before creating new content, it is recommended to check if there is already an existing DOM
 * element in `root` from a previous renderer call for reusing it. Even though combo-box uses
 * infinite scrolling, reducing DOM operations might improve performance.
 *
 * The following properties are available in the `model` argument:
 *
 * Property   | Type             | Description
 * -----------|------------------|-------------
 * `index`    | Number           | Index of the item in the `items` array
 * `item`     | String or Object | The item reference
 * `selected` | Boolean          | True when item is selected
 * `focused`  | Boolean          | True when item is focused
 *
 * ### Lazy Loading with Function Data Provider
 *
 * In addition to assigning an array to the items property, you can alternatively use the
 * [`dataProvider`](#/elements/vaadin-combo-box#property-dataProvider) function property.
 * The `<vaadin-combo-box>` calls this function lazily, only when it needs more data
 * to be displayed.
 *
 * __Note that when using function data providers, the total number of items
 * needs to be set manually. The total number of items can be returned
 * in the second argument of the data provider callback:__
 *
 * ```js
 * comboBox.dataProvider = async (params, callback) => {
 *   const API = 'https://demo.vaadin.com/demo-data/1.0/filtered-countries';
 *   const { filter, page, pageSize } = params;
 *   const index = page * pageSize;
 *
 *   const res = await fetch(`${API}?index=${index}&count=${pageSize}&filter=${filter}`);
 *   if (res.ok) {
 *     const { result, size } = await res.json();
 *     callback(result, size);
 *   }
 * };
 * ```
 *
 * ### Styling
 *
 * The following custom properties are available for styling:
 *
 * Custom property                         | Description                | Default
 * ----------------------------------------|----------------------------|---------
 * `--vaadin-field-default-width`          | Default width of the field | `12em`
 * `--vaadin-combo-box-overlay-width`      | Width of the overlay       | `auto`
 * `--vaadin-combo-box-overlay-max-height` | Max height of the overlay  | `65vh`
 *
 * `<vaadin-combo-box>` provides the same set of shadow DOM parts and state attributes as `<vaadin-text-field>`.
 * See [`<vaadin-text-field>`](#/elements/vaadin-text-field) for the styling documentation.
 *
 * In addition to `<vaadin-text-field>` parts, the following parts are available for theming:
 *
 * Part name       | Description
 * ----------------|----------------
 * `toggle-button` | The toggle button
 *
 * In addition to `<vaadin-text-field>` state attributes, the following state attributes are available for theming:
 *
 * Attribute | Description | Part name
 * ----------|-------------|------------
 * `opened`  | Set when the combo box dropdown is open | :host
 * `loading` | Set when new items are expected | :host
 *
 * If you want to replace the default `<input>` and its container with a custom implementation to get full control
 * over the input field, consider using the [`<vaadin-combo-box-light>`](#/elements/vaadin-combo-box-light) element.
 *
 * ### Internal components
 *
 * In addition to `<vaadin-combo-box>` itself, the following internal
 * components are themable:
 *
 * - `<vaadin-combo-box-overlay>` - has the same API as [`<vaadin-overlay>`](#/elements/vaadin-overlay).
 * - `<vaadin-combo-box-item>` - has the same API as [`<vaadin-item>`](#/elements/vaadin-item).
 * - [`<vaadin-input-container>`](#/elements/vaadin-input-container) - an internal element wrapping the input.
 *
 * Note: the `theme` attribute value set on `<vaadin-combo-box>` is
 * propagated to the internal components listed above.
 *
 * See [Styling Components](https://vaadin.com/docs/latest/styling/custom-theme/styling-components) documentation.
 *
 * @fires {Event} change - Fired when the user commits a value change.
 * @fires {CustomEvent} custom-value-set - Fired when the user sets a custom value.
 * @fires {CustomEvent} filter-changed - Fired when the `filter` property changes.
 * @fires {CustomEvent} invalid-changed - Fired when the `invalid` property changes.
 * @fires {CustomEvent} opened-changed - Fired when the `opened` property changes.
 * @fires {CustomEvent} selected-item-changed - Fired when the `selectedItem` property changes.
 * @fires {CustomEvent} value-changed - Fired when the `value` property changes.
 * @fires {CustomEvent} validated - Fired whenever the field is validated.
 *
 * @extends HTMLElement
 * @mixes ElementMixin
 * @mixes ThemableMixin
 * @mixes InputControlMixin
 * @mixes PatternMixin
 * @mixes ComboBoxDataProviderMixin
 * @mixes ComboBoxMixin
 */
class ComboBox extends ComboBoxDataProviderMixin(
  ComboBoxMixin(PatternMixin(InputControlMixin(ThemableMixin(ElementMixin(PolymerElement))))),
) {
  static get is() {
    return 'vcf-combo-box';
  }

  static get template() {
    return html`
      <style>
        :host([opened]) {
          pointer-events: auto;
        }
  [part='clear-button'] {
    display: none;
    cursor: default;
  }
  [part='clear-button']::before {
    content: '✕';
  }
:host {
    --lumo-text-field-size: var(--lumo-size-m);
    color: var(--lumo-body-text-color);
    font-size: var(--lumo-font-size-m);
    font-family: var(--lumo-font-family);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
    padding: var(--lumo-space-xs) 0;
}  
  :host([clear-button-visible][has-value]:not([disabled]):not([readonly])) [part='clear-button'] {
    display: block;
  }
  :host::before {
    height: var(--lumo-text-field-size);
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
  }
    [class$='container'] {
    display: flex;
    flex-direction: column;
    min-width: 100%;
    max-width: 100%;
    width: var(--vaadin-field-default-width, 12em);
  }
    :host {
    display: inline-flex;
    outline: none;
  }
  [part='label']::before {
    content: '\\2003';
    width: 0;
    display: inline-block;
  }
  :host([hidden]) {
    display: none !important;
  }
  :host(:not([has-label])) [part='label'] {
    display: none;
  }
  :host([has-label]) {
    padding-top: var(--lumo-space-m);
  }
    vaadin-input-container {
      min-height: var(--lumo-text-field-size, var(--lumo-size-m));	
      border-radius: var(--lumo-border-radius-m);
      background-color: var(--lumo-contrast-10pct);
      padding: 0 calc(0.375em + var(--lumo-border-radius-m) / 4 - 1px);
      font-weight: 500;
      line-height: 1;
      position: relative;
      cursor: text;
      box-sizing: border-box;
    }
    /* Used for hover and activation effects */
    vaadin-input-container::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      border-radius: inherit;
      pointer-events: none;
      background-color: var(--lumo-contrast-50pct);
      opacity: 0;
      transition: transform 0.15s, opacity 0.2s;
      transform-origin: 100% 0;
    }
    vaadin-input-container::slotted(:not([slot$='fix'])) {
      cursor: inherit;
      min-height: var(--lumo-text-field-size, var(--lumo-size-m));
      padding: 0 0.25em;
      --_lumo-text-field-overflow-mask-image: linear-gradient(to left, transparent, #000 1.25em);
      -webkit-mask-image: var(--_lumo-text-field-overflow-mask-image);
      mask-image: var(--_lumo-text-field-overflow-mask-image);
    }
    /* Read-only */
    vaadin-input-container[readonly] {
      color: var(--lumo-secondary-text-color);
      background-color: transparent;
      cursor: default;
      --vaadin-input-field-border-color: transparent;
      opacity: 1;
      border: 1px dashed var(--lumo-contrast-30pct);
    }
    /* Disabled */
      :host([disabled]) [part='label'],
  :host([disabled]) [part='input-field'] ::slotted(*) {
    color: var(--lumo-disabled-text-color);
    -webkit-text-fill-color: var(--lumo-disabled-text-color);
  }
    vaadin-input-container[disabled] {
      background-color: var(--lumo-contrast-5pct);
    }
    vaadin-input-container[disabled] ::slotted(*) {
      color: var(--lumo-disabled-text-color);
      -webkit-text-fill-color: var(--lumo-disabled-text-color);
    }
    /* Invalid */
    vaadin-input-container[invalid] {
      background-color: var(--lumo-error-color-10pct);
    }
    vaadin-input-container[invalid]::after {
      background-color: var(--lumo-error-color-50pct);
    }
    :host([focus-ring]) [part='input-field'] {
    box-shadow: 0 0 0 2px var(--lumo-primary-color-50pct);
    }
    :host([invalid][focus-ring]) [part='input-field'] {
    box-shadow: 0 0 0 2px var(--lumo-error-color-50pct);
    }
   :host([theme~='small']) {
    font-size: var(--lumo-font-size-s);
    --lumo-text-field-size: var(--lumo-size-s);
  }
  :host([theme~='small']) [part='label'] {
    font-size: var(--lumo-font-size-xs);
  }
  :host([theme~='small']) [part='error-message'] {
    font-size: var(--lumo-font-size-xxs);
  }   
    ::slotted(:is(input, textarea))::placeholder {
      font: inherit;
      color: inherit;
      opacity: 1;
    }
    ::slotted(:is(input, textarea):placeholder-shown) {
      color: var(--lumo-secondary-text-color);
    }
    /* Slotted icons */
    ::slotted(iron-icon),
    ::slotted(vaadin-icon) {
      color: var(--lumo-contrast-60pct);
      width: var(--lumo-icon-size-m);
      height: var(--lumo-icon-size-m);
    }
    /* Vaadin icons are based on a 16x16 grid (unlike Lumo and Material icons with 24x24), so they look too big by default */
    ::slotted(iron-icon[icon^='vaadin:']),
    ::slotted(vaadin-icon[icon^='vaadin:']) {
      padding: 0.25em;
      box-sizing: border-box !important;
    }
    /* Text align */
    :host([dir='rtl']) ::slotted(:not([slot$='fix'])) {
      --_lumo-text-field-overflow-mask-image: linear-gradient(to right, transparent, #000 1.25em);
    }
    @-moz-document url-prefix() {
      :host([dir='rtl']) ::slotted(:not([slot$='fix'])) {
        mask-image: var(--_lumo-text-field-overflow-mask-image);
      }
    }
    :host([theme~='align-left']) ::slotted(:not([slot$='fix'])) {
      text-align: start;
      --_lumo-text-field-overflow-mask-image: none;
    }
    :host([theme~='align-center']) ::slotted(:not([slot$='fix'])) {
      text-align: center;
      --_lumo-text-field-overflow-mask-image: none;
    }
    :host([theme~='align-right']) ::slotted(:not([slot$='fix'])) {
      text-align: end;
      --_lumo-text-field-overflow-mask-image: none;
    }
    @-moz-document url-prefix() {
      /* Firefox is smart enough to align overflowing text to right */
      :host([theme~='align-right']) ::slotted(:not([slot$='fix'])) {
        --_lumo-text-field-overflow-mask-image: linear-gradient(to right, transparent 0.25em, #000 1.5em);
      }
    }
    @-moz-document url-prefix() {
      /* Firefox is smart enough to align overflowing text to right */
      :host([theme~='align-left']) ::slotted(:not([slot$='fix'])) {
        --_lumo-text-field-overflow-mask-image: linear-gradient(to left, transparent 0.25em, #000 1.5em);
      }
    }
    /* RTL specific styles */
    vaadin-input-container[dir='rtl']::after {
      transform-origin: 0% 0;
    }
    vaadin-input-container[theme~='align-left'][dir='rtl'] ::slotted(:not([slot$='fix'])) {
      --_lumo-text-field-overflow-mask-image: none;
    }
    vaadin-input-container[theme~='align-center'][dir='rtl'] ::slotted(:not([slot$='fix'])) {
      --_lumo-text-field-overflow-mask-image: none;
    }
    vaadin-input-container[theme~='align-right'][dir='rtl'] ::slotted(:not([slot$='fix'])) {
      --_lumo-text-field-overflow-mask-image: none;
    }
    @-moz-document url-prefix() {
      /* Firefox is smart enough to align overflowing text to right */
      :host([theme~='align-right'][dir='rtl']) ::slotted(:not([slot$='fix'])) {
        --_lumo-text-field-overflow-mask-image: linear-gradient(to right, transparent 0.25em, #000 1.5em);
      }
    }
    @-moz-document url-prefix() {
      /* Firefox is smart enough to align overflowing text to right */
      :host([theme~='align-left'][dir='rtl']) ::slotted(:not([slot$='fix'])) {
        --_lumo-text-field-overflow-mask-image: linear-gradient(to left, transparent 0.25em, #000 1.5em);
      }
    }
    :host {
      outline: none;
    }
    [part='toggle-button']::before {
      content: '\\ea18';
    }
    [part$='button']::before {
      font-family: 'lumo-icons';
      display: block;
    }
[part='label'] {
    align-self: flex-start;
    color: var(--lumo-secondary-text-color);
    font-weight: 500;
    font-size: var(--lumo-font-size-s);
    margin-left: calc(var(--lumo-border-radius-m) / 4);
    transition: color 0.2s;
    line-height: 1;
    padding-right: 1em;
    padding-bottom: 0.5em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    position: relative;
    max-width: 100%;
    box-sizing: border-box;
}
  :host([has-label])::before {
    margin-top: calc(var(--lumo-font-size-s) * 1.5);
  }
  :host([has-label][theme~='small'])::before {
    margin-top: calc(var(--lumo-font-size-xs) * 1.5);
  }
  :host([has-label]) {
    padding-top: var(--lumo-space-m);
  }
  :host([has-label]) ::slotted([slot='tooltip']) {
    --vaadin-tooltip-offset-bottom: calc((var(--lumo-space-m) - var(--lumo-space-xs)) * -1);
  }
  :host([required]) [part='required-indicator']::after {
    content: var(--lumo-required-field-indicator, '•');
    transition: opacity 0.2s;
    color: var(--lumo-required-field-indicator-color, var(--lumo-primary-text-color));
    position: absolute;
    right: 0;
    width: 1em;
    text-align: center;
  }
  :host([invalid]) [part='required-indicator']::after {
    color: var(--lumo-required-field-indicator-color, var(--lumo-error-text-color));
  }
:host(:hover:not([readonly]):not([focused])) [part='label'] {
    color: var(--lumo-body-text-color);
}
  :host(:hover:not([readonly]):not([focused])) [part='input-field']::after {
    opacity: 0.1;
  }
:host([focused]:not([readonly])) [part='label'] {
    color: var(--lumo-primary-text-color);
}
  :host([focused]:not([focus-ring]):not([readonly])) [part='input-field']::after {
    transform: scaleX(0);
    transition-duration: 0.15s, 1s;
  }
  @media (pointer: coarse) {
    :host(:hover:not([readonly]):not([focused])) [part='label'] {
      color: var(--lumo-secondary-text-color);
    }
    :host(:hover:not([readonly]):not([focused])) [part='input-field']::after {
      opacity: 0;
    }
    :host(:active:not([readonly]):not([focused])) [part='input-field']::after {
      opacity: 0.2;
    }
  }
    :host([has-helper]) [part='helper-text']::before {
    content: '';
    display: block;
    height: 0.4em;
  }
[part='helper-text'] {
    display: block;
    color: var(--lumo-secondary-text-color);
    font-size: var(--lumo-font-size-xs);
    line-height: var(--lumo-line-height-xs);
    margin-left: calc(var(--lumo-border-radius-m) / 4);
    transition: color 0.2s;
}
  :host(:hover:not([readonly])) [part='helper-text'] {
    color: var(--lumo-body-text-color);
  }
  :host([disabled]) [part='helper-text'] {
    color: var(--lumo-disabled-text-color);
    -webkit-text-fill-color: var(--lumo-disabled-text-color);
  }
  :host([has-helper][theme~='helper-above-field']) [part='helper-text']::before {
    display: none;
  }
  :host([has-helper][theme~='helper-above-field']) [part='helper-text']::after {
    content: '';
    display: block;
    height: 0.4em;
  }
    :host([has-helper][theme~='helper-above-field']) [part='label'] {
    order: 0;
    padding-bottom: 0.4em;
  }
  :host([has-helper][theme~='helper-above-field']) [part='helper-text'] {
    order: 1;
  }
  :host([has-helper][theme~='helper-above-field']) [part='label'] + * {
    order: 2;
  }
  :host([has-helper][theme~='helper-above-field']) [part='error-message'] {
    order: 3;
  }
[part='error-message'] {
    margin-left: calc(var(--lumo-border-radius-m) / 4);
    font-size: var(--lumo-font-size-xs);
    line-height: var(--lumo-line-height-xs);
    color: var(--lumo-error-text-color);
    will-change: max-height;
    transition: 0.4s max-height;
    max-height: 5em;
}
  :host([has-error-message]) [part='error-message']::before,
  :host([has-error-message]) [part='error-message']::after {
    content: '';
    display: block;
    height: 0.4em;
  }
    :host([dir='rtl']) [part='label'] {
    margin-left: 0;
    margin-right: calc(var(--lumo-border-radius-m) / 4);
  }
  :host([dir='rtl']) [part='label'] {
    padding-left: 1em;
    padding-right: 0;
  }
  :host([dir='rtl']) [part='required-indicator']::after {
    right: auto;
    left: 0;
  }
  :host([dir='rtl']) [part='error-message'] {
    margin-left: 0;
    margin-right: calc(var(--lumo-border-radius-m) / 4);
  }
:host([invalid]) {
    --vaadin-input-field-border-color: var(--lumo-error-color);
}
        </style>

      <div class="vaadin-combo-box-container">
        <div part="label">
          <slot name="label"></slot>
          <span part="required-indicator" aria-hidden="true" on-click="focus"></span>
        </div>

        <vaadin-input-container
          part="input-field"
          readonly="[[readonly]]"
          disabled="[[disabled]]"
          invalid="[[invalid]]"
          theme$="[[_theme]]"
        >
          <slot name="prefix" slot="prefix"></slot>
          <slot name="input"></slot>
          <div id="clearButton" part="clear-button" slot="suffix" aria-hidden="true"></div>
          <div id="toggleButton" part="toggle-button" slot="suffix" aria-hidden="true"></div>
        </vaadin-input-container>

        <div part="helper-text">
          <slot name="helper"></slot>
        </div>

        <div part="error-message">
          <slot name="error-message"></slot>
        </div>
      </div>

      <vcf-combo-box-overlay
        id="overlay"
        opened="[[_overlayOpened]]"
        loading$="[[loading]]"
        theme$="[[_theme]]"
        position-target="[[_positionTarget]]"
        no-vertical-overlap
        restore-focus-node="[[inputElement]]"
      ></vcf-combo-box-overlay>
    `;
  }

  static get properties() {
    return {
      /**
       * @protected
       */
      _positionTarget: {
        type: Object,
      },
    };
  }

  /**
   * Used by `InputControlMixin` as a reference to the clear button element.
   * @protected
   * @return {!HTMLElement}
   */
  get clearElement() {
    return this.$.clearButton;
  }

  /** @protected */
  ready() {
    super.ready();

    this.addController(
      new InputController(this, (input) => {
        this._setInputElement(input);
        this._setFocusElement(input);
        this.stateTarget = input;
        this.ariaTarget = input;
      }),
    );
    this.addController(new LabelledInputController(this.inputElement, this._labelController));

    this._positionTarget = this.shadowRoot.querySelector('[part="input-field"]');
    this._toggleElement = this.$.toggleButton;
  }

  /**
   * Override method inherited from `FocusMixin` to validate on blur.
   * @param {boolean} focused
   * @protected
   * @override
   */
  _setFocused(focused) {
    super._setFocused(focused);

    if (!focused) {
      this.validate();
    }
  }

  /**
   * Override method inherited from `FocusMixin` to not remove focused
   * state when focus moves to the overlay.
   * @param {FocusEvent} event
   * @return {boolean}
   * @protected
   * @override
   */
  _shouldRemoveFocus(event) {
    // Do not blur when focus moves to the overlay
    if (event.relatedTarget === this.$.overlay) {
      event.composedPath()[0].focus();
      return false;
    }

    return true;
  }

  /**
   * Override method inherited from `InputControlMixin` to handle clear
   * button click and stop event from propagating to the host element.
   * @param {Event} event
   * @protected
   * @override
   */
  _onClearButtonClick(event) {
    event.stopPropagation();

    this._handleClearButtonClick(event);
  }

  /**
   * @param {Event} event
   * @protected
   */
  _onHostClick(event) {
    const path = event.composedPath();

    // Open dropdown only when clicking on the label or input field
    if (path.includes(this._labelNode) || path.includes(this._positionTarget)) {
      super._onHostClick(event);
    }
  }
}

customElements.define(ComboBox.is, ComboBox);

export { ComboBox };