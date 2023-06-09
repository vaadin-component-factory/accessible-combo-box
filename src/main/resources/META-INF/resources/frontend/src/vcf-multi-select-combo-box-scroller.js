/**
 * @license
 * Copyright (c) 2021 - 2022 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { ComboBoxPlaceholder } from './vcf-combo-box-placeholder.js';
import { ComboBoxScroller } from './vcf-combo-box-scroller.js';

/**
 * An element used internally by `<vcf-multi-select-combo-box>`. Not intended to be used separately.
 *
 * @extends ComboBoxScroller
 * @private
 */
class MultiSelectComboBoxScroller extends ComboBoxScroller {
  static get is() {
    return 'vcf-multi-select-combo-box-scroller';
  }

  /** @protected */
  ready() {
    super.ready();

    this.setAttribute('aria-multiselectable', 'true');
  }

  /**
   * @protected
   * @override
   */
  _isItemSelected(item, _selectedItem, itemIdPath) {
    if (item instanceof ComboBoxPlaceholder) {
      return false;
    }

    if (this.comboBox.readonly) {
      return false;
    }

    return this.comboBox._findIndex(item, this.comboBox.selectedItems, itemIdPath) > -1;
  }

  /** @private */
  __updateElement(el, index) {
    super.__updateElement(el, index);

    el.toggleAttribute('readonly', this.comboBox.readonly);
  }
}

customElements.define(MultiSelectComboBoxScroller.is, MultiSelectComboBoxScroller);