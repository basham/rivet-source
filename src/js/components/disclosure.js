/**
 * Copyright (C) 2021 The Trustees of Indiana University
 * SPDX-License-Identifier: BSD-3-Clause
 */

import keyCodes from '../utilities/keyCodes';
import Component from './component';

/** 
 * The Disclosure class represents a Rivet disclosure component. A disclosure
 * component provides an interactable toggle element that can be used to hide
 * or show some other element, such as an accordion fold.
 * 
 * @extends Component
 */

export default class Disclosure extends Component {

  /**
   * Gets the default initialization options for the Disclosure component.
   * 
   * @static
   * @return {Object} Default options
   */

  static get defaultOptions() {
    return {
      disclosureAttribute: '[data-disclosure]',
      toggleAttribute: '[data-disclosure-toggle]',
      toggleDataProperty: 'toggle',
      targetAttribute: '[data-disclosure-target]',
      openEventName: 'disclosureOpen',
      closeEventName: 'disclosureClose'
    };
  }

  /**
   * Creates a Disclosure component instance. Only called directly by the
   * client when they are using Rivet in "manual" component initialization
   * mode. In "auto" mode, the constructor is called on the client's behalf
   * using the static `Disclosure.initAll()` method.
   * 
   * @param {string} selector - CSS selector of disclosure element
   * @param {object} options - Component configuration options
   */

  constructor(selector = null, options = null) {
    super(selector, options);
  }

  /**
   * Initializes all Disclosure components as web components, including those
   * not yet added to the DOM. Only called directly by the client when they
   * are using Rivet in "module" component initialization mode. In "auto" mode,
   * the global `Rivet.init()` method calls this method on the client's behalf.
   * 
   * @static
   * @param {string} selector - Optional selector to use instead of default
   */

  static initAll(selector = null) {
    selector = selector ?? Disclosure.defaultOptions().disclosureAttribute;
    
    // The automatic web component initializer accepts an empty Disclosure
    // instance it uses to "stamp out" specific instances of the component that
    // get added to the DOM. These components are regular DOM elements that are
    // "upgraded" to have the same methods/properties as the Disclosure class.

    define(selector, new Disclosure());
  }

  /**
   * Initializes the Disclosure instance. Called by the constructor when the
   * client is using Rivet in "manual" component initialization mode; otherwise
   * this method is called by the automatic web component initializer.
   * 
   * @param {object} options - Component configuration options
   */

  init(options = null) {
    options = Object.assign(Disclosure.defaultOptions(), options ?? {});

    this._initAttributes(options);
    this._initEventNames(options);
    this._initChildElements();
    this._initEventListeners();
    this._initState();
    this._excludeIconsFromFocus();
  }

  /**
   * Initializes the Disclosure component's element attribute selectors.
   * 
   * @param {object} options - Component configuration options
   */

  _initAttributes(options) {
    this.disclosureAttribute = options.disclosureAttribute;
    this.toggleAttribute = options.toggleAttribute;
    this.toggleDataProperty = options.toggleDataProperty;
    this.targetAttribute = options.targetAttribute;
  }

  /**
   * Initializes the Disclosure component's custom event names.
   * 
   * @param {object} options - Component configuration options
   */

  _initEventNames(options) {
    this.openEventName = options.openEventName;
    this.closeEventName = options.closeEventName;
  }

  /**
   * Initializes the Disclosure component's child element references.
   */

  _initChildElements() {
    this.toggleElement = this.element.querySelector(this.toggleAttribute);
    this.targetElement = this.element.querySelector(this.targetAttribute);
  }

  /**
   * Initializes the Disclosure component's event listeners.
   */

  _initEventListeners() {
    this._handleClick = this._handleClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  /**
   * Initializes the Disclosure component's state management variables.
   */

  _initState() {
    this.isOpen = false;
    this.activeToggle = null;
    this.activeDisclosure = null;
  }

  /**
   * Excludes icons within the Disclosure component from receiving focus.
   */

  _excludeIconsFromFocus() {
    this.element.querySelector('svg').setAttribute('focusable', 'false');
  }

  /**
   * Activates the Disclosure component when it is added to the DOM in "auto"
   * component initialization mode. In "manual" initialization mode, this
   * method is called when the Disclosure constructor is called by the client.
   */
  
  connected() {
    document.addEventListener('click', this._handleClick, false);
    document.addEventListener('keydown', this._handleKeydown, false);
  }

  /**
   * Deactivates the Disclosure component when it is removed from the DOM in
   * "auto" component initialization mode. In "manual" initialization mode,
   * this method is called when client explicitly calls a Disclosure instance's
   * destroy() method.
   */

  disconnected() {
    document.removeEventListener('click', this._handleClick, false);
    document.removeEventListener('keydown', this._handleKeydown, false);
  }

  /**
   * Opens the Disclosure component.
   */

  open() {
    if (this.toggleElement.hasAttribute('disabled')) return;
    if ( ! this._fireOpenEvent()) return;

    this.isOpen = true;
    this.toggleElement.setAttribute('aria-expanded', 'true');
    this.targetElement.removeAttribute('hidden');
    this.activeToggle = this.toggleElement;
    this.activeDisclosure = this.targetElement;
  }

  /**
   * Fires a custom browser event indicating the Disclosure was opened.
   * 
   * @return {boolean} Whether or not the event was cancelled
   */

  _fireOpenEvent() {
    return this.dispatchCustomEvent(
      this.openEventName,
      this.toggleElement,
      {
        id: this.toggleElement.dataset[this.toggleDataProperty]
      }
    );
  }

  /**
   * Closes the Disclosure component.
   */

  close() {
    if ( ! this.activeToggle) return;
    if ( ! this._fireCloseEvent()) return;

    this.isOpen = false;
    this.activeToggle.setAttribute('aria-expanded', 'false');
    this.activeDisclosure.setAttribute('hidden', '');
    this.activeToggle = null;
    this.activeDisclosure = null;
  }

  /**
   * Fires a custom browser event indicating the Disclosure was closed.
   * 
   * @return {boolean} Event was cancelled?
   */

  _fireCloseEvent() {
    return this.dispatchCustomEvent(
      this.closeEventName,
      this.toggleElement,
      {
        id: this.toggleElement.dataset[this.toggleDataProperty]
      }
    );
  }

  /**
   * Handles a click event received by the Disclosure component.
   * 
   * @param {Event} event - Click event
   */

  _handleClick(event) {
    const toggle = event.target.closest(this.toggleAttribute);

    if (this._clickOriginatedInOpenDisclosure(event)) return;

    // If it came from outside component, close all open disclosures
    if (!toggle && this.activeToggle !== null) {
      this.close();
      return;
    }

    // Check which toggle the click came from, and whether it's already opened
    if (toggle !== this.toggleElement || this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Returns true if the given click event originated in an open Disclosure.
   * 
   * @return {boolean} Click originated in open disclosure?
   */

  _clickOriginatedInOpenDisclosure(event) {
    return this.targetElement.contains(event.target);
  }

  /**
   * Returns true if the Disclosure component should handle the given
   * keydown event.
   * 
   * @return {boolean} Should handle keydown event?
   */

  _shouldHandleKeydown(event) {
    // If the keydown didn't come from within disclosure component, then bail.
    if (!this.element.contains(event.target)) return false;

    // Delegate event to only this instance of the disclosure
    const disclosure = event.target.closest(this.disclosureAttribute);
    if (disclosure !== this.element) return false;

    return true;
  }

  /**
   * Handles a keydown event received by the Disclosure component.
   * 
   * @param {Event} event - Keydown event
   */

  _handleKeyDown(event) {
    if (!this._shouldHandleKeydown(event)) return;

    switch (event.keyCode) {
      case keyCodes.escape: {
        if (!this.activeToggle) return;

        // If there's an open disclosure, close it.
        this.close();

        this.toggleElement.focus();

        /**
         * Resets the state variables so as not to interfere with other
         * Escape key handlers/interactions
         */
        this.activeToggle = null;

        break;
      }
    }
  }

}