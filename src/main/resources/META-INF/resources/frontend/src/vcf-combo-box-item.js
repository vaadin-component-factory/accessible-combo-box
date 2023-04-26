/**
 * @license
 * Copyright (c) 2015 - 2022 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { DirMixin } from '@vaadin/vaadin-element-mixin/vaadin-dir-mixin.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin';

/**
 * An item element used by the `<vaadin-combo-box>` dropdown.
 *
 * ### Styling
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name   | Description
 * ------------|--------------
 * `checkmark` | The graphical checkmark shown for a selected item
 * `content`   | The element that wraps the item content
 *
 * The following state attributes are exposed for styling:
 *
 * Attribute    | Description
 * -------------|-------------
 * `selected`   | Set when the item is selected
 * `focused`    | Set when the item is focused
 *
 * See [Styling Components](https://vaadin.com/docs/latest/styling/custom-theme/styling-components) documentation.
 *
 * @mixes ThemableMixin
 * @mixes DirMixin
 * @private
 */
export class ComboBoxItem extends ThemableMixin(DirMixin(PolymerElement)) {
  static get template() {
    return html`
      <style>
  :host {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    font-family: var(--lumo-font-family);
    font-size: var(--lumo-font-size-m);
    line-height: var(--lumo-line-height-xs);
    padding: 0.5em calc(var(--lumo-space-l) + var(--lumo-border-radius-m) / 4) 0.5em
      var(--_lumo-list-box-item-padding-left, calc(var(--lumo-border-radius-m) / 4));
    min-height: var(--lumo-size-m);
    outline: none;
    border-radius: var(--lumo-border-radius-m);
    cursor: var(--lumo-clickable-cursor);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: var(--lumo-primary-color-10pct);
  }

  /* Checkmark */
  [part='checkmark']::before {
    display: var(--_lumo-item-selected-icon-display, none);
    content: var(--lumo-icons-checkmark);
    font-family: lumo-icons;
    font-size: var(--lumo-icon-size-m);
    line-height: 1;
    font-weight: normal;
    width: 1em;
    height: 1em;
    margin: calc((1 - var(--lumo-line-height-xs)) * var(--lumo-font-size-m) / 2) 0;
    color: var(--lumo-primary-text-color);
    flex: none;
    opacity: 0;
    transition: transform 0.2s cubic-bezier(0.12, 0.32, 0.54, 2), opacity 0.1s;
  }

  :host([selected]) [part='checkmark']::before {
    opacity: 1;
  }

  :host([active]:not([selected])) [part='checkmark']::before {
    transform: scale(0.8);
    opacity: 0;
    transition-duration: 0s;
  }

  [part='content'] {
    flex: auto;
  }

  /* Disabled */
  :host([disabled]) {
    color: var(--lumo-disabled-text-color);
    cursor: default;
    pointer-events: none;
  }

  /* TODO a workaround until we have "focus-follows-mouse". After that, use the hover style for focus-ring as well */
  @media (any-hover: hover) {
    :host(:hover:not([disabled])) {
      background-color: var(--lumo-primary-color-10pct);
    }

    :host([focus-ring]:not([disabled])) {
      box-shadow: inset 0 0 0 2px var(--lumo-primary-color-50pct);
    }
  }

  /* RTL specific styles */
  :host([dir='rtl']) {
    padding-left: calc(var(--lumo-space-l) + var(--lumo-border-radius-m) / 4);
    padding-right: var(--_lumo-list-box-item-padding-left, calc(var(--lumo-border-radius-m) / 4));
  }

  /* Slotted icons */
  :host ::slotted(vaadin-icon) {
    width: var(--lumo-icon-size-m);
    height: var(--lumo-icon-size-m);
  }


  :host {
    transition: background-color 100ms;
    overflow: hidden;
    --_lumo-item-selected-icon-display: block;
  }

  @media (any-hover: hover) {
    :host([focused]:not([disabled])) {
      box-shadow: inset 0 0 0 2px var(--lumo-primary-color-50pct);
    }
  }
      </style>
      <span part="checkmark" aria-hidden="true"></span>
      <div part="content">
        <slot></slot>
      </div>
    `;
  }

  static get is() {
    return 'vcf-combo-box-item';
  }

  static get properties() {
    return {
      /**
       * The index of the item
       */
      index: Number,

      /**
       * The item to render
       * @type {(String|Object)}
       */
      item: Object,

      /**
       * The text label corresponding to the item
       */
      label: String,

      /**
       * True when item is selected
       */
      selected: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
      },

      /**
       * True when item is focused
       */
      focused: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
      },

      /**
       * Custom function for rendering the content of the `<vaadin-combo-box-item>` propagated from the combo box element.
       */
      renderer: Function,

      /**
       * Saved instance of a custom renderer function.
       */
      _oldRenderer: Function,
    };
  }

  static get observers() {
    return ['__rendererOrItemChanged(renderer, index, item.*, selected, focused)', '__updateLabel(label, renderer)'];
  }

  connectedCallback() {
    super.connectedCallback();

    this._comboBox = this.parentNode.comboBox;

    const hostDir = this._comboBox.getAttribute('dir');
    if (hostDir) {
      this.setAttribute('dir', hostDir);
    }
  }

  /**
   * Requests an update for the content of the item.
   * While performing the update, it invokes the renderer passed in the `renderer` property.
   *
   * It is not guaranteed that the update happens immediately (synchronously) after it is requested.
   */
  requestContentUpdate() {
    if (!this.renderer) {
      return;
    }

    const model = {
      index: this.index,
      item: this.item,
      focused: this.focused,
      selected: this.selected,
    };

    this.renderer(this, this._comboBox, model);
  }

  /** @private */
  __rendererOrItemChanged(renderer, index, item) {
    if (item === undefined || index === undefined) {
      return;
    }

    if (this._oldRenderer !== renderer) {
      this.innerHTML = '';
      // Whenever a Lit-based renderer is used, it assigns a Lit part to the node it was rendered into.
      // When clearing the rendered content, this part needs to be manually disposed of.
      // Otherwise, using a Lit-based renderer on the same node will throw an exception or render nothing afterward.
      delete this._$litPart$;
    }

    if (renderer) {
      this._oldRenderer = renderer;
      this.requestContentUpdate();
    }
  }

  /** @private */
  __updateLabel(label, renderer) {
    if (renderer) {
      return;
    }

    this.textContent = label;
  }
}

customElements.define(ComboBoxItem.is, ComboBoxItem);