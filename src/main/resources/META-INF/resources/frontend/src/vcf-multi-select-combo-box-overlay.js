/**
 * @license
 * Copyright (c) 2021 - 2022 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { ComboBoxOverlay } from './vcf-combo-box-overlay.js';
import { html } from '@polymer/polymer/polymer-element.js';

let memoizedTemplate;

/**
 * An element used internally by `<vcf-multi-select-combo-box>`. Not intended to be used separately.
 *
 * @extends ComboBoxOverlay
 * @private
 */
class MultiSelectComboBoxOverlay extends ComboBoxOverlay {
  static get is() {
    return 'vcf-multi-select-combo-box-overlay';
  }

  static get template () {
    if (!memoizedTemplate) {
      memoizedTemplate = super.template.cloneNode(true);
      memoizedTemplate.content.querySelector('[part~="overlay"]').removeAttribute('tabindex');
    }	  

    return html`
      <style>
    #overlay {
      width: var(
        --vaadin-multi-select-combo-box-overlay-width,
        var(--_vcf-multi-select-combo-box-overlay-default-width, auto)
      ) !important;
    }
      </style>
        ${memoizedTemplate}
      `;
  }
}

customElements.define(MultiSelectComboBoxOverlay.is, MultiSelectComboBoxOverlay);