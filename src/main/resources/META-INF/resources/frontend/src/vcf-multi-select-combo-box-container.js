/**
 * @license
 * Copyright (c) 2021 - 2022 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import {InputContainer} from '@vaadin/input-container/src/vaadin-input-container.js';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';

let memoizedTemplate;

/**
 * An element used internally by `<vaadin-multi-select-combo-box>`. Not intended to be used separately.
 *
 * @extends InputContainer
 * @private
 */
class MultiSelectComboBoxContainer extends InputContainer {
  static get is() {
    return 'vcf-multi-select-combo-box-container';
  }

  static get template() {
    if (!memoizedTemplate) {
      memoizedTemplate = super.template.cloneNode(true);
      const content = memoizedTemplate.content;
      const slots = content.querySelectorAll('slot');

      const wrapper = document.createElement('div');
      wrapper.setAttribute('id', 'wrapper');
      content.insertBefore(wrapper, slots[2]);

      wrapper.appendChild(slots[0]);
      wrapper.appendChild(slots[1]);
    }
    
    return html`
      <style>
    #wrapper {
      display: flex;
      width: 100%;
    }
      </style>
    ${memoizedTemplate}`;
  }
}

customElements.define(MultiSelectComboBoxContainer.is, MultiSelectComboBoxContainer);