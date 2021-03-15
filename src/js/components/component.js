/**
 * Copyright (C) 2020 The Trustees of Indiana University
 * SPDX-License-Identifier: BSD-3-Clause
 */

export default class Component {

  constructor(selector, options) {
    if (selector) {
      this.element = document.querySelector(selector);
      this.init(options);
      this.connected();
    }
  }

  dispatchCustomEvent(name, element, detail) {
    const prefix = Rivet.config.prefix;
    const event = new CustomEvent(`${prefix}:${name}`, {
      bubbles: true,
      cancelable: true,
      detail
    });
  
    return element.dispatchEvent(event);
  }

  destroy() {
    this.disconnected();
  }

}