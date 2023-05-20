/**
 * @license
 * Copyright (c) 2015 - 2022 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { OverlayElement } from '@vaadin/vaadin-overlay/src/vaadin-overlay.js';
import { PositionMixin } from './vcf-overlay-position-mixin.js';
import { html } from '@polymer/polymer/polymer-element.js';

let memoizedTemplate;

/**
 * An element used internally by `<vaadin-combo-box>`. Not intended to be used separately.
 *
 * @extends Overlay
 * @private
 */
export class ComboBoxOverlay extends PositionMixin(OverlayElement) {
  static get is() {
    return 'vcf-combo-box-overlay';
  }

  static get template() {
    if (!memoizedTemplate) {
      memoizedTemplate = super.template.cloneNode(true);
      memoizedTemplate.content.querySelector('[part~="overlay"]').removeAttribute('tabindex');
    }

    return html`
    <style>
        #overlay {
      width: var(--vaadin-combo-box-overlay-width, var(--_vcf-combo-box-overlay-default-width, auto));
      overflow: hidden;
    }

    [part='content'] {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  [part='content'] {
    padding: 0;
  }
  :host {
    --_vaadin-combo-box-items-container-border-width: var(--lumo-space-xs);
    --_vaadin-combo-box-items-container-border-style: solid;
    --_vaadin-combo-box-items-container-border-color: transparent;
  }
  /* Loading state */
  /* When items are empty, the spinner needs some room */
  :host(:not([closing])) [part~='content'] {
    min-height: calc(2 * var(--lumo-space-s) + var(--lumo-icon-size-s));
  }
  [part~='overlay'] {
    position: relative;
  }
  :host([top-aligned]) [part~='overlay'] {
    margin-top: var(--lumo-space-xs);
  }
  :host([bottom-aligned]) [part~='overlay'] {
    margin-bottom: var(--lumo-space-xs);
  }
  [part~='loader'] {
    position: absolute;
    z-index: 1;
    left: var(--lumo-space-s);
    right: var(--lumo-space-s);
    top: var(--lumo-space-s);
    margin-left: auto;
    margin-inline-start: auto;
    margin-inline-end: 0;
  }
  /* RTL specific styles */
  :host([dir='rtl']) [part~='loader'] {
    left: auto;
    margin-left: 0;
    margin-right: auto;
    margin-inline-start: 0;
    margin-inline-end: auto;
  }
    </style>
    ${memoizedTemplate}`;
  }

  static get observers() {
    return ['_setOverlayWidth(positionTarget, opened)'];
  }

  connectedCallback() {
    super.connectedCallback();

    const comboBox = this._comboBox;

    const hostDir = comboBox && comboBox.getAttribute('dir');
    if (hostDir) {
      this.setAttribute('dir', hostDir);
    }
  }

  requestContentUpdate() {
    if (this.renderer) {
      this.renderer.call(this.owner, this, this.owner, this.model);
    }
  }

  ready() {
    super.ready();
    const loader = document.createElement('div');
    loader.setAttribute('part', 'loader');
    const content = this.shadowRoot.querySelector('[part~="content"]');
    content.parentNode.insertBefore(loader, content);
    this.requiredVerticalSpace = 200;
  }

  _outsideClickListener(event) {
    const eventPath = event.composedPath();
    if (!eventPath.includes(this.positionTarget) && !eventPath.includes(this)) {
      this.close();
    }
  }

  _setOverlayWidth(positionTarget, opened) {
    if (positionTarget && opened) {
      const propPrefix = this.localName;
      this.style.setProperty(`--_${propPrefix}-default-width`, `${positionTarget.clientWidth}px`);

      const customWidth = getComputedStyle(this._comboBox).getPropertyValue(`--${propPrefix}-width`);

      if (customWidth === '') {
        this.style.removeProperty(`--${propPrefix}-width`);
      } else {
        this.style.setProperty(`--${propPrefix}-width`, customWidth);
      }

      this._updatePosition();
    }
  }
}

customElements.define(ComboBoxOverlay.is, ComboBoxOverlay);