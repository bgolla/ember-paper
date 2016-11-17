/**
 * @module ember-paper
 */
import Component from '@ember/component';
import { not } from '@ember/object/computed';
import { computed } from '@ember/object';
import layout from '../templates/components/paper-autocomplete-trigger';

const { Component, isPresent, isBlank, run, get, computed, ObjectProxy } = Ember;

/**
 * @class PaperAutocompleteTrigger
 * @extends Ember.Component
 */
export default Component.extend({
  layout,
  tagName: 'md-autocomplete-wrap',
  classNames: ['md-show-clear-button'],
  classNameBindings: ['noLabel:md-whiteframe-z1', 'select.isOpen:md-menu-showing'],

  noLabel: computed.not('extra.label'),
  _innerText: computed.oneWay('searchText'),

  text: computed('selected', 'searchText', '_innerText', {
    get() {
      let {
        selected,
        searchText,
        _innerText
      } = this.getProperties('selected', 'searchText', '_innerText');

      let selectedValue = (selected instanceof ObjectProxy) ? get(selected, 'content') : selected;
      if (selectedValue) {
        return this.getSelectedAsText();
      }
      return searchText ? searchText : _innerText;
    },
    set(_, v) {
      let { selected, searchText } = this.getProperties('selected', 'searchText');
      this.set('_innerText', v);

      // searchText should always win
      if (!selected && isPresent(searchText)) {
        return searchText;
      }

  text: computed('select.{searchText,selected}', function() {
    let selected = this.get('select.selected');
    if (selected) {
      return this.getSelectedAsText();
    }
    return this.get('select.searchText');
  }).readOnly(),

  // Lifecycle hooks
  didUpdateAttrs() {
    this._super(...arguments);
    let prevDisabled = this.get('_prevDisabled');
    let disabled = this.get('disabled');
    if (prevDisabled && !disabled) {
      this.set('resetButtonDestroyed', false);
    }

    this.setProperties({
      _prevDisabled: disabled
    });
  },

  // Actions
  actions: {
    stopPropagation(e) {
      e.stopPropagation();
    },

    clear(e) {
      e.stopPropagation();
      if (this.get('onClear')) {
        this.get('onClear')();
      } else {
        this.get('select').actions.select(null);
        this.get('onInput')({ target: { value: '' } });
      }
      this.get('onFocus')(e);
      this.$('input').focus();
    },

    handleKeydown(e) {
      let isLetter = e.keyCode >= 48 && e.keyCode <= 90 || e.keyCode === 32; // Keys 0-9, a-z or SPACE
      let isSpecialKeyWhileClosed = !isLetter && !this.get('select.isOpen') && [13, 27, 38, 40].indexOf(e.keyCode) > -1;
      if (isLetter || isSpecialKeyWhileClosed) {
        e.stopPropagation();
      }
    },

    handleInputLocal(e) {
      // If something is already selected when the user types, it should clear selection
      if (this.get('select.selected')) {
        this.get('select').actions.select(null);
      }
      this.get('onInput')(e.target ? e : { target: { value: e } });
    },

    resetButtonDestroyed() {
      if (this.get('disabled')) {
        this.set('resetButtonDestroyed', true);
      }
    }
  },
  // Methods
  getSelectedAsText() {
    let labelPath = this.get('extra.labelPath');
    if (labelPath) {
      return this.get(`select.selected.${labelPath}`);
    } else {
      return this.get('select.selected');
    }
  }
});
