/**
 * Copyright (C) 2018 The Trustees of Indiana University
 * SPDX-License-Identifier: BSD-3-Clause
 */

import dispatchCustomEvent from '../utilities/dispatchCustomEvent';
import { nodeListToArray } from '../utilities/domHelpers';
import keyCodes from '../utilities/keyCodes';

export default class Dropdown {
  constructor(element) {
    this.element = element;
    this.focusableElements = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]';

    this.dropdownAttribute = '[data-dropdown]';

    this.toggleAttribute = '[data-dropdown-toggle]';
    this.toggleElement = this.element.querySelector(this.toggleAttribute);

    this.menuAttribute = '[data-dropdown-menu]';
    this.menuElement = this.element.querySelector(this.menuAttribute);

    // Keeps track of the currently active dropdown
    this.isOpen = false;
    this.activeToggle = null;
    this.activeMenu = null;

    // Bind methods
    this._handleClick = this._handleClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);

    // Make sure icons don't receive focus
    this.element.querySelector('svg').setAttribute('focusable', 'false');

    this.init();
  }

  open() {
    // Return if disabled dropdown is being opened programmatically
    if (this.toggleElement.hasAttribute('disabled')) {
      return;
    }

    const openEvent = dispatchCustomEvent(
      'dropdownOpen',
      this.toggleElement,
      {
        id: this.toggleElement.dataset.dropdownToggle
      }
    );

    if (!openEvent) return;

    this.isOpen = true;

    this.toggleElement.setAttribute('aria-expanded', 'true');

    // Remove the 'hidden' attribute to show the menu
    this.menuElement.removeAttribute('hidden');

    // Set currently active toggle and menu
    this.activeToggle = this.toggleElement;
    this.activeMenu = this.menuElement;
  }

  close() {
    /**
     * If there isn't a currently active dropdown, then bail so close() isn't 
     * fired multiple times.
     */
    if (!this.activeToggle) return;

    const closeEvent = dispatchCustomEvent(
      'dropdownClose',
      this.toggleElement,
      {
        id: this.toggleElement.dataset.dropdownToggle
      }
    );

    if (!closeEvent) return;

    this.isOpen = false;

    this.activeToggle.setAttribute('aria-expanded', 'false');
    this.activeMenu.setAttribute('hidden', '');

    // Resets the state variables
    this.activeToggle = null;
    this.activeMenu = null;
  }

  /**
   * Creates an object of menu items within a dropdown
   * @param {HTMLDivElement} menu - a div containing the dropdown menu items
   * @returns {Object} An object of menu item anchor elements
   */
  _setUpMenu(menu) {
    const menuObject = {};

    // Create a real Array of all the focusable elements in the menu
    const menuFocusables = nodeListToArray(menu.querySelectorAll(this.focusableElements));

    // Create a property to hold an array of all focusables
    menuObject.all = menuFocusables;

    // Create a property with a reference to the first focusable
    menuObject.first = menuFocusables[0];

    // Create a property with a reference to the last focusable
    menuObject.last = menuFocusables[menuFocusables.length - 1];

    return menuObject;
  }

  _handleClick(event) {
    const toggle = event.target.closest(this.toggleAttribute);

    // Did it come from inside open menu?
    if (this.menuElement.contains(event.target)) return;

    // If it came from outside component, close all open dropdowns
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

  _handleKeydown(event) {
    // If the keydown didn't come from within dropdown component, then bail.
    if (!this.element.contains(event.target)) return;

    // Delegate event to only this instance of the dropdown
    const dropdown = event.target.closest(this.dropdownAttribute);
    if (dropdown !== this.element) return;

    switch (event.keyCode) {
      case keyCodes.down: {
        event.preventDefault();

        /**
         * Open the menu if it hasn't been opened yet.
         * Move the focus to the first item if the menu has been opened.
         */
        if (!this.isOpen) {
          this.open();
        } else {
          const currentMenu = this._setUpMenu(this.menuElement);
          currentMenu.first.focus();
        }

        /**
         * Handle down arrow key when inside the open menu.
         * If the event didn't come from within the menu, then bail.
         */
        if (!this.menuElement.contains(event.target)) break;

        /**
         * This keeps track of which button/focusable is focused in the open menu
         */
        const currentMenu = this._setUpMenu(this.menuElement);
        let currentIndex;

        for (let i = 0; i < currentMenu.all.length; i++) {
          if (event.target == currentMenu.all[i]) {
            currentIndex = i;
          }
        }

        const nextItem = currentMenu.all[currentIndex + 1];

        if (!nextItem) {
          currentMenu.first.focus();

          return;
        }

        nextItem.focus();

        break;
      }

      case keyCodes.up: {
        event.preventDefault();

        /**
         * Handle up arrow key when inside the open menu.
         * If the event didn't come from within the menu, then bail.
         */
        if (!this.menuElement.contains(event.target)) break;

        /**
         * This keeps track of which button/focusable is focused in the open menu
         */
        const currentMenu = this._setUpMenu(this.menuElement);
        let currentIndex;

        for (let i = 0; i < currentMenu.all.length; i++) {
          if (event.target == currentMenu.all[i]) {
            currentIndex = i;
          }
        }

        const previousItem = currentMenu.all[currentIndex - 1];

        if (!previousItem && currentMenu.last !== undefined) {
          currentMenu.last.focus();

          return;
        }

        previousItem.focus();

        break;
      }

      case keyCodes.escape: {
        if (!this.activeToggle) return;

        // If there's an open menu, close it.
        this.close();

        this.toggleElement.focus();

        /**
         * Resets the state variables so as not to interfere with other
         * Escape key handlers/interactions
         */
        this.activeToggle = null;

        break;
      }

      case keyCodes.tab: {
        /**
         * Handle tab key when inside the open menu.
         */
        if (!this.menuElement.contains(event.target)) break;

        const currentMenu = this._setUpMenu(this.menuElement);

        // Close the dropdown when the user tabs out of the menu.
        if (document.activeElement == currentMenu.last && !event.shiftKey) {
          this.close();

          return;
        }

        break;
      }
    }
  }

  init() {
    document.addEventListener('click', this._handleClick, false);
    document.addEventListener('keydown', this._handleKeydown, false);
  }

  destroy() {
    document.removeEventListener('click', this._handleClick, false);
    document.removeEventListener('keydown', this._handleKeydown, false);
  }
}